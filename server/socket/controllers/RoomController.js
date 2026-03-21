import MESSAGE_TYPES from "../utils/messageTypes.js";
import { getWebSocketByUserId } from "../services/userConnections.js";
import { redisClient } from "../config/redisClient.js";
import { nanoid } from "nanoid";
import {
  addToRoom,
  broadcast,
  removeFromRoom,
  clearRoom,
} from "../utils/roomUtils.js";

class RoomController {
  constructor() {
    this.pendingJoinRequests = new Map();
    this.pendingJoinRequestTimeouts = new Map();
    this.joinRequestTimeoutMs = 2 * 60 * 1000;
  }

  parseBoolean(value, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalizedValue = value.toLowerCase();
      if (normalizedValue === "true") return true;
      if (normalizedValue === "false") return false;
    }
    return fallback;
  }

  parseNumber(value, fallback = 0) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  getCurrentRoomTimestamp(roomState, nowMs = Date.now()) {
    const baseTimestamp = Math.max(
      0,
      this.parseNumber(roomState?.timestamp, 0),
    );
    const isPlaying = this.parseBoolean(roomState?.isPlaying, false);
    const updatedAt = this.parseNumber(roomState?.updatedAt, nowMs);

    if (!isPlaying) {
      return baseTimestamp;
    }

    const elapsedSeconds = Math.max(0, (nowMs - updatedAt) / 1000);
    return baseTimestamp + elapsedSeconds;
  }

  buildRoomJoinedPayload(roomState, roomId, members, nowMs = Date.now()) {
    return {
      ...roomState,
      roomId,
      members,
      songId: roomState?.songId || "",
      isPlaying: this.parseBoolean(roomState?.isPlaying, false),
      timestamp: this.getCurrentRoomTimestamp(roomState, nowMs),
      updatedAt: this.parseNumber(roomState?.updatedAt, nowMs),
      serverTime: nowMs,
    };
  }

  getJoinRequestKey(roomId, userId) {
    return `${roomId}:${userId}`;
  }

  setPendingJoinRequest(roomId, userId, requestData) {
    const key = this.getJoinRequestKey(roomId, userId);
    const existingTimeout = this.pendingJoinRequestTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.pendingJoinRequests.set(key, requestData);

    const timeout = setTimeout(() => {
      this.pendingJoinRequests.delete(key);
      this.pendingJoinRequestTimeouts.delete(key);
    }, this.joinRequestTimeoutMs);

    this.pendingJoinRequestTimeouts.set(key, timeout);
  }

  getPendingJoinRequest(roomId, userId) {
    const key = this.getJoinRequestKey(roomId, userId);
    return this.pendingJoinRequests.get(key) || null;
  }

  clearPendingJoinRequest(roomId, userId) {
    const key = this.getJoinRequestKey(roomId, userId);
    const timeout = this.pendingJoinRequestTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
    }
    this.pendingJoinRequestTimeouts.delete(key);
    this.pendingJoinRequests.delete(key);
  }

  clearPendingRequestsForRoom(roomId) {
    const keyPrefix = `${roomId}:`;
    for (const key of this.pendingJoinRequests.keys()) {
      if (!key.startsWith(keyPrefix)) continue;
      const timeout = this.pendingJoinRequestTimeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
      }
      this.pendingJoinRequestTimeouts.delete(key);
      this.pendingJoinRequests.delete(key);
    }
  }

  async getValidWebSocket(userId) {
    const ws = await getWebSocketByUserId(userId);
    if (!ws || typeof ws.send !== "function") {
      console.error(`Invalid WebSocket object for userId: ${userId}.`);
      return null;
    }
    return ws;
  }

  async getRoomMembers(roomId) {
    const membersHash = await redisClient.hgetall(`room:${roomId}:members`);
    return Object.entries(membersHash || {}).map(([userId, username]) => ({
      userId,
      username,
    }));
  }

  async setUserActiveRoom(userId, roomId) {
    await redisClient.hset("user:activeRoom", userId, roomId);
  }

  async removeUserActiveRoom(userId) {
    await redisClient.hdel("user:activeRoom", userId);
  }

  async getUserActiveRoom(userId) {
    return await redisClient.hget("user:activeRoom", userId);
  }

  async createRoom(payload) {
    try {
      const {
        createdBy,
        createdById,
        songId: initialSongId = "",
        isPlaying: initialIsPlaying = false,
        timestamp: initialTimestamp = 0,
      } = payload || {};

      const roomId = nanoid(10);

      console.log(`Creating room ${roomId} by user ${createdBy}`);

      const normalizedSongId =
        typeof initialSongId === "string" ? initialSongId : "";
      const normalizedTimestamp = Math.max(
        0,
        this.parseNumber(initialTimestamp, 0),
      );
      const normalizedIsPlaying =
        normalizedSongId.length > 0 &&
        this.parseBoolean(initialIsPlaying, false);

      // create room state
      await redisClient.hset(`room:${roomId}`, {
        hostId: createdById,
        hostName: createdBy,
        songId: normalizedSongId,
        isPlaying: String(normalizedIsPlaying),
        timestamp: String(normalizedTimestamp),
        updatedAt: String(Date.now()),
      });

      // add creator as member (hash: userId -> username)
      await redisClient.hset(`room:${roomId}:members`, createdById, createdBy);

      // set reverse mapping so user can rejoin on reconnect
      await this.setUserActiveRoom(createdById, roomId);

      // auto cleanup (10 hours)
      await redisClient.expire(`room:${roomId}`, 36000);
      await redisClient.expire(`room:${roomId}:members`, 36000);

      const senderWs = await this.getValidWebSocket(createdById);

      // Add to in-memory room map
      addToRoom(roomId, senderWs);

      const members = await this.getRoomMembers(roomId);

      if (senderWs) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ROOM_CREATED,
            payload: {
              roomId,
              hostId: createdById,
              members,
            },
          }),
        );
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  }

  async joinRoom(payload, socketUserId = null) {
    try {
      const { roomId, username = "User" } = payload || {};
      const userId = socketUserId || payload?.userId;
      if (!roomId || !userId) return;

      const exists = await redisClient.exists(`room:${roomId}`);

      const senderWs = await this.getValidWebSocket(userId);
      if (!senderWs) return;

      if (!exists) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Room not found" },
          }),
        );
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      const hostId = roomState?.hostId;
      if (!hostId) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Room state unavailable" },
          }),
        );
        return;
      }

      const existingMember = await redisClient.hget(
        `room:${roomId}:members`,
        userId,
      );
      if (existingMember) {
        addToRoom(roomId, senderWs);
        await this.setUserActiveRoom(userId, roomId);

        const members = await this.getRoomMembers(roomId);
        const payload = this.buildRoomJoinedPayload(
          roomState,
          roomId,
          members,
          Date.now(),
        );
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ROOM_JOINED,
            payload,
          }),
        );
        return;
      }

      if (hostId === userId) {
        addToRoom(roomId, senderWs);
        await redisClient.hset(`room:${roomId}:members`, userId, username);
        await this.setUserActiveRoom(userId, roomId);

        const members = await this.getRoomMembers(roomId);
        const payload = this.buildRoomJoinedPayload(
          roomState,
          roomId,
          members,
          Date.now(),
        );
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ROOM_JOINED,
            payload,
          }),
        );
        broadcast(roomId, {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        });
        return;
      }

      const hostWs = await this.getValidWebSocket(hostId);
      if (!hostWs || hostWs.readyState !== hostWs.OPEN) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Host is offline. Please try again later." },
          }),
        );
        return;
      }

      const requestedAt = Date.now();
      this.setPendingJoinRequest(roomId, userId, {
        roomId,
        userId,
        username,
        requestedAt,
      });

      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOIN_REQUEST_SENT,
          payload: {
            roomId,
            message: "Join request sent to host. Waiting for approval.",
          },
        }),
      );

      hostWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOIN_REQUEST,
          payload: {
            roomId,
            userId,
            username,
            requestedAt,
          },
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }

  async respondToJoinRoomRequest(payload, hostUserId) {
    try {
      const { roomId, requesterId, approved } = payload || {};
      if (
        !roomId ||
        !requesterId ||
        typeof approved !== "boolean" ||
        !hostUserId
      ) {
        return;
      }

      const hostWs = await this.getValidWebSocket(hostUserId);
      if (!hostWs) return;

      const exists = await redisClient.exists(`room:${roomId}`);
      if (!exists) {
        this.clearPendingJoinRequest(roomId, requesterId);
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Room not found" },
          }),
        );
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      if (roomState?.hostId !== hostUserId) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Only the host can approve room joins" },
          }),
        );
        return;
      }

      const pendingRequest = this.getPendingJoinRequest(roomId, requesterId);
      if (!pendingRequest) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Join request expired or not found" },
          }),
        );
        return;
      }

      this.clearPendingJoinRequest(roomId, requesterId);

      const requesterWs = await this.getValidWebSocket(requesterId);
      if (!requesterWs) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Requester is no longer online" },
          }),
        );
        return;
      }

      if (!approved) {
        requesterWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ROOM_JOIN_DECLINED,
            payload: {
              roomId,
              message: "Host declined your join request",
            },
          }),
        );
        return;
      }

      addToRoom(roomId, requesterWs);
      await redisClient.hset(
        `room:${roomId}:members`,
        requesterId,
        pendingRequest.username || "User",
      );
      await this.setUserActiveRoom(requesterId, roomId);

      const latestState = await redisClient.hgetall(`room:${roomId}`);
      const members = await this.getRoomMembers(roomId);
      const payloadToRequester = this.buildRoomJoinedPayload(
        latestState,
        roomId,
        members,
        Date.now(),
      );

      requesterWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload: payloadToRequester,
        }),
      );

      broadcast(
        roomId,
        {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        },
        requesterWs,
      );
    } catch (error) {
      console.log(error);
    }
  }

  async kickRoomMember(payload, hostUserId) {
    try {
      const { roomId, targetUserId } = payload || {};
      if (!roomId || !targetUserId || !hostUserId) return;

      const hostWs = await this.getValidWebSocket(hostUserId);
      if (!hostWs) return;

      const exists = await redisClient.exists(`room:${roomId}`);
      if (!exists) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Room not found" },
          }),
        );
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      if (roomState?.hostId !== hostUserId) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Only the host can remove members" },
          }),
        );
        return;
      }

      if (targetUserId === hostUserId) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Host cannot remove themselves from the room" },
          }),
        );
        return;
      }

      const targetUsername = await redisClient.hget(
        `room:${roomId}:members`,
        targetUserId,
      );
      if (!targetUsername) {
        hostWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "User is not in this room" },
          }),
        );
        return;
      }

      this.clearPendingJoinRequest(roomId, targetUserId);
      await this.removeUserActiveRoom(targetUserId);
      await redisClient.hdel(`room:${roomId}:members`, targetUserId);

      const targetWs = await getWebSocketByUserId(targetUserId);
      if (targetWs && typeof targetWs.send === "function") {
        removeFromRoom(roomId, targetWs);
        targetWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.REMOVED_FROM_ROOM,
            payload: {
              roomId,
              message: "You were removed from the room by the host",
            },
          }),
        );
      }

      const members = await this.getRoomMembers(roomId);
      broadcast(roomId, {
        type: MESSAGE_TYPES.MEMBERS_UPDATED,
        payload: { members, roomId },
      });

      hostWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_MEMBER_REMOVED,
          payload: {
            roomId,
            userId: targetUserId,
            username: targetUsername,
          },
        }),
      );
    } catch (error) {
      console.error("Failed to remove room member:", error);
    }
  }

  async rejoinRoom(userId) {
    try {
      const roomId = await this.getUserActiveRoom(userId);
      if (!roomId) return null;

      const exists = await redisClient.exists(`room:${roomId}`);
      if (!exists) {
        await this.removeUserActiveRoom(userId);
        return null;
      }

      const senderWs = await this.getValidWebSocket(userId);
      if (!senderWs) return null;

      addToRoom(roomId, senderWs);

      const state = await redisClient.hgetall(`room:${roomId}`);
      const members = await this.getRoomMembers(roomId);
      const payload = this.buildRoomJoinedPayload(
        state,
        roomId,
        members,
        Date.now(),
      );

      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload,
        }),
      );

      return roomId;
    } catch (error) {
      console.error("Failed to rejoin room:", error);
      return null;
    }
  }

  async syncAction(payload) {
    const { roomId, action, userId } = payload;

    if (!roomId) return;

    const exists = await redisClient.exists(`room:${roomId}`);

    const senderWs = await this.getValidWebSocket(userId);
    if (!senderWs) return;

    if (!exists) {
      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room not found" },
        }),
      );
      return;
    }

    const roomState = await redisClient.hgetall(`room:${roomId}`);
    const now = Date.now();
    const currentIsPlaying = this.parseBoolean(roomState?.isPlaying, false);
    const currentTimestamp = this.getCurrentRoomTimestamp(roomState, now);

    switch (action) {
      case "HANDLE_SONG_PLAY": {
        const actionTime = Date.now();
        const nextIsPlaying =
          typeof payload?.isPlaying === "boolean"
            ? payload.isPlaying
            : !currentIsPlaying;
        const nextTimestamp = Math.max(
          0,
          this.parseNumber(payload?.timestamp, currentTimestamp),
        );

        await redisClient.hset(`room:${roomId}`, {
          isPlaying: String(nextIsPlaying),
          timestamp: String(nextTimestamp),
          updatedAt: String(actionTime),
        });

        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.HANDLE_SONG_PLAY,
            payload: {
              isPlaying: nextIsPlaying,
              timestamp: nextTimestamp,
              serverTime: actionTime,
            },
          },
          senderWs,
        );
        break;
      }
      case "PLAY_SONG": {
        if (!payload?.songId) {
          console.warn("PLAY_SONG called without songId");
          break;
        }
        const actionTime = Date.now();
        const nextIsPlaying =
          typeof payload?.isPlaying === "boolean" ? payload.isPlaying : true;
        const nextTimestamp = Math.max(
          0,
          this.parseNumber(payload?.timestamp, 0),
        );

        await redisClient.hset(`room:${roomId}`, {
          songId: payload.songId,
          isPlaying: String(nextIsPlaying),
          timestamp: String(nextTimestamp),
          updatedAt: String(actionTime),
        });

        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.PLAY_SONG,
            payload: {
              songId: payload.songId,
              isPlaying: nextIsPlaying,
              timestamp: nextTimestamp,
              serverTime: actionTime,
            },
          },
          senderWs,
        );
        break;
      }

      case "SEEK": {
        const actionTime = Date.now();
        const nextTimestamp = Math.max(
          0,
          this.parseNumber(payload?.timestamp, currentTimestamp),
        );

        await redisClient.hset(`room:${roomId}`, {
          timestamp: String(nextTimestamp),
          updatedAt: String(actionTime),
        });

        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.SEEK,
            payload: {
              musicSeekTime: payload.musicSeekTime,
              timestamp: nextTimestamp,
              serverTime: actionTime,
            },
          },
          senderWs,
        );
        break;
      }

      case "SEND_CHAT":
        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.RECEIVE_CHAT,
            payload: { chat: payload.chat },
          },
          senderWs,
        );
        break;

      default:
        console.warn(`Unknown action type: ${action}`);
    }
  }

  async leaveRoom(payload) {
    try {
      const { roomId, userId } = payload;
      if (!roomId || !userId) return;

      const exists = await redisClient.exists(`room:${roomId}`);
      const senderWs = await this.getValidWebSocket(userId);
      if (!senderWs) return;

      if (!exists) {
        await this.removeUserActiveRoom(userId);
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            payload: { message: "Room not found" },
          }),
        );
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      const isHostLeaving = roomState?.hostId === userId;

      // remove user's active room mapping
      await this.removeUserActiveRoom(userId);

      if (isHostLeaving) {
        // clear active room mapping for all members
        const members = await this.getRoomMembers(roomId);
        for (const member of members) {
          await this.removeUserActiveRoom(member.userId);
        }
        this.clearPendingRequestsForRoom(roomId);

        broadcast(roomId, {
          type: MESSAGE_TYPES.ROOM_CLOSED,
          payload: {
            roomId,
            message: "Room closed by host",
          },
        });
        clearRoom(roomId);
        await redisClient.del(`room:${roomId}`, `room:${roomId}:members`);
        return;
      }

      removeFromRoom(roomId, senderWs);
      await redisClient.hdel(`room:${roomId}:members`, userId);

      const membersCount = await redisClient.hlen(`room:${roomId}:members`);
      if (membersCount === 0) {
        this.clearPendingRequestsForRoom(roomId);
        clearRoom(roomId);
        await redisClient.del(`room:${roomId}`, `room:${roomId}:members`);
      } else {
        // broadcast updated member list to remaining users
        const members = await this.getRoomMembers(roomId);
        broadcast(roomId, {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        });
      }

      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_LEFT,
          payload: { roomId },
        }),
      );
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  }
}

const RoomControllerInstance = new RoomController();

export default RoomControllerInstance;

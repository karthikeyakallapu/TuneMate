import MESSAGE_TYPES from "../utils/messageTypes.js";
import { getLocalWebSocketByUserId } from "../services/userConnections.js";
import { redisClient } from "../config/redisClient.js";
import { nanoid } from "nanoid";
import {
  addToRoom,
  removeFromRoom,
  clearRoom,
} from "../utils/roomUtils.js";
import { publishRoomEvent, publishUserEvent } from "../services/pubSubBridge.js";

class RoomController {
  constructor() {
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
    return `room:${roomId}:joinRequest:${userId}`;
  }

  getPendingJoinRequestSetKey(roomId) {
    return `room:${roomId}:joinRequest:members`;
  }

  async setPendingJoinRequest(roomId, userId, requestData) {
    const key = this.getJoinRequestKey(roomId, userId);
    const setKey = this.getPendingJoinRequestSetKey(roomId);
    const serializedRequest = JSON.stringify(requestData || {});
    const ttlMs = this.joinRequestTimeoutMs;

    await redisClient
      .multi()
      .set(key, serializedRequest, "PX", ttlMs)
      .sadd(setKey, userId)
      .pexpire(setKey, ttlMs)
      .exec();
  }

  async getPendingJoinRequest(roomId, userId) {
    const key = this.getJoinRequestKey(roomId, userId);
    const serializedRequest = await redisClient.get(key);
    if (!serializedRequest) return null;

    try {
      return JSON.parse(serializedRequest);
    } catch (error) {
      console.error("Failed to parse pending join request:", error);
      return null;
    }
  }

  async clearPendingJoinRequest(roomId, userId) {
    const key = this.getJoinRequestKey(roomId, userId);
    const setKey = this.getPendingJoinRequestSetKey(roomId);

    await redisClient.multi().del(key).srem(setKey, userId).exec();
  }

  async clearPendingRequestsForRoom(roomId) {
    const setKey = this.getPendingJoinRequestSetKey(roomId);
    const pendingUserIds = await redisClient.smembers(setKey);

    if (!pendingUserIds || pendingUserIds.length === 0) {
      await redisClient.del(setKey);
      return;
    }

    const pipeline = redisClient.pipeline();
    for (const pendingUserId of pendingUserIds) {
      pipeline.del(this.getJoinRequestKey(roomId, pendingUserId));
    }
    pipeline.del(setKey);
    await pipeline.exec();
  }

  async getValidWebSocket(userId) {
    const ws = getLocalWebSocketByUserId(userId);
    if (!ws || typeof ws.send !== "function") return null;
    return ws;
  }

  async emitToUser(userId, message) {
    if (!userId || !message) return;
    await publishUserEvent({ userId, message });
  }

  async emitToRoom(roomId, message, excludeUserId = null) {
    if (!roomId || !message) return;
    await publishRoomEvent({
      roomId,
      message,
      excludeUserId,
    });
  }

  async isUserOnline(userId) {
    if (!userId) return false;
    const wsId = await redisClient.hget("user:wsid", userId);
    return Boolean(wsId);
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

      await this.emitToUser(createdById, {
        type: MESSAGE_TYPES.ROOM_CREATED,
        payload: {
          roomId,
          hostId: createdById,
          members,
        },
      });
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
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room not found" },
        });
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      const hostId = roomState?.hostId;
      if (!hostId) {
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room state unavailable" },
        });
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
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload,
        });
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
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload,
        });
        await this.emitToRoom(roomId, {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        });
        return;
      }

      const hostIsOnline = await this.isUserOnline(hostId);
      if (!hostIsOnline) {
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Host is offline. Please try again later." },
        });
        return;
      }

      const requestedAt = Date.now();
      await this.setPendingJoinRequest(roomId, userId, {
        roomId,
        userId,
        username,
        requestedAt,
      });

      await this.emitToUser(userId, {
        type: MESSAGE_TYPES.ROOM_JOIN_REQUEST_SENT,
        payload: {
          roomId,
          message: "Join request sent to host. Waiting for approval.",
        },
      });

      await this.emitToUser(hostId, {
        type: MESSAGE_TYPES.ROOM_JOIN_REQUEST,
        payload: {
          roomId,
          userId,
          username,
          requestedAt,
        },
      });
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
        await this.clearPendingJoinRequest(roomId, requesterId);
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room not found" },
        });
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      if (roomState?.hostId !== hostUserId) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Only the host can approve room joins" },
        });
        return;
      }

      const pendingRequest = await this.getPendingJoinRequest(
        roomId,
        requesterId,
      );
      if (!pendingRequest) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Join request expired or not found" },
        });
        return;
      }

      await this.clearPendingJoinRequest(roomId, requesterId);

      const requesterIsOnline = await this.isUserOnline(requesterId);
      if (!requesterIsOnline) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Requester is no longer online" },
        });
        return;
      }

      if (!approved) {
        await this.emitToUser(requesterId, {
          type: MESSAGE_TYPES.ROOM_JOIN_DECLINED,
          payload: {
            roomId,
            message: "Host declined your join request",
          },
        });
        return;
      }

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

      await this.emitToUser(requesterId, {
        type: MESSAGE_TYPES.ROOM_JOINED,
        payload: payloadToRequester,
      });

      await this.emitToRoom(roomId, {
        type: MESSAGE_TYPES.MEMBERS_UPDATED,
        payload: { members, roomId },
      });
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
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room not found" },
        });
        return;
      }

      const roomState = await redisClient.hgetall(`room:${roomId}`);
      if (roomState?.hostId !== hostUserId) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Only the host can remove members" },
        });
        return;
      }

      if (targetUserId === hostUserId) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Host cannot remove themselves from the room" },
        });
        return;
      }

      const targetUsername = await redisClient.hget(
        `room:${roomId}:members`,
        targetUserId,
      );
      if (!targetUsername) {
        await this.emitToUser(hostUserId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "User is not in this room" },
        });
        return;
      }

      await this.clearPendingJoinRequest(roomId, targetUserId);
      await this.removeUserActiveRoom(targetUserId);
      await redisClient.hdel(`room:${roomId}:members`, targetUserId);

      const targetWs = await this.getValidWebSocket(targetUserId);
      if (targetWs) {
        removeFromRoom(roomId, targetWs);
      }

      await this.emitToUser(targetUserId, {
        type: MESSAGE_TYPES.REMOVED_FROM_ROOM,
        payload: {
          roomId,
          message: "You were removed from the room by the host",
        },
      });

      const members = await this.getRoomMembers(roomId);
      await this.emitToRoom(roomId, {
        type: MESSAGE_TYPES.MEMBERS_UPDATED,
        payload: { members, roomId },
      });

      await this.emitToUser(hostUserId, {
        type: MESSAGE_TYPES.ROOM_MEMBER_REMOVED,
        payload: {
          roomId,
          userId: targetUserId,
          username: targetUsername,
        },
      });
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

      await this.emitToUser(userId, {
        type: MESSAGE_TYPES.ROOM_JOINED,
        payload,
      });

      return roomId;
    } catch (error) {
      console.error("Failed to rejoin room:", error);
      return null;
    }
  }

  async syncAction(payload, socketUserId = null) {
    const { roomId, action } = payload || {};
    const userId = socketUserId || payload?.userId;

    if (!roomId || !userId) return;

    const exists = await redisClient.exists(`room:${roomId}`);

    if (!exists) {
      await this.emitToUser(userId, {
        type: MESSAGE_TYPES.ERROR,
        payload: { message: "Room not found" },
      });
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

        await this.emitToRoom(
          roomId,
          {
            type: MESSAGE_TYPES.HANDLE_SONG_PLAY,
            payload: {
              isPlaying: nextIsPlaying,
              timestamp: nextTimestamp,
              serverTime: actionTime,
            },
          },
          userId,
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

        await this.emitToRoom(
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
          userId,
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

        await this.emitToRoom(
          roomId,
          {
            type: MESSAGE_TYPES.SEEK,
            payload: {
              musicSeekTime: payload.musicSeekTime,
              timestamp: nextTimestamp,
              serverTime: actionTime,
            },
          },
          userId,
        );
        break;
      }

      case "SEND_CHAT":
        await this.emitToRoom(
          roomId,
          {
            type: MESSAGE_TYPES.RECEIVE_CHAT,
            payload: { chat: payload.chat },
          },
          userId,
        );
        break;

      default:
        console.warn(`Unknown action type: ${action}`);
    }
  }

  async leaveRoom(payload, socketUserId = null) {
    try {
      const { roomId } = payload || {};
      const userId = socketUserId || payload?.userId;
      if (!roomId || !userId) return;

      const exists = await redisClient.exists(`room:${roomId}`);
      const senderWs = await this.getValidWebSocket(userId);
      if (!senderWs) return;

      if (!exists) {
        await this.removeUserActiveRoom(userId);
        await this.emitToUser(userId, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: "Room not found" },
        });
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
        await this.clearPendingRequestsForRoom(roomId);

        await this.emitToRoom(roomId, {
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
        await this.clearPendingRequestsForRoom(roomId);
        clearRoom(roomId);
        await redisClient.del(`room:${roomId}`, `room:${roomId}:members`);
      } else {
        // broadcast updated member list to remaining users
        const members = await this.getRoomMembers(roomId);
        await this.emitToRoom(roomId, {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        });
      }

      await this.emitToUser(userId, {
        type: MESSAGE_TYPES.ROOM_LEFT,
        payload: { roomId },
      });
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  }
}

const RoomControllerInstance = new RoomController();

export default RoomControllerInstance;

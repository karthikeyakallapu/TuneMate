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
      const { createdBy, createdById } = payload;

      const roomId = nanoid(10);

      console.log(`Creating room ${roomId} by user ${createdBy}`);

      // create room state
      await redisClient.hset(`room:${roomId}`, {
        hostId: createdById,
        hostName: createdBy,
        isPlaying: "false",
        timestamp: "0",
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

  async joinRoom(payload) {
    try {
      const { roomId, userId, username = "User" } = payload;

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

      addToRoom(roomId, senderWs);

      // add to Redis members (hash: userId -> username)
      await redisClient.hset(`room:${roomId}:members`, userId, username);

      // set reverse mapping
      await this.setUserActiveRoom(userId, roomId);

      // send current state + members
      const state = await redisClient.hgetall(`room:${roomId}`);
      const members = await this.getRoomMembers(roomId);

      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload: {
            ...state,
            roomId,
            members,
            serverTime: Date.now(),
          },
        }),
      );

      // broadcast updated member list to other room members
      broadcast(
        roomId,
        {
          type: MESSAGE_TYPES.MEMBERS_UPDATED,
          payload: { members, roomId },
        },
        senderWs,
      );
    } catch (error) {
      console.log(error);
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

      senderWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.ROOM_JOINED,
          payload: {
            ...state,
            roomId,
            members,
            serverTime: Date.now(),
          },
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

    switch (action) {
      case "HANDLE_SONG_PLAY":
        broadcast(roomId, { type: MESSAGE_TYPES.HANDLE_SONG_PLAY }, senderWs);
        break;
      case "PLAY_SONG":
        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.PLAY_SONG,
            payload: { songId: payload.songId },
          },
          senderWs,
        );
        break;

      case "SEEK":
        broadcast(
          roomId,
          {
            type: MESSAGE_TYPES.SEEK,
            payload: { musicSeekTime: payload.musicSeekTime },
          },
          senderWs,
        );
        break;

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

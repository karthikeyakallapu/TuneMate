import MESSAGE_TYPES from "../utils/messageTypes.js";
import { getWebSocketByUserId } from "../services/userConnections.js";
import { redisClient } from "../config/redisClient.js";
import { nanoid } from "nanoid";
import { addToRoom } from "../utils/roomUtils.js";
class SyncController {
  // Helper function to validate WebSocket instance
  async getValidWebSocket(userId) {
    const ws = await getWebSocketByUserId(userId);
    if (!ws || typeof ws.send !== "function") {
      console.error(`Invalid WebSocket object for userId: ${userId}.`);
      return null;
    }
    return ws;
  }

  async sendConnectionRequest(targetUserId, username, senderId) {
    const targetWs = await this.getValidWebSocket(targetUserId);
    if (!targetWs) return;

    if (targetUserId === senderId) {
      targetWs.send(
        JSON.stringify({
          type: MESSAGE_TYPES.INVALID_ACTION,
          payload: { message: "You can't self connect" },
        }),
      );
      return;
    }

    // Send the connection request message
    targetWs.send(
      JSON.stringify({
        type: MESSAGE_TYPES.CONNECTION_REQUEST,
        payload: { username, userId: senderId },
      }),
    );
  }

  async acceptConnectionRequest(payload) {
    const { acceptedBy, sentBy } = payload;
    const senderId = sentBy.userId;
    const acceptorId = acceptedBy.userId;

    // Store the active connection in Redis
    await redisClient.hset("activeConnections", senderId, acceptorId);
    await redisClient.hset("activeConnections", acceptorId, senderId);

    const targetWs = await this.getValidWebSocket(senderId);
    if (!targetWs) return;

    // Send the connection accepted message
    targetWs.send(
      JSON.stringify({
        type: MESSAGE_TYPES.CONNECTION_ACCEPTED,
        payload: {
          username: acceptedBy.username,
          userId: acceptedBy.userId,
        },
      }),
    );
  }

  async declineConnectionRequest(payload) {
    const { sentBy } = payload;
    const targetWs = await this.getValidWebSocket(sentBy.userId);
    if (!targetWs) return;
    // Send the connection declined message
    targetWs.send(
      JSON.stringify({
        type: MESSAGE_TYPES.CONNECTION_DECLINED,
        payload: { declinedBy: sentBy.username },
      }),
    );
  }

  async syncAction(payload) {
    const { senderId, action } = payload;

    const targetUserId = await redisClient.hget("activeConnections", senderId);

    if (!targetUserId) {
      console.warn(`No active connection found for userId: ${senderId}`);
      return;
    }
    const targetWs = await getWebSocketByUserId(targetUserId);
    if (targetWs) {
      switch (action) {
        case "HANDLE_SONG_PLAY":
          targetWs.send(
            JSON.stringify({
              type: MESSAGE_TYPES.HANDLE_SONG_PLAY,
            }),
          );
          break;
        case "PLAY_SONG":
          targetWs.send(
            JSON.stringify({
              type: MESSAGE_TYPES.PLAY_SONG,
              payload: {
                songId: payload.songId,
              },
            }),
          );
          break;

        case "SEEK":
          targetWs.send(
            JSON.stringify({
              type: MESSAGE_TYPES.SEEK,
              payload: {
                musicSeekTime: payload.musicSeekTime,
              },
            }),
          );
          break;
        case "SEND_CHAT":
          console.log(payload);
          targetWs.send(
            JSON.stringify({
              type: MESSAGE_TYPES.RECEIVE_CHAT,
              payload: {
                chat: payload.chat,
              },
            }),
          );
          break;

        default:
          console.warn(`Unknown action type: ${action}`);
      }
    }
  }

  async closeConnection(payload) {
    try {
      const { acceptedBy, sentBy } = payload;
      const senderId = sentBy.userId;
      const acceptorId = acceptedBy.userId;

      // Remove the active connection in Redis
      await redisClient.hdel("activeConnections", senderId);
      await redisClient.hdel("activeConnections", acceptorId);

      const senderWs = await this.getValidWebSocket(senderId);
      const acceptorWs = await this.getValidWebSocket(acceptorId);

      if (senderWs) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.CLOSE_CONNECTION,
          }),
        );
      }

      if (acceptorWs) {
        acceptorWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.CLOSE_CONNECTION,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to close connection:", error);
    }
  }

  async createRoom(payload) {
    try {
      const { createdBy, createdById } = payload;

      const roomId = nanoid(10);

      console.log(`Creating room ${roomId} by user ${createdBy}`);

      // create room state
      await redisClient.hset(`room:${roomId}`, {
        hostId: createdById,
        isPlaying: false,
        timestamp: 0,
        updatedAt: Date.now(),
      });

      // add creator
      await redisClient.sadd(`room:${roomId}:members`, createdById);

      // auto cleanup
      await redisClient.expire(`room:${roomId}`, 36000);

      const senderWs = await this.getValidWebSocket(createdById);

      // Add to Room
      addToRoom(roomId, senderWs);

      if (senderWs) {
        senderWs.send(
          JSON.stringify({
            type: MESSAGE_TYPES.ROOM_CREATED,
            payload: {
              roomId: roomId,
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
      const { roomId, senderId } = payload;

      const exists = await redisClient.exists(`room:${roomId}`);

      const senderWs = await this.getValidWebSocket(senderId);

      if (!exists) {
        senderWs.send(JSON.stringify({ error: "Room not found" }));
        return;
      }

      addToRoom(roomId, senderWs);

      // add to Redis members
      await redisClient.sadd(`room:${roomId}:members`, userId);

      // send current state
      const state = await redisClient.hgetall(`room:${roomId}`);

      senderWs.send(
        JSON.stringify({
          type: "SYNC",
          ...state,
          serverTime: Date.now(),
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }
}

const SyncControllerInstance = new SyncController();

export default SyncControllerInstance;

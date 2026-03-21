import MESSAGE_TYPES from "../utils/messageTypes.js";
import { redisClient } from "../config/redisClient.js";
import { publishUserEvent } from "../services/pubSubBridge.js";

class SyncController {
  async emitToUser(userId, message) {
    if (!userId || !message) return;
    await publishUserEvent({ userId, message });
  }

  async isUserOnline(userId) {
    if (!userId) return false;
    const wsId = await redisClient.hget("user:wsid", userId);
    return Boolean(wsId);
  }

  async sendConnectionRequest(targetUserId, username, senderId) {
    if (targetUserId === senderId) {
      await this.emitToUser(senderId, {
        type: MESSAGE_TYPES.INVALID_ACTION,
        payload: { message: "You can't self connect" },
      });
      return;
    }

    const isTargetOnline = await this.isUserOnline(targetUserId);
    if (!isTargetOnline) {
      return;
    }

    await this.emitToUser(targetUserId, {
      type: MESSAGE_TYPES.CONNECTION_REQUEST,
      payload: { username, userId: senderId },
    });
  }

  async acceptConnectionRequest(payload) {
    const { acceptedBy, sentBy } = payload;
    const senderId = sentBy.userId;
    const acceptorId = acceptedBy.userId;

    // Store the active connection in Redis
    await redisClient.hset("activeConnections", senderId, acceptorId);
    await redisClient.hset("activeConnections", acceptorId, senderId);

    await this.emitToUser(senderId, {
      type: MESSAGE_TYPES.CONNECTION_ACCEPTED,
      payload: {
        username: acceptedBy.username,
        userId: acceptedBy.userId,
      },
    });
  }

  async declineConnectionRequest(payload) {
    const { sentBy } = payload;
    await this.emitToUser(sentBy.userId, {
      type: MESSAGE_TYPES.CONNECTION_DECLINED,
      payload: { declinedBy: sentBy.username },
    });
  }

  async syncAction(payload) {
    const { senderId, action } = payload;

    const targetUserId = await redisClient.hget("activeConnections", senderId);

    if (!targetUserId) {
      console.warn(`No active connection found for userId: ${senderId}`);
      return;
    }

    switch (action) {
      case "HANDLE_SONG_PLAY":
        await this.emitToUser(targetUserId, {
          type: MESSAGE_TYPES.HANDLE_SONG_PLAY,
        });
        break;
      case "PLAY_SONG":
        await this.emitToUser(targetUserId, {
          type: MESSAGE_TYPES.PLAY_SONG,
          payload: {
            songId: payload.songId,
          },
        });
        break;

      case "SEEK":
        await this.emitToUser(targetUserId, {
          type: MESSAGE_TYPES.SEEK,
          payload: {
            musicSeekTime: payload.musicSeekTime,
          },
        });
        break;
      case "SEND_CHAT":
        await this.emitToUser(targetUserId, {
          type: MESSAGE_TYPES.RECEIVE_CHAT,
          payload: {
            chat: payload.chat,
          },
        });
        break;

      default:
        console.warn(`Unknown action type: ${action}`);
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

      await this.emitToUser(senderId, {
        type: MESSAGE_TYPES.CLOSE_CONNECTION,
      });
      await this.emitToUser(acceptorId, {
        type: MESSAGE_TYPES.CLOSE_CONNECTION,
      });
    } catch (error) {
      console.error("Failed to close connection:", error);
    }
  }
}

const SyncControllerInstance = new SyncController();

export default SyncControllerInstance;

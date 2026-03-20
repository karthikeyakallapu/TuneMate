import { redisClient } from "../config/redisClient.js";

export const HttpController = () => {
  return {
    async addConnectioninRedis(req, res) {
      try {
        const { connectedUserId, userId } = req.body;
        const decryptedUserId = connectedUserId;
        await redisClient.hset("activeConnections", decryptedUserId, userId);
        await redisClient.hset("activeConnections", userId, decryptedUserId);
        res.status(200).json({ message: "Connection added" });
      } catch (err) {
        res.status(500).json({ error: "Failed to add connection" });
      }
    },

    async getRoomInfo(req, res) {
      try {
        const { roomId } = req.params;
        const exists = await redisClient.exists(`room:${roomId}`);
        if (!exists) {
          return res.status(404).json({ error: "Room not found" });
        }
        const roomState = await redisClient.hgetall(`room:${roomId}`);
        const membersHash = await redisClient.hgetall(`room:${roomId}:members`);
        const members = Object.entries(membersHash || {}).map(
          ([userId, username]) => ({ userId, username }),
        );
        res.status(200).json({
          roomId,
          ...roomState,
          members,
          memberCount: members.length,
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to get room info" });
      }
    },

    async getUserActiveRoom(req, res) {
      try {
        const { userId } = req.params;
        const roomId = await redisClient.hget("user:activeRoom", userId);
        if (!roomId) {
          return res.status(200).json({ roomId: null });
        }
        const exists = await redisClient.exists(`room:${roomId}`);
        if (!exists) {
          await redisClient.hdel("user:activeRoom", userId);
          return res.status(200).json({ roomId: null });
        }
        const roomState = await redisClient.hgetall(`room:${roomId}`);
        const membersHash = await redisClient.hgetall(`room:${roomId}:members`);
        const members = Object.entries(membersHash || {}).map(
          ([userId, username]) => ({ userId, username }),
        );
        res.status(200).json({ roomId, ...roomState, members });
      } catch (err) {
        res.status(500).json({ error: "Failed to get user room" });
      }
    },
  };
};

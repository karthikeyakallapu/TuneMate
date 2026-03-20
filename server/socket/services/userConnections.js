import { redisClient } from "../config/redisClient.js";
import { removeSocketFromAllRooms } from "../utils/roomUtils.js";

// In-memory map to hold active WebSocket connections
const wsConnections = new Map();

// Add a user connection (store userId -> wsId mapping in Redis)
export const addConnection = async (userId, ws) => {
  const existingWsId = await redisClient.hget("user:wsid", userId);
  if (existingWsId) {
    const existingWs = wsConnections.get(existingWsId);
    if (existingWs && existingWs !== ws) {
      removeSocketFromAllRooms(existingWs);
      wsConnections.delete(existingWsId);
      try {
        existingWs.close(4001, "Session replaced");
      } catch (error) {
        console.error("Failed to close previous websocket:", error);
      }
    }
  }

  const wsId = generateWsId();
  wsConnections.set(wsId, ws);
  await redisClient.hset("user:wsid", userId, wsId);
  return wsId;
};

// Remove user connection when they disconnect
export const removeConnection = async (userId, expectedWsId = null) => {
  const mappedWsId = await redisClient.hget("user:wsid", userId);
  const targetWsId = expectedWsId || mappedWsId;

  if (targetWsId) {
    wsConnections.delete(targetWsId);
  }

  if (!mappedWsId) {
    console.warn(`No connection found for userId: ${userId}`);
    return;
  }

  if (!expectedWsId || mappedWsId === expectedWsId) {
    await redisClient.hdel("user:wsid", userId);
  } else {
    console.info(
      `Skipped deleting active mapping for userId ${userId}; closing stale socket ${expectedWsId}.`,
    );
  }
};

// Retrieve WebSocket by userId
export const getWebSocketByUserId = async (userId) => {
  const wsId = await redisClient.hget("user:wsid", userId);
  if (!wsId) {
    console.warn(`No WebSocket ID found for userId: ${userId}`);
    return null;
  }
  const ws = wsConnections.get(wsId);
  if (!ws) {
    console.warn(`No active WebSocket found for wsId: ${wsId}`);
  }
  return ws;
};

// Generate a unique WebSocket ID
const generateWsId = () => `ws_${Math.random().toString(36).substr(2, 9)}`;

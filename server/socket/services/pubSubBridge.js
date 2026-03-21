import { publish, subscribe } from "../config/redisClient.js";
import MESSAGE_TYPES from "../utils/messageTypes.js";
import {
  addToRoom,
  broadcast,
  clearRoom,
  removeFromRoom,
} from "../utils/roomUtils.js";
import { getLocalWebSocketByUserId } from "./userConnections.js";

const ROOM_EVENTS_CHANNEL = "socket:room-events";
const USER_EVENTS_CHANNEL = "socket:user-events";

let isBridgeInitialized = false;
let bridgeInitPromise = null;

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const sendToSocket = (ws, message) => {
  if (!ws || ws.readyState !== ws.OPEN) return;
  ws.send(typeof message === "string" ? message : JSON.stringify(message));
};

const handleRoomEvent = (serializedPayload) => {
  const payload = safeJsonParse(serializedPayload);
  if (!payload?.roomId || !payload?.message) return;

  broadcast(payload.roomId, payload.message, {
    excludeUserId: payload.excludeUserId || null,
  });

  if (payload.message?.type === MESSAGE_TYPES.ROOM_CLOSED) {
    clearRoom(payload.roomId);
  }
};

const handleUserEvent = (serializedPayload) => {
  const payload = safeJsonParse(serializedPayload);
  if (!payload?.userId || !payload?.message) return;

  const ws = getLocalWebSocketByUserId(payload.userId);
  if (!ws) return;

  const messageType = payload.message?.type;
  const roomId = payload.message?.payload?.roomId;

  if (messageType === MESSAGE_TYPES.ROOM_JOINED && roomId) {
    addToRoom(roomId, ws);
  }

  if (
    (messageType === MESSAGE_TYPES.ROOM_LEFT ||
      messageType === MESSAGE_TYPES.REMOVED_FROM_ROOM) &&
    roomId
  ) {
    removeFromRoom(roomId, ws);
  }

  sendToSocket(ws, payload.message);
};

export const initializePubSubBridge = async () => {
  if (isBridgeInitialized) return;
  if (bridgeInitPromise) return bridgeInitPromise;

  bridgeInitPromise = (async () => {
    await subscribe.subscribe(ROOM_EVENTS_CHANNEL, USER_EVENTS_CHANNEL);

    subscribe.on("message", (channel, message) => {
      if (channel === ROOM_EVENTS_CHANNEL) {
        handleRoomEvent(message);
        return;
      }

      if (channel === USER_EVENTS_CHANNEL) {
        handleUserEvent(message);
      }
    });

    isBridgeInitialized = true;
    console.log("Redis pub/sub bridge initialized");
  })();

  return bridgeInitPromise;
};

export const publishRoomEvent = async ({
  roomId,
  message,
  excludeUserId = null,
}) => {
  if (!roomId || !message) return;

  await publish.publish(
    ROOM_EVENTS_CHANNEL,
    JSON.stringify({
      roomId,
      message,
      excludeUserId,
    }),
  );
};

export const publishUserEvent = async ({ userId, message }) => {
  if (!userId || !message) return;

  await publish.publish(
    USER_EVENTS_CHANNEL,
    JSON.stringify({
      userId,
      message,
    }),
  );
};


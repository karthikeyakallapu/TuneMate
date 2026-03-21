import { rooms } from "../store/roomStore.js";

export function addToRoom(roomId, ws) {
  if (!ws) return;
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);
}

export function removeFromRoom(roomId, ws) {
  if (!rooms.has(roomId)) return;
  const roomClients = rooms.get(roomId);
  roomClients.delete(ws);
  if (roomClients.size === 0) {
    rooms.delete(roomId);
  }
}

export function broadcast(roomId, message, exclude = null) {
  const clients = rooms.get(roomId) || [];
  const serializedMessage =
    typeof message === "string" ? message : JSON.stringify(message);

  const excludeConfig =
    exclude &&
    typeof exclude === "object" &&
    ("excludeWs" in exclude || "excludeUserId" in exclude)
      ? exclude
      : { excludeWs: exclude, excludeUserId: null };

  for (const ws of clients) {
    if (ws === excludeConfig.excludeWs) continue;
    if (
      excludeConfig.excludeUserId &&
      ws?.userId === excludeConfig.excludeUserId
    ) {
      continue;
    }
    if (ws.readyState !== ws.OPEN) continue;
    ws.send(serializedMessage);
  }
}

export function removeSocketFromAllRooms(ws) {
  for (const [roomId, clients] of rooms.entries()) {
    if (clients.has(ws)) {
      clients.delete(ws);
      if (clients.size === 0) {
        rooms.delete(roomId);
      }
    }
  }
}

export function clearRoom(roomId) {
  rooms.delete(roomId);
}

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

export function broadcast(roomId, message, excludeWs = null) {
  const clients = rooms.get(roomId) || [];
  const serializedMessage =
    typeof message === "string" ? message : JSON.stringify(message);

  for (const ws of clients) {
    if (ws !== excludeWs && ws.readyState === ws.OPEN) {
      ws.send(serializedMessage);
    }
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

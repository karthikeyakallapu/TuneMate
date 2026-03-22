import { WebSocketServer } from "ws";
import { addConnection, removeConnection } from "./userConnections.js";
import { handleMessage } from "../controllers/messageHandler.js";
import { removeSocketFromAllRooms } from "../utils/roomUtils.js";
import RoomControllerInstance from "../controllers/RoomController.js";
import { initializePubSubBridge } from "./pubSubBridge.js";

export const startWebSocketServer = async (server) => {
  await initializePubSubBridge();

  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    const params = new URL(req.url, `ws://${req.headers.host}`).searchParams;
    const clientId = params.get("userId");

    ws.userId = clientId;

    if (clientId) {
      const wsId = await addConnection(clientId, ws);
      ws.wsId = wsId;

      // Auto-rejoin room if user has an active room in Redis
      await RoomControllerInstance.rejoinRoom(clientId);
    }

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      await handleMessage(ws, data);
    });

    ws.on("close", async () => {
      if (clientId) {
        await RoomControllerInstance.handleSocketDisconnect(clientId, ws.wsId);
      }
      await removeConnection(clientId, ws.wsId);
      removeSocketFromAllRooms(ws);
    });
  });
};

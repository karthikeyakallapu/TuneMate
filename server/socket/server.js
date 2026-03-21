import { startWebSocketServer } from "./services/websocketService.js";
import express from "express";
import router from "./routes/routes.js";
import http from "http"; // Import HTTP server
import cors from "cors";

const PORT = process.env.PORT || 4100;
const app = express();

// Middleware and routes
app.use(express.json());
app.use(cors());
app.use(router);

const server = http.createServer(app);

await startWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
  console.log(`WebSocket server is listening on ws://localhost:${PORT}`);
});

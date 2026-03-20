import express from "express";
import { HttpController } from "../controllers/httpController.js";
const router = express.Router();

const httpController = HttpController();

router.get("/", (req, res) => {
  res.send("<h1>Welcome to the Tunemate Socket Server</h1>");
});

router.post("/api/addConnection", httpController.addConnectioninRedis);
router.get("/api/rooms/:roomId", httpController.getRoomInfo);
router.get("/api/user/:userId/room", httpController.getUserActiveRoom);

export default router;

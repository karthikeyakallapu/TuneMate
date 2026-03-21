import { Router } from "express";
import authRouter from "./authRoutes.js";
import userMetaRouter from "./userMetaRoutes.js";
import playListRouter from "./playlistRoutes.js";
import commonRouter from "./commonRoutes.js";
import { isAuthUser } from "../middlewares/auth.js";

const router = Router();

router.get("/", isAuthUser, (req, res) => {
  console.log("API hit to backend");
});

router.use("/auth", authRouter);
router.use("/meta", userMetaRouter);
router.use("/playlists", playListRouter);
router.use("/", commonRouter);

export default router;

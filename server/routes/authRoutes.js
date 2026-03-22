import {Router} from "express";
import ENDPOINTS from "./API_ENDPOINTS.js";
import {UserController} from "../controllers/Auth/UserController.js";

const authRouter = Router();

authRouter.post(ENDPOINTS.register, UserController().register);
authRouter.post(ENDPOINTS.login, UserController().login);
authRouter.get(ENDPOINTS.verify, UserController().verifyToken);
authRouter.post(ENDPOINTS.verifyEmail, UserController().verifyEmail);
authRouter.post(ENDPOINTS.resendVerificationMail, UserController().resendVerificationMail);
authRouter.post(ENDPOINTS.forgot, UserController().forgotPassword);
authRouter.post(ENDPOINTS.resetPassword, UserController().resetPassword);
authRouter.post(ENDPOINTS.refreshToken, UserController().refreshToken);
authRouter.post(ENDPOINTS.logout, UserController().logout);

export default authRouter;

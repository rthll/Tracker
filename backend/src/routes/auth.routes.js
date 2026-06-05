import { Router } from "express";
import { requireFirebaseAdminCredentials } from "../middlewares/admin-credentials.middleware.js";
import {
  postCompleteSignup,
  postSignupCode
} from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.use(requireFirebaseAdminCredentials);
authRouter.post("/auth/signup-code", postSignupCode);
authRouter.post("/auth/complete-signup", postCompleteSignup);

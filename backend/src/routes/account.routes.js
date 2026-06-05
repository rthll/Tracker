import { Router } from "express";
import { requireFirebaseAdminCredentials } from "../middlewares/admin-credentials.middleware.js";
import { requireFirebaseUser } from "../middlewares/auth.middleware.js";
import { deleteAccount } from "../controllers/account.controller.js";

export const accountRouter = Router();

accountRouter.use(requireFirebaseAdminCredentials);
accountRouter.use(requireFirebaseUser);
accountRouter.delete("/auth/account", deleteAccount);

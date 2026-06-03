import { Router } from "express";
import { requireFirebaseAdminCredentials } from "../middlewares/admin-credentials.middleware.js";
import { requireFirebaseUser } from "../middlewares/auth.middleware.js";
import {
  getTrackerState,
  patchTrackerChange,
  putTrackerState
} from "../controllers/tracker.controller.js";

export const trackerRouter = Router();

trackerRouter.use(requireFirebaseAdminCredentials);
trackerRouter.use(requireFirebaseUser);
trackerRouter.get("/tracker/state", getTrackerState);
trackerRouter.put("/tracker/state", putTrackerState);
trackerRouter.patch("/tracker/change", patchTrackerChange);

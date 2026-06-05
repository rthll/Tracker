import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", (request, response) => {
  response.json({
    status: "ok",
    service: "tracker-backend",
    timestamp: new Date().toISOString(),
    ...(env.isDevelopment && { firebaseAdminConfigured: env.hasFirebaseAdminCredentials })
  });
});

import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/health", (request, response) => {
  response.json({
    status: "ok",
    service: "tracker-backend",
    firebaseAdminConfigured: env.hasFirebaseAdminCredentials,
    timestamp: new Date().toISOString()
  });
});

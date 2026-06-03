import { env } from "../config/env.js";

export function requireFirebaseAdminCredentials(request, response, next) {
  if (env.hasFirebaseAdminCredentials) {
    next();
    return;
  }

  response.status(503).json({
    error: "Backend sem credenciais Firebase Admin. Configure GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT_BASE64 no backend/.env.local."
  });
}

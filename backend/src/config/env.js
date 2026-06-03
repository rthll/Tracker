import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

function getRequiredNumber(value, fallback) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAllowedOrigins(value) {
  const defaultOrigins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:4173",
    "http://localhost:4173"
  ];
  const configuredOrigins = String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaultOrigins, ...configuredOrigins])];
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: (process.env.NODE_ENV || "development") === "development",
  port: getRequiredNumber(process.env.PORT, 3333),
  frontendOrigins: getAllowedOrigins(process.env.FRONTEND_ORIGIN),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseServiceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  hasFirebaseAdminCredentials: Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    || process.env.GOOGLE_APPLICATION_CREDENTIALS
  )
};

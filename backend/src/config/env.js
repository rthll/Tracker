import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(currentDir, "../..");
const projectDir = resolve(backendDir, "..");

[
  resolve(backendDir, ".env.local"),
  resolve(backendDir, ".env"),
  resolve(projectDir, ".env.local"),
  resolve(projectDir, ".env")
].forEach((path) => {
  dotenv.config({ path });
});

function getRequiredNumber(value, fallback) {
  const parsed = Number.parseInt(value || String(fallback), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "sim"].includes(String(value).toLowerCase());
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
  authCodeSecret: process.env.AUTH_CODE_SECRET || process.env.FIREBASE_PROJECT_ID || "tracker-auth-code-secret",
  authCodeTtlMinutes: getRequiredNumber(process.env.AUTH_CODE_TTL_MINUTES, 15),
  resendApiKey: process.env.RESEND_API_KEY || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: getRequiredNumber(process.env.SMTP_PORT, 587),
  smtpSecure: getBoolean(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || "",
  hasFirebaseAdminCredentials: Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    || process.env.GOOGLE_APPLICATION_CREDENTIALS
  ),
  hasResendCredentials: Boolean(process.env.RESEND_API_KEY),
  hasSmtpCredentials: Boolean(
    process.env.SMTP_HOST
    && (process.env.MAIL_FROM || process.env.SMTP_USER)
    && (
      !process.env.SMTP_USER
      || process.env.SMTP_PASS
    )
  )
};

import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { env } from "./env.js";

function getServiceAccountFromBase64() {
  if (!env.firebaseServiceAccountBase64) {
    return null;
  }

  return JSON.parse(
    Buffer.from(env.firebaseServiceAccountBase64, "base64").toString("utf8")
  );
}

function getServiceAccountFromFile() {
  if (!env.googleApplicationCredentials) {
    return null;
  }

  return JSON.parse(readFileSync(env.googleApplicationCredentials, "utf8"));
}

function getServiceAccountCredential() {
  const serviceAccount = getServiceAccountFromBase64() || getServiceAccountFromFile();
  return serviceAccount ? admin.credential.cert(serviceAccount) : null;
}

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    return admin.app();
  }

  const credential = getServiceAccountCredential();

  if (credential) {
    return admin.initializeApp({
      credential,
      projectId: env.firebaseProjectId || undefined
    });
  }

  return admin.initializeApp({
    projectId: env.firebaseProjectId || undefined
  });
}

export const firebaseAdmin = initializeFirebaseAdmin();
export const auth = admin.auth(firebaseAdmin);
export const db = admin.firestore(firebaseAdmin);
export const fieldValue = admin.firestore.FieldValue;

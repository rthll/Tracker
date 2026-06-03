import admin from "firebase-admin";
import { env } from "./env.js";

function getServiceAccountCredential() {
  if (!env.firebaseServiceAccountBase64) {
    return null;
  }

  const serviceAccount = JSON.parse(
    Buffer.from(env.firebaseServiceAccountBase64, "base64").toString("utf8")
  );

  return admin.credential.cert(serviceAccount);
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

import { auth, db } from "../config/firebase-admin.js";

export async function deleteUserAccount(userId) {
  await db.recursiveDelete(db.doc(`users/${userId}`));
  await auth.deleteUser(userId);
}

import { deleteUserAccount } from "../services/account.service.js";

export async function deleteAccount(request, response, next) {
  try {
    await deleteUserAccount(request.user.uid);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

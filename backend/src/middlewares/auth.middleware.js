import { auth } from "../config/firebase-admin.js";

export async function requireFirebaseUser(request, response, next) {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    response.status(401).json({ error: "Token de autenticacao ausente." });
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    request.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      authTime: decodedToken.auth_time || 0
    };
    next();
  } catch (error) {
    response.status(401).json({ error: "Token de autenticacao invalido." });
  }
}

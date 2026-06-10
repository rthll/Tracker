import { createHash, randomInt } from "node:crypto";
import { auth, db, fieldValue } from "../config/firebase-admin.js";
import { env } from "../config/env.js";
import { sendAccountExistsEmail, sendSignupCodeEmail } from "./email.service.js";

const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailDocId(email) {
  return createHash("sha256").update(email).digest("hex");
}

function hashCode(email, code) {
  return createHash("sha256")
    .update(`${email}:${code}:${env.authCodeSecret}`)
    .digest("hex");
}

function createSignupCode() {
  return String(randomInt(100000, 1000000));
}

function getSignupCodeRef(email) {
  return db.doc(`signupCodes/${getEmailDocId(email)}`);
}

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function isEmailRegistered(email) {
  try {
    await auth.getUserByEmail(email);
    return true;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return false;
    }

    throw error;
  }
}

const CODE_REQUEST_COOLDOWN_MS = 60 * 1000;

export async function requestSignupCode(emailInput) {
  const email = normalizeEmail(emailInput);

  if (!isValidEmail(email)) {
    throw createHttpError("Informe um e-mail valido.", 400);
  }

  // Resposta identica para e-mails ja cadastrados (evita enumeracao de contas):
  // o dono do e-mail recebe um aviso em vez do codigo.
  if (await isEmailRegistered(email)) {
    await sendAccountExistsEmail(email);
    return {
      email,
      expiresInMinutes: env.authCodeTtlMinutes,
      delivered: true
    };
  }

  const codeRef = getSignupCodeRef(email);
  const existingSnapshot = await codeRef.get();

  if (existingSnapshot.exists) {
    const existingData = existingSnapshot.data();
    const createdAtMs = existingData.createdAt?.toMillis?.() || 0;
    if (Date.now() - createdAtMs < CODE_REQUEST_COOLDOWN_MS) {
      throw createHttpError("Aguarde um momento antes de solicitar um novo codigo.", 429);
    }
  }

  const code = createSignupCode();
  const expiresAt = Date.now() + (env.authCodeTtlMinutes * 60 * 1000);
  const emailResult = await sendSignupCodeEmail(email, code);

  await codeRef.set({
    email,
    codeHash: hashCode(email, code),
    attempts: 0,
    expiresAt,
    createdAt: fieldValue.serverTimestamp(),
    updatedAt: fieldValue.serverTimestamp()
  });

  return {
    email,
    expiresInMinutes: env.authCodeTtlMinutes,
    delivered: emailResult.delivered,
    ...(emailResult.devCode ? { devCode: emailResult.devCode } : {})
  };
}

export async function completeSignup({ email: emailInput, password, code }) {
  const email = normalizeEmail(emailInput);
  const cleanCode = String(code || "").trim();

  if (!isValidEmail(email)) {
    throw createHttpError("Informe um e-mail valido.", 400);
  }

  if (String(password || "").length < 6) {
    throw createHttpError("A senha deve ter pelo menos 6 caracteres.", 400);
  }

  if (!/^\d{6}$/.test(cleanCode)) {
    throw createHttpError("Informe o codigo de 6 digitos.", 400);
  }

  const codeRef = getSignupCodeRef(email);
  const snapshot = await codeRef.get();

  if (!snapshot.exists) {
    throw createHttpError("Solicite um novo codigo de cadastro.", 400);
  }

  const data = snapshot.data();

  if (data?.email && data.email !== email) {
    await codeRef.delete();
    throw createHttpError("Codigo invalido.", 400);
  }

  if (!data || data.expiresAt < Date.now()) {
    await codeRef.delete();
    throw createHttpError("Codigo expirado. Solicite um novo codigo.", 400);
  }

  if ((data.attempts || 0) >= MAX_ATTEMPTS) {
    await codeRef.delete();
    throw createHttpError("Limite de tentativas excedido. Solicite um novo codigo.", 429);
  }

  if (data.codeHash !== hashCode(email, cleanCode)) {
    await codeRef.set({
      attempts: fieldValue.increment(1),
      updatedAt: fieldValue.serverTimestamp()
    }, { merge: true });
    throw createHttpError("Codigo invalido.", 400);
  }

  // So depois do codigo validado (posse do e-mail comprovada) revelamos
  // que a conta ja existe — evita enumeracao por quem nao tem o codigo.
  if (await isEmailRegistered(email)) {
    await codeRef.delete();
    throw createHttpError("Este e-mail ja esta cadastrado.", 409);
  }

  const user = await auth.createUser({
    email,
    password,
    emailVerified: true
  });

  await codeRef.delete();

  return {
    uid: user.uid,
    email: user.email
  };
}

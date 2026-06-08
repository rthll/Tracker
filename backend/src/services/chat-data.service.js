import { db } from "../config/firebase-admin.js";

const HISTORY_LIMIT = 20;
const CONVERSATIONS_LIMIT = 30;

function chatsRef(userId) {
  return db.collection(`users/${userId}/chats`);
}

function chatRef(userId, chatId) {
  return db.doc(`users/${userId}/chats/${chatId}`);
}

function messagesRef(userId, chatId) {
  return db.collection(`users/${userId}/chats/${chatId}/messages`);
}

function notFound(msg) {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

export async function listConversations(userId) {
  const snap = await chatsRef(userId)
    .orderBy("updatedAt", "desc")
    .limit(CONVERSATIONS_LIMIT)
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function createConversation(userId) {
  const now = new Date().toISOString();
  const ref = chatsRef(userId).doc();
  const data = { title: "Nova conversa", createdAt: now, updatedAt: now };
  await ref.set(data);
  return { id: ref.id, ...data };
}

export async function getMessages(userId, chatId) {
  const snap = await chatRef(userId, chatId).get();
  if (!snap.exists) throw notFound("Conversa não encontrada.");

  const msgsSnap = await messagesRef(userId, chatId)
    .orderBy("createdAt", "asc")
    .get();

  return msgsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function sendMessage(userId, chatId, content, n8nWebhookUrl) {
  const ref = chatRef(userId, chatId);
  const chatSnap = await ref.get();
  if (!chatSnap.exists) throw notFound("Conversa não encontrada.");

  const msgs = messagesRef(userId, chatId);
  const now = new Date().toISOString();

  // Fetch recent history before saving the new message
  const historySnap = await msgs
    .orderBy("createdAt", "desc")
    .limit(HISTORY_LIMIT)
    .get();

  const history = historySnap.docs
    .map((doc) => doc.data())
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  // Persist user message
  const userMsgRef = msgs.doc();
  await userMsgRef.set({ role: "user", content, createdAt: now });

  // Call N8N
  let responseContent;
  try {
    const n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, conversationId: chatId, message: content, history }),
    });
    if (!n8nRes.ok) throw new Error(`N8N status ${n8nRes.status}`);
    const data = await n8nRes.json();
    responseContent = data.response || "Sem resposta do agente.";
  } catch (err) {
    console.error("[chat] N8N error:", err.message);
    responseContent = "Não foi possível obter resposta do agente no momento. Tente novamente.";
  }

  // Persist assistant message
  const assistantNow = new Date().toISOString();
  const assistantMsgRef = msgs.doc();
  const assistantMsg = { role: "assistant", content: responseContent, createdAt: assistantNow };
  await assistantMsgRef.set(assistantMsg);

  // Update conversation metadata
  const chatData = chatSnap.data();
  const update = { updatedAt: assistantNow };
  if (chatData.title === "Nova conversa") {
    update.title = content.trim().slice(0, 50) + (content.length > 50 ? "…" : "");
  }
  await ref.update(update);

  return { id: assistantMsgRef.id, ...assistantMsg };
}

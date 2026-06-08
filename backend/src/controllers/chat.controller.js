import { env } from "../config/env.js";
import {
  createConversation,
  getMessages,
  listConversations,
  sendMessage,
} from "../services/chat-data.service.js";

export async function getConversations(request, response, next) {
  try {
    const conversations = await listConversations(request.user.uid);
    response.json(conversations);
  } catch (error) {
    next(error);
  }
}

export async function postConversation(request, response, next) {
  try {
    const conversation = await createConversation(request.user.uid);
    response.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function getConversationMessages(request, response, next) {
  try {
    const messages = await getMessages(request.user.uid, request.params.id);
    response.json(messages);
  } catch (error) {
    next(error);
  }
}

export async function postMessage(request, response, next) {
  try {
    const content = String(request.body?.content ?? "").trim();
    if (!content) {
      return response.status(400).json({ error: "Mensagem não pode ser vazia." });
    }
    if (!env.n8nWebhookUrl) {
      return response.status(503).json({ error: "Agente de IA não configurado." });
    }
    const message = await sendMessage(
      request.user.uid,
      request.params.id,
      content,
      env.n8nWebhookUrl
    );
    response.json(message);
  } catch (error) {
    next(error);
  }
}

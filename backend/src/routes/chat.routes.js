import { Router } from "express";
import {
  getConversationMessages,
  getConversations,
  postConversation,
  postMessage,
} from "../controllers/chat.controller.js";
import { requireFirebaseUser } from "../middlewares/auth.middleware.js";

export const chatRouter = Router();

chatRouter.use(requireFirebaseUser);

chatRouter.get("/chat/conversations", getConversations);
chatRouter.post("/chat/conversations", postConversation);
chatRouter.get("/chat/conversations/:id/messages", getConversationMessages);
chatRouter.post("/chat/conversations/:id/messages", postMessage);

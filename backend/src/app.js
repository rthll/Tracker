import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

function isAllowedDevOrigin(origin) {
  if (!env.isDevelopment || !origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch (error) {
    return false;
  }
}

export function createApp() {
  const app = express();

  // Atras do proxy do Vercel: necessario para o rate limit ler o IP real do cliente
  app.set("trust proxy", 1);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error(`Origem nao autorizada pelo CORS: ${origin}`);
      error.statusCode = 403;
      callback(error);
    },
    credentials: true
  }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiRouter);

  app.use((request, response) => {
    response.status(404).json({
      error: "Rota nao encontrada."
    });
  });

  app.use((error, request, response, next) => {
    console.error(error);
    const statusCode = error.statusCode || 500;
    response.status(statusCode).json({
      error: statusCode >= 400 && statusCode < 500
        ? error.message
        : "Erro interno do servidor."
    });
  });

  return app;
}

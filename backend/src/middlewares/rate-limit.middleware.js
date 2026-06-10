import { rateLimit } from "express-rate-limit";

function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler(request, response) {
      response.status(429).json({ error: message });
    }
  });
}

// Endpoints publicos de cadastro: protege contra e-mail bombing e abuso de cota
export const signupCodeRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Muitas solicitacoes de codigo. Tente novamente em alguns minutos."
});

export const completeSignupRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Muitas tentativas de cadastro. Tente novamente em alguns minutos."
});

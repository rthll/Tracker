const MAX_AUTH_AGE_SECONDS = 5 * 60;

// Para operacoes destrutivas: exige que o login tenha ocorrido ha pouco tempo,
// impedindo que um ID token roubado (valido por 1h) seja suficiente.
export function requireRecentLogin(request, response, next) {
  const authTime = request.user?.authTime || 0;
  const ageSeconds = (Date.now() / 1000) - authTime;

  if (ageSeconds > MAX_AUTH_AGE_SECONDS) {
    response.status(401).json({
      error: "Confirme sua senha novamente para executar esta acao.",
      code: "recent-login-required"
    });
    return;
  }

  next();
}

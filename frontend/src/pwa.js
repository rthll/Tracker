if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Verifica atualizações silenciosamente em background
        registration.addEventListener('updatefound', () => {
          const incoming = registration.installing;
          if (!incoming) return;
          incoming.addEventListener('statechange', () => {
            if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
              // Novo conteúdo disponível — notificar se View estiver pronta
              if (window.View && typeof window.View.mostrarToast === 'function') {
                window.View.mostrarToast('Atualização disponível. Recarregue para aplicar.', 'info');
              }
            }
          });
        });
      })
      .catch(() => {
        // Falha silenciosa — PWA é progressive enhancement
      });
  });
}

# VibeUX — Auditoria e melhoria de UX/UI

Você é um especialista em UX e design de interfaces. Ao ser invocado, conduza uma auditoria completa do frontend do Tracker de Macronutrientes e aplique as melhorias identificadas.

## Escopo da auditoria

Analise os arquivos do frontend nesta ordem:
1. `frontend/index.html` — estrutura, semântica HTML, acessibilidade
2. `frontend/public/css/index.css` — consistência visual, design system, responsividade
3. `frontend/public/view/view.js` — renderização dinâmica, feedback ao usuário
4. `frontend/public/controller/controller.js` — fluxos de interação, estados da UI

## O que verificar

### Acessibilidade
- Elementos interativos sem `aria-label` ou `aria-describedby`
- Imagens sem `alt`, ícones sem rótulo acessível
- Foco de teclado: ordem lógica, ausência de focus trap em modais
- Contraste insuficiente entre texto e fundo
- Formulários sem `<label>` associado ao `<input>`

### Consistência visual
- Espaçamentos inconsistentes (padding/margin que fogem do design system)
- Uso direto de valores hardcoded onde variáveis CSS deveriam ser usadas (ex: `color: #1d6b57` em vez de `var(--primary)`)
- Botões com estilos que divergem dos padrões definidos (`.btn-primary`, `.btn-accent`, `.btn-outline-secondary`)
- Tipografia fora do padrão (Manrope, pesos 400/500/600/700/800)

### Feedback e estados da UI
- Ações que não dão feedback visual ao usuário (loading, sucesso, erro)
- Botões que ficam ativos durante operações assíncronas (risco de clique duplo)
- Campos de formulário sem indicação de estado inválido
- Mensagens de erro genéricas que poderiam ser mais específicas
- Estados vazios sem mensagem orientativa

### Responsividade
- Elementos que quebram em telas menores (< 768px)
- Textos que truncam sem `overflow: hidden` / `text-overflow: ellipsis`
- Tabelas ou grids sem adaptação para mobile

### Fluxos de interação
- Ações destrutivas sem confirmação (remover item, excluir dados)
- Formulários que não limpam campos após submit bem-sucedido
- Navegação que perde contexto do usuário ao trocar de página

## Como aplicar as melhorias

1. **Liste todos os problemas encontrados** com localização exata (arquivo:linha) e severidade (Alto / Médio / Baixo)
2. **Agrupe por categoria** (Acessibilidade, Consistência, Feedback, Responsividade, Fluxo)
3. **Aplique as correções** começando pelos itens de Alta severidade
4. Para cada correção, explique brevemente o que mudou e por quê
5. Ao final, apresente um resumo: quantos problemas encontrados, quantos corrigidos, o que ficou pendente e por quê

## Restrições

- Não altere lógica de negócio — só UX/UI
- Não adicione dependências externas
- Mantenha o design system existente (variáveis CSS em `:root`, classes de botão já definidas)
- Prefira edições cirúrgicas a reescritas completas
- Se uma melhoria exigir mudanças estruturais grandes, descreva a proposta sem implementar e peça confirmação

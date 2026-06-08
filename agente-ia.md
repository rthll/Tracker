# Plano de Implementação — Agente de IA (N8N)

Integração de um assistente de IA via N8N ao Tracker de Macronutrientes.
Leia este arquivo antes de iniciar a implementação.

---

## Decisões de design (confirmadas)

| Ponto | Decisão |
|---|---|
| Layout | Painel lateral deslizante (da direita, sobre o conteúdo) |
| Resposta N8N | JSON simples `{ response: "..." }` |
| Persistência | Firestore (sincronizado entre dispositivos) |

---

## Estrutura Firestore (nova)

```
users/{userId}/
  chats/{chatId}              # { title, createdAt, updatedAt }
    messages/{msgId}          # { role: 'user'|'assistant', content, createdAt }
```

- `title` gerado automaticamente a partir das primeiras palavras da primeira mensagem
- `updatedAt` atualizado a cada nova mensagem (para ordenar a lista por recência)
- Mensagens ordenadas por `createdAt` asc

---

## Backend — arquivos a criar

### Nova variável de ambiente

```
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/tracker-ai
```

Adicionar em `backend/.env.example` e nas variáveis do Vercel.

### Novos arquivos

```
backend/src/
  routes/
    chat.routes.js         # Agrega as 4 rotas de chat
  controllers/
    chat.controller.js     # Handlers HTTP (valida input, chama service, responde)
  services/
    chat-data.service.js   # Lógica Firestore (CRUD de conversas e mensagens)
                           # + chamada ao webhook N8N
```

### Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/chat/conversations` | Bearer | Lista conversas do usuário ordenadas por `updatedAt` desc |
| `POST` | `/chat/conversations` | Bearer | Cria nova conversa vazia, retorna `{ id, title, createdAt }` |
| `GET` | `/chat/conversations/:id/messages` | Bearer | Carrega mensagens da conversa (ordenadas por `createdAt` asc) |
| `POST` | `/chat/conversations/:id/messages` | Bearer | Envia mensagem → chama N8N → salva user+assistant → retorna resposta |

### Payload enviado ao N8N (`POST /chat/conversations/:id/messages`)

O backend envia ao webhook N8N:

```json
{
  "userId": "uid_do_firebase",
  "conversationId": "chat_id",
  "message": "mensagem do usuário",
  "history": [
    { "role": "user",      "content": "mensagem anterior" },
    { "role": "assistant", "content": "resposta anterior" }
  ]
}
```

`history` inclui as últimas N mensagens da conversa (sugestão: 10 pares) para contexto do agente.

### Resposta esperada do N8N

```json
{ "response": "texto da resposta do agente" }
```

### Fluxo do endpoint de envio de mensagem

1. Valida token Bearer (middleware existente)
2. Lê as últimas mensagens da conversa no Firestore (para montar `history`)
3. Salva a mensagem do usuário: `{ role: 'user', content, createdAt: now }`
4. Chama `POST N8N_WEBHOOK_URL` com o payload acima
5. Salva a resposta do agente: `{ role: 'assistant', content: response, createdAt: now }`
6. Atualiza `updatedAt` no documento da conversa
7. Retorna `{ role: 'assistant', content: response, createdAt }`

---

## Frontend — arquivos a criar

```
frontend/src/
  stores/
    chat.js                # useChatsStore
  components/
    ChatWidget.vue         # Botão FAB flutuante com ícone de robô
    ChatPanel.vue          # Painel lateral completo
```

### `stores/chat.js` — useChatsStore

Estado:
```js
conversations: ref([])          // lista resumida { id, title, updatedAt }
activeConversationId: ref(null)
messages: ref([])               // mensagens da conversa ativa
loading: ref(false)             // loading de resposta do agente
panelAberto: ref(false)
```

Actions:
- `carregarConversas()` — GET /chat/conversations
- `criarConversa()` — POST /chat/conversations → seta activeConversationId
- `selecionarConversa(id)` — seta activeConversationId + carrega mensagens
- `carregarMensagens(id)` — GET /chat/conversations/:id/messages
- `enviarMensagem(content)` — adiciona mensagem user optimisticamente → POST → adiciona resposta

### `ChatWidget.vue`

- Botão circular fixo, posicionado acima do FAB `+` existente (bottom: 5rem em mobile, bottom: 2rem desktop)
- Ícone SVG de robô
- `@click` → `chatStore.panelAberto = true`
- Animação de entrada com Motion ao montar (scale + fade)
- Usar `<Teleport to="body">` para não ser afetado por `overflow: hidden` de containers pai

### `ChatPanel.vue`

Layout (painel lateral, 420px, desliza da direita):

```
┌──────────────────────────────────────┐
│  Assistente IA              [×]      │
├────────────┬─────────────────────────┤
│ Conversas  │  [mensagens do chat]    │
│ ────────── │                         │
│ > Chat 1   │  user: olá              │
│ > Chat 2   │  IA: olá! posso ajudar  │
│            │                         │
│ [+ Nova]   │  [input]           [→]  │
└────────────┴─────────────────────────┘
```

- Overlay escuro atrás do painel (`@click` fecha)
- `<Transition name="chat-panel">` — desliza da direita (translateX: 100% → 0)
- Lista de conversas clicável, conversa ativa highlighted
- Botão "+ Nova conversa"
- Área de mensagens com scroll automático para o fim
- Balões: usuário alinhado à direita (cor accent), assistente à esquerda (surface)
- Input + botão enviar; Enter envia, Shift+Enter quebra linha
- Estado de loading: bolinha animada (três pontos pulsando) enquanto aguarda N8N
- Markdown básico nas respostas do agente (negrito, itálico, listas)

---

## CSS a adicionar em `public/css/index.css`

Seletores planejados:
```
.chat-fab               — botão flutuante robô
.chat-panel-overlay     — fundo escuro clicável
.chat-panel             — painel lateral (position: fixed, right: 0)
.chat-panel-sidebar     — coluna esquerda (lista de conversas)
.chat-panel-main        — coluna direita (mensagens + input)
.chat-message           — balão de mensagem
.chat-message.is-user   — alinhado à direita
.chat-message.is-assistant — alinhado à esquerda
.chat-input-row         — linha do input + botão
.chat-typing-indicator  — animação de três pontos
```

Transição do painel:
```css
.chat-panel-enter-from { transform: translateX(100%); }
.chat-panel-leave-to   { transform: translateX(100%); }
```

---

## Integração em `App.vue`

Adicionar ao shell existente (dentro de `v-show="authStore.isLoggedIn"`):
```html
<ChatWidget />
<ChatPanel />
```

Importar `ChatWidget` e `ChatPanel`.

---

## Configuração do N8N

O N8N precisa expor um webhook que:
1. Receba `POST` com o payload descrito acima
2. Passe `message` + `history` para o nó de agente IA (LangChain, OpenAI, etc.)
3. Retorne `{ "response": "..." }`

Sugestão de estrutura do fluxo N8N:
```
Webhook trigger
  → Set (formata histórico para o formato do modelo)
  → AI Agent (com memória passada via history)
  → Respond to Webhook (body: { response: $json.output })
```

A URL do webhook vai para `N8N_WEBHOOK_URL` no backend.

---

## Ordem de implementação sugerida

1. Configurar e testar o fluxo N8N (retornando resposta correta)
2. Criar `chat-data.service.js` e testar escrita/leitura no Firestore
3. Criar `chat.routes.js` + `chat.controller.js` + registrar em `routes/index.js`
4. Testar endpoints via curl/Postman
5. Criar `stores/chat.js`
6. Criar `ChatWidget.vue` + `ChatPanel.vue`
7. Integrar em `App.vue`
8. Adicionar CSS

---

## Pendências antes de implementar

- [ ] URL do webhook N8N (a ser definida após configurar o fluxo)
- [ ] Quantas mensagens de histórico enviar ao N8N por requisição (sugestão: 10 pares = 20 mensagens)
- [ ] O agente terá acesso aos dados do usuário (metas, refeições do dia)? Se sim, o backend pode incluir um snapshot do estado atual no payload do N8N

# CLAUDE.md — Tracker de Macronutrientes

Guia de referência completo para o projeto. Leia antes de qualquer alteração.

---

## Visão geral

Aplicação web para rastreamento de macronutrientes (carboidratos, proteínas, gorduras, calorias). Permite registrar refeições diárias, definir metas, cadastrar alimentos personalizados, calcular TMB/TDEE e gerar relatórios.

**Stack:**
- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vite, Pinia, Bootstrap 5 (CSS utilities), CSS customizado (design system VibeUX), Motion One, `@floating-ui/vue`
- **Backend:** Node.js + Express (ESM `"type": "module"`), sem ORM
- **Auth:** Firebase Authentication (client SDK no frontend, Admin SDK no backend)
- **Banco:** Firestore (via Firebase Admin no backend)
- **Deploy:** Vercel (frontend como site estático + backend como função serverless em `api/index.js`)

---

## Estrutura do repositório

```
/
├── frontend/           # App frontend (Vite + Vue 3)
│   ├── index.html      # Único HTML — monta o app Vue em #app
│   ├── vite.config.js  # Plugins vue() + tailwindcss(); proxy /api → 127.0.0.1:3333
│   ├── package.json    # deps: vue, pinia, @floating-ui/vue, motion, firebase
│   ├── .env.example    # Variáveis de ambiente do frontend (VITE_FIREBASE_*)
│   ├── public/
│   │   ├── css/index.css          # Todo o CSS customizado (design system VibeUX)
│   │   ├── data/taco-alimentos.js # Tabela TACO embutida como window.TACO_ALIMENTOS
│   │   ├── manifest.json          # PWA manifest (nome, ícones, shortcuts, display standalone)
│   │   ├── sw.js                  # Service Worker (cache-first, network-first, stale-while-revalidate)
│   │   └── icons/                 # SVG icons para PWA (icon.svg + icon-maskable.svg)
│   │   ── [LEGADO] model/, view/, controller/ — arquivos MVC originais, não usados pela app Vue
│   └── src/
│       ├── main.js                # Cria app Vue, usa pinia, monta em #app via DOMContentLoaded
│       ├── firebase.js            # Side-effect: inicia Firebase Auth, onAuthStateChanged → init stores
│       │                          # Expõe window.TrackerAuth e window._stores (compat. legada)
│       ├── App.vue                # Shell do app: AuthModal | AppHeader + <component :is> + AppToast
│       ├── stores/
│       │   ├── pinia.js           # createPinia() + setActivePinia() — instância singleton
│       │   ├── auth.js            # useAuthStore: user, isReady, isLoggedIn, uid
│       │   ├── tracker.js         # useTrackerStore: estado principal + CRUD + relatórios + persistência
│       │   ├── food.js            # useFoodStore: TACO, personalizados, favoritos, histórico
│       │   └── ui.js              # useUIStore: paginaAtual, toasts, navegarPara, mostrarToast
│       ├── composables/
│       │   ├── api.js             # Cliente HTTP — setTokenProvider + api.{get,save,patch,...}
│       │   └── useFoodSearch.js   # Busca com debounce 120ms, navegação por teclado, categorias
│       ├── components/
│       │   ├── AppSelect.vue      # Combo customizado: Floating UI + Teleport + Motion + teclado
│       │   ├── AppMacroBar.vue    # Barra SVG animada (Motion): valor/meta, cor por estado
│       │   ├── FoodSearchDropdown.vue # Dropdown de busca: Floating UI + Teleport + highlight
│       │   ├── AppHeader.vue      # Top nav, date picker, user panel (desktop)
│       │   ├── AppBottomNav.vue   # Bottom nav mobile ≤767px, FAB +
│       │   ├── AppToast.vue       # Toast stack via <TransitionGroup>
│       │   ├── AuthModal.vue      # Tela de login/cadastro (2 etapas com código)
│       │   └── AccountModal.vue   # Modal "Minha conta" + exclusão de conta
│       └── pages/
│           ├── PageDashboard.vue  # Resumo do dia, anéis SVG, barras AppMacroBar, FoodSearchDropdown
│           ├── PageRefeicoes.vue  # Lista de refeições, edição, mover, templates, AppSelect
│           ├── PageAlimentos.vue  # Cadastro e biblioteca de alimentos personalizados
│           ├── PageMetas.vue      # Metas diárias com AppMacroBar para progresso
│           ├── PageRelatorios.vue # Relatório PDF com AppSelect de período
│           └── PageCalculadora.vue # TMB/TDEE, AppSelect, count-up animado via RAF
├── backend/
│   └── src/
│       ├── server.js              # Ponto de entrada dev (node --watch)
│       ├── app.js                 # createApp() — Express com CORS e rotas
│       ├── config/
│       │   ├── env.js             # Todas as variáveis de ambiente com defaults
│       │   └── firebase-admin.js  # Inicializa Firebase Admin SDK
│       ├── routes/
│       │   ├── index.js           # Agrega todos os roteadores
│       │   ├── auth.routes.js     # /auth/signup-code, /auth/complete-signup
│       │   ├── account.routes.js  # /auth/account (DELETE)
│       │   ├── tracker.routes.js  # /tracker/state (GET, PUT, PATCH)
│       │   └── health.routes.js   # /health
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── account.controller.js
│       │   └── tracker.controller.js
│       ├── middlewares/
│       │   ├── auth.middleware.js
│       │   └── admin-credentials.middleware.js
│       └── services/
│           ├── tracker-data.service.js
│           ├── signup-code.service.js
│           ├── email.service.js
│           └── account.service.js
├── api/
│   └── index.js        # Entry point da função serverless Vercel
├── firebase/
│   ├── firestore.rules
│   └── firestore.indexes.json
├── data/
│   └── Taco-4a-Edicao*.csv
├── scripts/
│   └── converter-taco.js
├── firebase.json
├── vercel.json
├── package.json        # Raiz: scripts dev/build, devDep concurrently
└── .gitignore
```

---

## Como rodar localmente

```bash
# Na raiz do projeto
npm install
npm run dev
# Inicia backend (porta 3333) e frontend Vite (porta 5173) simultaneamente via concurrently

# Separado:
npm run dev:backend   # node --watch backend/src/server.js
npm run dev:frontend  # vite --host 127.0.0.1
```

O Vite tem proxy configurado em `frontend/vite.config.js`: requisições `/api/*` são encaminhadas para `http://127.0.0.1:3333`. O frontend NUNCA acessa a porta do backend diretamente — sempre usa `/api`.

**Arquivo de variáveis local:** `backend/.env.local` (não versionado). Ver `backend/.env.example`.

---

## Variáveis de ambiente (backend)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Prod | JSON da service account em base64 |
| `GOOGLE_APPLICATION_CREDENTIALS` | Dev | Caminho para o JSON da service account |
| `AUTH_CODE_SECRET` | Prod | String longa aleatória para hash dos códigos |
| `AUTH_CODE_TTL_MINUTES` | Não | Validade do código (default: 15) |
| `FRONTEND_ORIGIN` | Prod | URL(s) do frontend separadas por vírgula |
| `RESEND_API_KEY` | Email | API key do Resend |
| `SMTP_HOST/PORT/USER/PASS` | Email | Alternativa SMTP ao Resend |
| `MAIL_FROM` | Email | Remetente dos e-mails |

Em desenvolvimento sem credenciais de e-mail, o código de cadastro é impresso no console do backend.

### Variáveis de ambiente (frontend)

Definidas em `frontend/.env.local` (não versionado). Ver `frontend/.env.example`. São prefixadas com `VITE_FIREBASE_` e configuram o Firebase client SDK (apiKey, authDomain, projectId, etc.). Injetadas em `frontend/src/firebase.js` via `import.meta.env`.

---

## API — Endpoints

Todos os endpoints ficam em `/api/...`.

### Autenticação
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/auth/signup-code` | Não | Solicita código de cadastro por e-mail |
| `POST` | `/auth/complete-signup` | Não | Cria usuário Firebase com email + senha + código |
| `DELETE` | `/auth/account` | Bearer | Deleta conta e todos os dados do usuário |

### Tracker (requer Bearer token Firebase)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/tracker/state` | Carrega estado completo do usuário |
| `PUT` | `/tracker/state` | Salva estado completo (full save) |
| `PATCH` | `/tracker/change` | Aplica mudança incremental (otimizado) |

### Utilitários
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/` | Info da API |

### Mudanças incrementais (`PATCH /tracker/change`)

O body tem `{ change, fullData }`. O campo `change.tipo` determina o que é salvo:
- `"goals"` — apenas metas diárias
- `"bmr"` — apenas perfil TMB
- `"customFood"` — apenas um alimento personalizado
- `"userMeta"` — favoritos e histórico
- `"day"` — refeições de um dia específico
- Qualquer outro valor — full save via `fullData`

---

## Estrutura Firestore

```
users/{userId}/
  (doc raiz)           # { favoritos: [], historicoAlimentos: [], updatedAt }
  goals/current        # { carboidratos, proteinas, gorduras, calorias, updatedAt }
  bmr/profile          # { sexo, peso, altura, idade, objetivo, resultado, macros, updatedAt }
  customFoods/{id}     # Alimentos personalizados do usuário
  days/{YYYY-MM-DD}    # Resumo do dia (totais, mealTotals, entryCount)
    entries/{id}       # Item individual de refeição { nome, quantidade, carboidratos, proteinas, gorduras, calorias, refeicaoId, order }

signupCodes/{emailHash}/  # Códigos de cadastro pendentes (TTL controlado por campo expiresAt)
```

**Migração legada:** O serviço também tenta ler de `users/{userId}/tracker/state` (estrutura antiga de documento único). Se não houver dados na estrutura nova, usa a legada.

---

## Frontend — Arquitetura Vue 3 + Pinia

O frontend é uma **SPA Vue 3** com Composition API (`<script setup>`) em todos os componentes. Sem Options API, sem `this`, sem `defineComponent` explícito.

### Inicialização (`main.js` + `firebase.js`)

```
index.html carrega:
  1. public/data/taco-alimentos.js → window.TACO_ALIMENTOS (script defer, antes do bundle)
  2. src/main.js (type="module") → createApp(App).use(pinia).mount('#app')
  3. src/firebase.js (side-effect importado via index.html ou main.js)
     → inicia Firebase Auth
     → onAuthStateChanged: seta authStore.user, chama trackerStore.init(dadosRemotos, uid)
     → expõe window.TrackerAuth (usado por AuthModal.vue para login/logout/reset)
     → expõe window._stores (compat. com código legado)
```

### Pinia Stores

| Store | Arquivo | Responsabilidade |
|---|---|---|
| `useAuthStore` | `stores/auth.js` | `user`, `isReady`, `isLoggedIn`, `uid` — preenchido pelo `onAuthStateChanged` em `firebase.js` |
| `useTrackerStore` | `stores/tracker.js` | Estado principal: metas, refeições, TMB, templates. Todo CRUD. Persistência local (localStorage) + remota (API). Geração de relatórios |
| `useFoodStore` | `stores/food.js` | Tabela TACO, alimentos personalizados, favoritos, histórico. `todosAlimentos` computed une TACO + personalizados |
| `useUIStore` | `stores/ui.js` | `paginaAtual`, `toasts`, `navegarPara()`, `mostrarToast()`, `contaModalAberta`, `preselectedFoodId` |

**Padrão de persistência no `useTrackerStore`:**
- `salvar(alteracao?)` — salva em localStorage + chama `api.applyTrackerChange` (incremental) ou `api.saveTrackerState` (full). Erros remotos são silenciados com `console.warn`.
- Chave de localStorage: `trackerMacronutrientes:v1` (anônimo) ou `trackerMacronutrientes:v1:user:{uid}` (autenticado).

### Composables

**`composables/api.js`**
- Cliente HTTP simples sobre `fetch`. `setTokenProvider(fn)` registra o getter do Firebase ID token — injetado por `firebase.js`.
- Cada request inclui `Authorization: Bearer <token>` automaticamente se houver usuário logado.

**`composables/useFoodSearch.js`**
- Estado: `termo`, `resultados`, `alimentoSelecionadoId`, `painelAberto`, `focusedIndex`
- Busca com debounce de 120ms. Sem termo: exibe histórico recente (até 8). Com termo: filtra `todosAlimentos`, prioriza prefixos, limita a 8 resultados.
- `buscarPorCategoria(id)` — filtra/ordena por macro (carboidratos, proteínas, gorduras, baixas calorias).
- `moverFoco(delta)` / `selecionarFocado()` — navegação por teclado, usados pelo `FoodSearchDropdown`.
- Retorna objeto reutilizável; cada page/componente cria sua própria instância via `useFoodSearch()`.

### Roteamento de páginas (`App.vue`)

Não usa Vue Router. A navegação é um `ref` reativo `uiStore.paginaAtual` que troca o componente via `<component :is>`:

```html
<Transition name="page" mode="out-in">
  <div class="page-view is-active" :key="paginaAtual">
    <component :is="pageComponents[paginaAtual]" />
  </div>
</Transition>
```

`pageComponents` é um mapa estático:
```js
{ dashboard, refeicoes, alimentos, metas, relatorios, calculadora }
```

`uiStore.navegarPara(pagina)` atualiza `paginaAtual` e escreve `window.location.hash`. No load, `App.vue` lê o hash e define a página inicial.

---

## Páginas

| Componente | Rota lógica | Conteúdo principal |
|---|---|---|
| `PageDashboard.vue` | `dashboard` | Anéis SVG de macro (animados com CSS transition + `ringAnimReady`), `AppMacroBar` para cada macro, `FoodSearchDropdown` para busca rápida, `AppSelect` para tipo de refeição |
| `PageRefeicoes.vue` | `refeicoes` | Lista de refeições por tipo, `<TransitionGroup name="meal-item">` para itens, `AppSelect` para mover item e aplicar template, `FoodSearchDropdown` no painel de edição |
| `PageAlimentos.vue` | `alimentos` | Formulário de cadastro, lista de chips de alimentos personalizados |
| `PageMetas.vue` | `metas` | Formulário de metas, `AppMacroBar` para cada macro (progresso do dia) |
| `PageRelatorios.vue` | `relatorios` | `AppSelect` para período, prévia do relatório, export via `window.print()`. O elemento de print tem `id="relatorioPreview"` (necessário para o CSS de impressão) |
| `PageCalculadora.vue` | `calculadora` | `AppSelect` para sexo e objetivo, resultado TMB + macros com count-up animado via RAF |

---

## Componentes de UI Customizados

### `AppSelect.vue`
Combo completamente customizado, substitui `<select>` nativo em todas as páginas.

- **Posicionamento:** `useFloating` do `@floating-ui/vue` com `transform: false` (usa `top`/`left` em vez de `transform`, evitando conflito com animações Motion). Middleware: `offset(4)`, `flip`, `size` (min-width igual ao trigger).
- **DOM:** dropdown via `<Teleport to="body">` + `v-show` para não ser clipado por `overflow: hidden` de containers pai.
- **Animação:** `watch(open, async (val) => { await nextTick(); animate(...) })` — o `nextTick` é obrigatório para garantir que Vue removeu `display: none` antes de Motion animar (`flush: 'pre'` padrão do watch faria a animação rodar num elemento ainda oculto).
- **Teclado:** setas, Enter, Escape, Space.
- **Fechar ao clicar fora:** `mousedown` listener no document, verifica `containerRef` E `dropdownRef` (pois o dropdown está em body via Teleport).
- **Props:** `modelValue` (String), `options` (`{ value, label }[]`), `disabled`, `placeholder`.
- **Emit:** `update:modelValue`.
- **CSS especial:** `.app-select.move-select { min-width: 4.75rem }` — somente o combo de mover item (contexto apertado).

### `AppMacroBar.vue`
Barra de progresso SVG animada, substitui as barras CSS manuais.

- SVG `viewBox="0 0 300 10"`, `width="100%"`. Rect de track + rect de fill animado via Motion (`animate(fillRef, { width: [0, targetBarWidth()] })`).
- Cor do fill muda automaticamente: cor padrão → `var(--success)` ao atingir 95% → `var(--danger)` ao passar de 110%.
- Marcador de target (rect branco) indica a posição da meta na barra.
- Anima no `onMounted` e ao mudar `props.value`.
- **Props:** `value`, `target`, `color`, `label`, `unit`, `pct`.
- **Cores por macro (padrão em todo o sistema):**
  - Carboidratos: `#2563eb`
  - Proteínas: `var(--primary)` (#1D6B57)
  - Gorduras: `#b76617`
  - Calorias: `var(--accent)` (#d9822b)

### `FoodSearchDropdown.vue`
Dropdown de busca de alimentos com posicionamento inteligente.

- Mesma estratégia de `AppSelect`: `useFloating` + `<Teleport to="body">` + `v-show`.
- Recebe `foodSearch` (instância de `useFoodSearch()`) como prop — não gerencia estado próprio.
- Highlight de termos via `v-html` com `<mark>` (CSS: `background: transparent; color: var(--primary); font-weight: 700`).
- Slot `#after-input` para inserir controles extras abaixo do campo (ex: botões de categoria no Dashboard).
- Prop `inputId` para referenciar o input de fora (label `for=`).
- Emit `@selecionar` quando um item é escolhido.

---

## Sistema de Animações

O projeto usa três mecanismos distintos, cada um para um caso específico:

### 1. Motion One (`motion`) — animações imperativas de elementos DOM

Usado quando a animação precisa ocorrer em resposta a um evento (abrir/fechar, valor mudar) e não há CSS transition adequado.

- `AppSelect`: `animate(el, { opacity: [0,1], y: [-6,0] }, { duration: 0.18 })` ao abrir; `animate(el, { opacity: [1,0], y: [0,-4] }, { duration: 0.12 }).then(...)` ao fechar.
- `AppMacroBar`: `animate(fillRef, { width: [0, targetW] }, { duration: 0.7, easing: [0.25,0,0,1] })`.
- `FoodSearchDropdown`: mesma lógica de abrir/fechar do AppSelect.
- **Regra crítica:** sempre `await nextTick()` antes de animar elementos controlados por `v-show` — sem isso o watch (`flush: 'pre'`) anima antes de Vue remover `display: none`.

### 2. Vue Transitions — transições de montagem/desmontagem

Usado quando elementos entram/saem do DOM (`v-if`) ou uma lista muda.

- **Troca de página:** `<Transition name="page" mode="out-in">` em `App.vue`. CSS: `.page-enter-from { opacity: 0; transform: translateY(6px) }`.
- **Itens de refeição:** `<TransitionGroup name="meal-item">` em `PageRefeicoes`. CSS: `meal-item-leave-active { position: absolute }` para evitar layout shift durante a saída.
- **Campo de código de cadastro** em `AuthModal`: `<Transition name="auth-code">` + `v-if`. CSS usa `max-height: 0 → 200px` + `opacity` + `translateY` para animar a revelação suave de um elemento com `height: auto`.

### 3. RAF count-up — animação de valores numéricos

Usado em `PageCalculadora.vue` para animar o resultado TMB e os macros ao calcular ou trocar objetivo.

```js
function animateAll(toResultado, toMacros) {
  // único loop RAF para todos os valores, cancelável, ease-out cúbico
}
watch(perfil, (p) => animateAll(p.resultado, p.macros), { immediate: true, deep: true })
```

- `deep: true` é essencial: `perfil.resultado` não muda ao trocar `objetivo`, mas `perfil.macros` muda — o watch superficial perderia esse evento.
- `onUnmounted` cancela o RAF pendente.

### 4. CSS transition pura — anéis de macro no Dashboard

Os anéis SVG no Dashboard usam `stroke-dashoffset` com `transition: stroke-dashoffset 0.6s cubic-bezier(0.25, 0, 0, 1)` no CSS. O valor é controlado via `:style` reativo. `ringAnimReady = ref(false)` previne a animação regressiva no mount (começa como 0% e anima até o valor real).

---

## Fluxo de autenticação

1. **Login:** `AuthModal.vue` → `window.TrackerAuth.login(email, password)` → `signInWithEmailAndPassword`
2. **Estado:** `onAuthStateChanged` em `firebase.js` → `authStore.user = user` → `App.vue` mostra o shell
3. **Dados:** `onAuthStateChanged` → `api.getTrackerState()` → `trackerStore.init(dadosRemotos, uid)`
4. **Token:** `firebase.js` registra `setTokenProvider(() => auth.currentUser?.getIdToken())` — todo request da API inclui `Authorization: Bearer <token>` automaticamente
5. **Backend:** `auth.middleware.js` → `auth.verifyIdToken(token)` → popula `request.user.uid`
6. **Cadastro:** 2 passos — `POST /auth/signup-code` → código por e-mail (ou console em dev) → `POST /auth/complete-signup` → Firebase cria usuário → login automático
7. **Logout:** `window.TrackerAuth.logout()` → `signOut` → `onAuthStateChanged` dispara com `null` → `trackerStore.resetarDadosUsuario()`

O campo de código de cadastro em `AuthModal.vue` usa `<Transition name="auth-code">` + `v-if` — revela suavemente na etapa 2 sem ocupar foco/tab quando oculto.

---

## Design System (CSS)

Todo o CSS customizado fica em `frontend/public/css/index.css`. Não usa Tailwind para estilização (Tailwind está no `vite.config.js` mas o sistema VibeUX é CSS puro).

### Paleta de cores (light mode)
```css
--bg-base: #F9FAFB        /* fundo da página */
--bg-secondary: #F3F4F6   /* fundo secundário, thead de tabelas */
--surface: #FFFFFF         /* cards, inputs */
--surface-warm: #FFF7ED    /* destaque laranja suave */
--text-primary: #1D2939    /* texto principal */
--text-secondary: #667085  /* texto auxiliar, labels */
--line: #EAECF0            /* bordas, divisores */
--input-border: #D0D5DD    /* borda de inputs */
--primary: #1D6B57         /* cor da marca (verde) */
--accent: #d9822b          /* acento (laranja) */
--danger: #D92D20
--success: #039855
--warning: #F79009
--shadow-soft: 0 4px 16px rgba(0,0,0,0.06)
--shadow-panel: 0 2px 8px rgba(0,0,0,0.05)
```

### Dark mode
Definido em `@media (prefers-color-scheme: dark)` no topo do CSS. Sobrescreve as variáveis `:root`. Elementos com `var(--primary)` em texto têm override para `#34d399` (verde claro visível em dark).

### Regras importantes do CSS
- **Sem gradientes** — todos os fundos são cores sólidas
- **Fundos hardcoded:** evitar — usar sempre variáveis CSS para que dark mode funcione
- **Tabelas Bootstrap:** sobreescrever `--bs-table-color`, `--bs-table-bg`, `--bs-table-border-color` no `.table`. O seletor Bootstrap tem especificidade 0,1,3 — regras diretas 0,1,2 são superadas.
- **Bottom nav mobile:** visível em `≤767px`, substitui o top nav. 4 itens fixos + "Mais" (Alimentos, Relatórios). FAB (+) foca o campo de busca no Dashboard.
- **AppSelect dropdown:** usa `position: fixed` (via Floating UI). Não usar `position: absolute` — seria clipado por containers com `overflow: hidden`. Z-index: 500.
- **AppSelect trigger:** `.app-select-value` precisa de `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` para não vazar texto. `.app-select.move-select` tem `min-width: 4.75rem` para o contexto apertado das ações de item de refeição.
- **`max-height` trick para altura `auto`:** usado na transição `auth-code` para animar altura de elementos com `height: auto`. `max-height: 0 → 200px` + `overflow: hidden`.

---

## PWA (Progressive Web App)

O app é instalável como PWA. Os arquivos relevantes ficam em `frontend/public/`.

- **`manifest.json`** — define nome, ícones, `display: standalone`, `theme_color: #1D6B57` e um shortcut "Adicionar alimento" (`/?acao=adicionar`)
- **`sw.js`** — Service Worker com três estratégias de cache:
  - **cache-first** — `/data/taco-alimentos.js` (arquivo grande, nunca muda)
  - **network-first** — `index.html` / navegação SPA (pega atualizações, cai no cache offline)
  - **stale-while-revalidate** — demais assets da origem e recursos externos
  - Requisições `/api/*` nunca são cacheadas
- **`icons/`** — `icon.svg` (any) e `icon-maskable.svg` (maskable) em SVG

**Regra:** ao mudar assets que ficam em cache, incrementar `CACHE_VERSION` em `sw.js` para invalidar caches antigos.

---

## Firebase CLI (config local)

Os arquivos `firebase.json` e `.firebaserc` na raiz são usados apenas pelo Firebase CLI (ex: `firebase deploy --only firestore:rules`). Não afetam o deploy no Vercel.

- **`firebase/firestore.rules`** — `allow read, write: if request.auth != null && request.auth.uid == userId;`
- **`firebase/firestore.indexes.json`** — sem índices compostos adicionais no momento

---

## Deploy (Vercel)

```json
{
  "installCommand": "cd frontend && npm install && cd ../backend && npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "functions": { "api/index.js": { "memory": 512, "maxDuration": 15 } },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/:path*",     "destination": "/index.html" }
  ]
}
```

**Variáveis de ambiente no Vercel (painel):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_BASE64` — JSON da service account em base64 (sem quebras de linha)
- `AUTH_CODE_SECRET` — string aleatória longa
- `FRONTEND_ORIGIN` — URL do deploy (ex: `https://tracker-xyz.vercel.app`)
- `RESEND_API_KEY` + `MAIL_FROM` ou variáveis SMTP

**Por que `npm install` e não `npm ci`:** O `firebase-admin` tem dependências nativas (`@emnapi`) específicas de plataforma. O lockfile gerado no Windows não inclui os binários Linux, então `npm ci` falha no ambiente Vercel (Linux).

---

## Decisões técnicas notáveis

- **Vue 3 sem Vue Router:** a navegação é `uiStore.paginaAtual` (string) + `<component :is>`. Simples para uma SPA de 6 páginas fixas — evita configurar rotas, guards e lazy loading.

- **Pinia com `setActivePinia` em `pinia.js`:** `createPinia()` e `setActivePinia()` são chamados em `stores/pinia.js` antes da criação do app Vue, permitindo que `firebase.js` (que roda como side-effect antes do app montar) use os stores com `useAuthStore()` etc.

- **`window.TrackerAuth` ainda existe:** `firebase.js` ainda expõe o objeto `window.TrackerAuth` e `window._stores`. `AuthModal.vue` usa `window.TrackerAuth.login/logout/resetPassword` diretamente — isso evita importar firebase/auth nos componentes Vue e centraliza toda lógica de auth no side-effect module.

- **Dados TACO embutidos:** `public/data/taco-alimentos.js` define `window.TACO_ALIMENTOS` carregado como script estático — sem requisição de API. `firebase.js` chama `foodStore.loadTacoData(window.TACO_ALIMENTOS)` imediatamente ao carregar (antes do `onAuthStateChanged` resolver) para que a busca de alimentos funcione mesmo offline.

- **Floating UI com `transform: false`:** `AppSelect` e `FoodSearchDropdown` usam `transform: false` no `useFloating`. Isso faz o Floating UI usar `top`/`left` em vez de `transform: translate(X,Y)` para posicionar o dropdown. Sem isso, Motion One's `y` animation (que também usa `transform`) sobrescreve o posicionamento e o dropdown aparece fora de lugar.

- **`nextTick()` antes de animar com `v-show`:** watchers Vue com `flush: 'pre'` (padrão) disparam antes do DOM ser atualizado. Animar um elemento com `v-show` sem `nextTick` faz Motion rodar sobre um elemento ainda em `display: none`, sem efeito visual. Sempre: `watch(open, async (val) => { await nextTick(); animate(el, ...) })`.

- **`deep: true` no watch de `perfil` (Calculadora):** `perfil.resultado` (TMB) não muda ao trocar `objetivo` — apenas `perfil.macros` muda. Um watch superficial em `resultado` nunca dispara nesse caso. Watch em `perfil` com `deep: true` captura qualquer mudança no objeto.

- **Mudança incremental vs full save:** `PATCH /tracker/change` com `change.tipo` evita reescrever toda a estrutura Firestore a cada interação. Cada tipo atualiza apenas o documento relevante.

- **Dados legados:** Usuários antigos têm dados em `users/{uid}/tracker/state` (documento único). O backend tenta a estrutura nova primeiro e cai no legado se não encontrar.

- **CORS dev:** Em `NODE_ENV=development`, qualquer origem `localhost` ou `127.0.0.1` é permitida automaticamente. Em produção, somente `FRONTEND_ORIGIN`.

- **Arquivos MVC legados em `public/`:** `model.js`, `view.js`, `controller.js` ainda existem no repositório como artefatos da arquitetura original. Não são usados pela app Vue 3. Não devem ser editados ou referenciados em código novo.

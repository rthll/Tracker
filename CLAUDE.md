# CLAUDE.md — Tracker de Macronutrientes

Guia de referência completo para o projeto. Leia antes de qualquer alteração.

---

## Visão geral

Aplicação web para rastreamento de macronutrientes (carboidratos, proteínas, gorduras, calorias). Permite registrar refeições diárias, definir metas, cadastrar alimentos personalizados, calcular TMB/TDEE e gerar relatórios.

**Stack:**
- **Frontend:** Vanilla JS (MVC manual), Vite (build/dev), Bootstrap 5 (CSS grid/utilities), CSS customizado
- **Backend:** Node.js + Express (ESM `"type": "module"`), sem ORM
- **Auth:** Firebase Authentication (client SDK no frontend, Admin SDK no backend)
- **Banco:** Firestore (via Firebase Admin no backend)
- **Deploy:** Vercel (frontend como site estático + backend como função serverless em `api/index.js`)

---

## Estrutura do repositório

```
/
├── frontend/           # App frontend (Vite)
│   ├── index.html      # Único HTML — toda a UI está aqui
│   ├── .env.example    # Variáveis de ambiente do frontend (VITE_FIREBASE_*)
│   ├── public/
│   │   ├── css/index.css          # Todo o CSS customizado (design system VibeUX)
│   │   ├── data/taco-alimentos.js # Tabela TACO embutida como window.TACO_ALIMENTOS
│   │   ├── model/model.js         # Model (estado global, persistência local + remota)
│   │   ├── view/view.js           # View (manipulação de DOM, renderização)
│   │   ├── controller/controller.js # Controller (eventos, lógica de negócio)
│   │   ├── services/api.js        # Cliente HTTP para a API backend
│   │   ├── manifest.json          # PWA manifest (nome, ícones, shortcuts, display standalone)
│   │   ├── sw.js                  # Service Worker (cache-first, network-first, stale-while-revalidate)
│   │   └── icons/                 # SVG icons para PWA (icon.svg + icon-maskable.svg)
│   └── src/
│       ├── api-config.js          # Define window.TRACKER_API_BASE_URL
│       ├── firebase.js            # Firebase client SDK — expõe window.TrackerAuth e window.TrackerDataService
│       └── pwa.js                 # Registra o Service Worker; mostra toast ao detectar atualização
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
│       │   ├── auth.controller.js     # Handlers de autenticação
│       │   ├── account.controller.js  # Handler de deleção de conta
│       │   └── tracker.controller.js  # Handlers de leitura/escrita do estado
│       ├── middlewares/
│       │   ├── auth.middleware.js             # Valida Bearer token Firebase
│       │   └── admin-credentials.middleware.js # Guarda rotas se não há credenciais Admin
│       └── services/
│           ├── tracker-data.service.js  # Toda a lógica de leitura/escrita no Firestore
│           ├── signup-code.service.js   # Fluxo de cadastro com código por e-mail
│           ├── email.service.js         # Envio via Resend ou SMTP (nodemailer)
│           └── account.service.js       # Deleção recursiva de conta
├── api/
│   └── index.js        # Entry point da função serverless Vercel — importa e exporta createApp()
├── firebase/
│   ├── firestore.rules         # Regras de segurança: só o próprio uid pode ler/escrever seus dados
│   └── firestore.indexes.json  # Índices compostos (atualmente vazios)
├── data/
│   └── Taco-4a-Edicao*.csv    # CSV fonte da tabela TACO (origem do taco-alimentos.js)
├── scripts/
│   └── converter-taco.js      # Utilitário para converter o CSV TACO em window.TACO_ALIMENTOS
├── firebase.json       # Config do Firebase CLI (aponta para firebase/ e frontend/public)
├── vercel.json         # Config de build e rewrite rules para deploy
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

## Frontend — Arquitetura MVC

O frontend é **vanilla JS sem framework**, carregado como scripts `defer` e um módulo `type="module"`. Todos os objetos são globais (`window.*`).

### Ordem de carregamento (determinística via `defer`)
1. `taco-alimentos.js` → define `window.TACO_ALIMENTOS`
2. `model.js` → define `window.Model`
3. `view.js` → define `window.View`
4. `api.js` → define `window.Api`
5. `api-config.js` (module) → define `window.TRACKER_API_BASE_URL`
6. `firebase.js` (module) → define `window.TrackerAuth`, `window.TrackerDataService`, registra token provider em `window.Api`
7. `pwa.js` (module) → registra o Service Worker; detecta updates e exibe toast via `window.View`
8. `controller.js` → define `window.Controller`, chama `Controller.init()` via `DOMContentLoaded`

### Model (`model.js`)
- Estado global: `alimentosTaco`, `alimentosPersonalizados`, `refeicoesPorData`, `favoritos`, `historicoAlimentos`, `metasDiarias`, `tmbPerfil`
- Persistência local via `localStorage` com chave `trackerMacronutrientes:v1` (ou `:user:{uid}` quando autenticado)
- Persistência remota delegada para `window.TrackerDataService` (definido em `firebase.js`)
- Método `applyIncrementalChange()` escolhe automaticamente entre mudança incremental e full save

### View (`view.js`)
- Manipulação direta de DOM — sem virtual DOM
- Função `mostrarToast(mensagem, tipo)` para notificações não-bloqueantes
- Renderiza tabela de refeições, cards de dashboard, relatórios, calculadora TMB, etc.

### Controller (`controller.js`)
- Registra todos os event listeners em `init()`
- Navega entre páginas via `navegarPara(pagina)` — mostra/esconde sections com `data-page`, sincroniza top nav e bottom nav mobile
- Funções `salvarDados()` / `salvarDadosComFeedback()` chamam `Model.salvar()` que persiste local + remoto

---

## Páginas (seções SPA)

| `data-page` | Conteúdo |
|---|---|
| `dashboard` | Resumo do dia, gráficos de macro, refeições rápidas |
| `refeicoes` | Adicionar alimento ao dia, tabela de refeições |
| `alimentos` | Biblioteca de alimentos personalizados |
| `metas` | Definir metas diárias de macros/calorias |
| `relatorios` | Exportar dados por data |
| `calculadora` | TMB/TDEE com distribuição de macros por objetivo |

---

## Design System (CSS)

O CSS segue as regras VibeUX (arquivo `public/css/index.css`).

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
Definido em `@media (prefers-color-scheme: dark)` no topo do CSS. Sobrescreve as variáveis `:root`. Elementos com cores de texto verde (`var(--primary)`) têm override específico para `#34d399` (verde claro visível em dark).

### Regras importantes
- **Sem gradientes** — todos os fundos são cores sólidas
- **Tabelas Bootstrap:** sobreescrever `--bs-table-color`, `--bs-table-bg`, `--bs-table-border-color` no `.table` para que as variáveis Bootstrap apontem para nosso tema (o seletor Bootstrap `.table > :not(caption) > * > *` tem especificidade 0,1,3 e supera regras diretas 0,1,2)
- **Fundos hardcoded:** evitar — usar sempre variáveis CSS para que dark mode funcione
- **Bottom nav mobile:** visível em `≤767px`, substitui o top nav. 4 itens fixos + "Mais" (Alimentos, Relatórios)

---

## PWA (Progressive Web App)

O app é instalável como PWA. Os arquivos relevantes ficam em `frontend/public/`.

- **`manifest.json`** — define nome, ícones, `display: standalone`, `theme_color: #1D6B57` e um shortcut "Adicionar alimento" (`/?acao=adicionar`)
- **`sw.js`** — Service Worker com três estratégias de cache:
  - **cache-first** — `/data/taco-alimentos.js` (arquivo grande, nunca muda)
  - **network-first** — `index.html` / navegação SPA (pega atualizações, cai no cache offline)
  - **stale-while-revalidate** — demais assets da origem e recursos externos (Bootstrap CDN, Google Fonts)
  - Requisições `/api/*` nunca são cacheadas
- **`pwa.js`** — registra o SW; ao detectar novo conteúdo instalado (`updatefound`), exibe `View.mostrarToast('Atualização disponível...')`
- **`icons/`** — `icon.svg` (any) e `icon-maskable.svg` (maskable) em SVG

**Regra:** ao mudar assets que ficam em cache, incrementar `CACHE_VERSION` em `sw.js` para invalidar caches antigos.

---

## Firebase CLI (config local)

Os arquivos `firebase.json` e `.firebaserc` na raiz são usados apenas pelo Firebase CLI (ex: `firebase deploy --only firestore:rules`). Não afetam o deploy no Vercel.

- **`firebase/firestore.rules`** — regra única: `allow read, write: if request.auth != null && request.auth.uid == userId;` (só o próprio usuário acessa seus dados)
- **`firebase/firestore.indexes.json`** — sem índices compostos adicionais no momento

---

## Deploy (Vercel)

```json
// vercel.json
{
  "installCommand": "cd frontend && npm install && cd ../backend && npm install",
  "buildCommand": "npm run build",          // npm --prefix frontend run build
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

**Por que `npm install` e não `npm ci`:** O `firebase-admin` tem dependências nativas (`@emnapi`) específicas de plataforma. O lockfile gerado no Windows não inclui os binários Linux, então `npm ci` falha no ambiente Vercel (Linux). `npm install` resolve as dependências corretamente.

---

## Fluxo de autenticação

1. **Login:** `firebase.js` → `signInWithEmailAndPassword` → Firebase retorna ID token
2. **Token:** `firebase.js` registra `Api.setTokenProvider(() => user.getIdToken())` — todo request da API inclui `Authorization: Bearer <token>`
3. **Backend:** `auth.middleware.js` → `auth.verifyIdToken(token)` → popula `request.user.uid`
4. **Cadastro:** fluxo de 2 passos — solicitar código (`POST /auth/signup-code`) → receber por e-mail → confirmar com senha (`POST /auth/complete-signup`) → Firebase cria o usuário

O login (senha + Firebase Auth) não passa pelo backend — é direto no Firebase client SDK.

---

## Decisões técnicas notáveis

- **Dados TACO embutidos:** `public/data/taco-alimentos.js` define `window.TACO_ALIMENTOS` com toda a tabela TACO. Carregado como script estático — sem requisição de API para buscar alimentos base.
- **MVC global sem bundler para o runtime:** `model.js`, `view.js`, `controller.js` são carregados como scripts `defer` (não módulos) para que `window.*` funcione sem import/export. Somente `api-config.js` e `firebase.js` são módulos (`type="module"`) porque usam `import.meta.env` do Vite.
- **Mudança incremental vs full save:** `PATCH /tracker/change` com `change.tipo` evita reescrever toda a estrutura Firestore a cada interação. Cada tipo de mudança atualiza apenas o documento relevante.
- **Dados legados:** Usuários antigos têm dados em `users/{uid}/tracker/state` (documento único). O `loadUserData` tenta a estrutura nova primeiro e cai no legado se não encontrar.
- **CORS dev:** Em `NODE_ENV=development`, qualquer origem `localhost` ou `127.0.0.1` é permitida automaticamente. Em produção, somente `FRONTEND_ORIGIN`.

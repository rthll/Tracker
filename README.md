# Tracker de Macronutrientes

Aplicacao web com frontend Vite, backend Node.js/Express, Firebase Auth e persistencia Firestore para cadastro de alimentos, montagem de refeicoes diarias e acompanhamento de carboidratos, proteinas, gorduras e calorias.

## Visao geral

O projeto usa frontend e backend separados. O frontend roda com Vite e preserva a organizacao MVC da interface. O backend Node.js com Express governa as rotas da aplicacao, valida o ID token Firebase e persiste os dados no Firestore via Firebase Admin SDK.

A proposta e oferecer um fluxo direto para registrar alimentos, adicionar quantidades consumidas e visualizar os totais nutricionais por data.

A interface usa navegacao interna por paginas para separar o fluxo diario das configuracoes: Dashboard, Refeicoes, Alimentos, Metas, Relatorios e Calculadora.

## Funcionalidades

- Cadastro de alimentos personalizados com macros e calorias por 100g.
- Base TACO importada com alimentos padrao por 100g.
- Navegacao por paginas internas para separar as principais funcoes.
- Busca propria de alimentos com correspondencia parcial, recentes, origem TACO/personalizado e atalhos por categoria de macro.
- Busca otimizada com indice em memoria, cache de resultados e debounce durante a digitacao.
- Favoritos para alimentos usados com frequencia.
- Historico de alimentos adicionados recentemente.
- Registro separado por refeicao: cafe da manha, almoco, jantar e lanches.
- Totais por refeicao e totais consolidados do dia.
- Metas diarias de carboidratos, proteinas, gorduras e calorias.
- Barras de progresso visual para comparar consumo e meta.
- Dashboard do dia com calorias consumidas, calorias restantes e status da meta.
- Distribuicao percentual entre carboidratos, proteinas e gorduras.
- Grafico comparativo de meta x consumido para macros e calorias.
- Relatorios exportaveis em PDF para 1 dia, 7 dias, 30 dias ou dias especificos.
- Relatorios com macros, refeicoes, consistencia alimentar e aderencia as metas.
- Calculadora de taxa metabolica basal pela equacao de Mifflin-St Jeor.
- Aplicacao da TMB estimada como meta diaria de calorias.
- Movimentacao de alimentos entre refeicoes.
- Edicao de registros ja lancados, com alteracao de alimento, quantidade e refeicao.
- Botao para repetir as refeicoes do dia anterior.
- Persistencia em Firestore por usuario autenticado, com fallback local em `localStorage`.
- Cadastro com envio de codigo por e-mail antes da criacao da conta.
- Redefinicao de senha por e-mail pelo Firebase Auth.
- Selecao de uma data para organizar as refeicoes do dia.
- Calculo proporcional dos nutrientes conforme a quantidade informada.
- Tabela consolidada com totais de carboidratos, proteinas, gorduras e calorias.
- Remocao de itens da refeicao atual.
- Interface mobile-first e responsiva com foco em legibilidade e uso rapido em celular, tablet e desktop.

## Estrutura do projeto

```text
Tracker/
|-- api/
|   `-- index.js
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- app.js
|   |   `-- server.js
|   |-- .env.example
|   |-- package.json
|   `-- package-lock.json
|-- frontend/
|   |-- public/
|   |   |-- controller/
|   |   |-- css/
|   |   |-- data/
|   |   |-- model/
|   |   |-- services/
|   |   `-- view/
|   |-- index.html
|   |-- package.json
|   `-- package-lock.json
|-- data/
|   `-- Taco-4a-Edicao(CMVCol taco3).csv
|-- firebase/
|   |-- firestore.indexes.json
|   `-- firestore.rules
|-- scripts/
|   `-- converter-taco.js
|-- .firebaserc
|-- .gitignore
|-- firebase.json
|-- package.json
|-- vercel.json
`-- README.md
```

## Execucao Local

Instale as dependencias dos dois projetos:

```bash
cd frontend
npm install
cd ../backend
npm install
```

Inicie o backend:

```bash
cd backend
npm run dev
```

Inicie o frontend:

```bash
cd frontend
npm run dev
```

URLs locais padrao:

- Frontend Vite: `http://127.0.0.1:5173`
- Backend Express: `http://127.0.0.1:3333`
- Health check: `http://127.0.0.1:3333/api/health`

O frontend usa `frontend/.env.local` para configurar `VITE_TRACKER_API_BASE_URL` e `VITE_FIREBASE_*`.

Responsabilidades atuais:

- Frontend: interface, Firebase Auth, busca local TACO, estado visual e chamadas HTTP autenticadas para a API.
- Backend: API propria da aplicacao, validacao de ID token Firebase, persistencia Firestore, health check, CORS e governanca de rotas server-side.

## Deploy na Vercel

O projeto esta preparado para deploy unico na Vercel:

- `frontend/` e compilado pelo Vite e publicado como site estatico.
- `api/index.js` expoe o backend Express como Vercel Function.
- `vercel.json` instala dependencias de frontend/backend, roda o build do frontend e roteia `/api/*` para a Function.

Configuracao esperada na Vercel:

```text
Framework Preset: Other
Root Directory: ./
Install Command: npm ci --prefix frontend && npm ci --prefix backend
Build Command: npm run build
Output Directory: frontend/dist
```

Variaveis de ambiente necessarias na Vercel:

```env
NODE_ENV=production
FIREBASE_PROJECT_ID=trackermacro-5756a
FIREBASE_SERVICE_ACCOUNT_BASE64=...
FRONTEND_ORIGIN=https://seu-app.vercel.app
VITE_TRACKER_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
AUTH_CODE_SECRET=...
AUTH_CODE_TTL_MINUTES=15
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=...
```

Nao envie o JSON da service account para o repositorio. Converta o conteudo da chave para base64 e cadastre apenas em `FIREBASE_SERVICE_ACCOUNT_BASE64` no painel da Vercel.

O cadastro por codigo depende de SMTP em producao. Sem SMTP, o backend recusa o envio de codigo fora de `NODE_ENV=development`. Em desenvolvimento, quando SMTP nao esta configurado, o codigo aparece no log do backend e na resposta da API para facilitar testes locais.

Depois do primeiro deploy, adicione o dominio gerado pela Vercel no Firebase Authentication:

```text
Firebase Console > Authentication > Settings > Authorized domains
```

## Firebase

O frontend esta integrado ao Firebase Web SDK para autenticacao. A persistencia Firestore e governada pelo backend via Firebase Admin SDK.

Servicos usados nesta etapa:

- Firebase Authentication com e-mail/senha no frontend.
- Cloud Firestore persistido pelo backend apos validacao do ID token Firebase.
- Firebase Hosting configurado para servir `frontend/dist`.

Arquivos relevantes:

- `api/index.js`: entrada serverless usada pela Vercel para expor o backend Express.
- `frontend/src/firebase.js`: inicializacao do Firebase Auth e ponte de autenticacao para a API.
- `frontend/src/api-config.js`: configuracao da URL da API backend no frontend.
- `frontend/.env.example`: variaveis `VITE_FIREBASE_*` para deploy.
- `backend/src/config/firebase-admin.js`: inicializacao do Firebase Admin SDK.
- `backend/src/routes/auth.routes.js`: rotas publicas para solicitar codigo e concluir cadastro.
- `backend/src/routes/tracker.routes.js`: rotas protegidas de persistencia do tracker.
- `firebase/firestore.rules`: regras de seguranca por usuario.
- `firebase/firestore.indexes.json`: indices do Firestore.
- `firebase.json`: configuracao de Hosting e Firestore.
- `.firebaserc`: projeto Firebase padrao.

Estrutura atual no Firestore:

```text
users/{uid}
users/{uid}/customFoods/{foodId}
users/{uid}/days/{date}
users/{uid}/days/{date}/entries/{entryId}
users/{uid}/goals/current
users/{uid}/bmr/profile
```

O documento `users/{uid}` guarda dados leves de usuario do tracker, como favoritos e historico. As demais colecoes separam alimentos personalizados, dias, lancamentos, metas e perfil TMB. A base TACO continua estatica no frontend nesta fase.

Para o backend acessar Firestore via Firebase Admin SDK, configure uma credencial local segura em `backend/.env.local`.

Opcao 1, caminho do arquivo JSON da service account:

```env
FIREBASE_PROJECT_ID=trackermacro-5756a
GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\seguro\service-account.json
```

Opcao 2, service account em base64:

```env
FIREBASE_PROJECT_ID=trackermacro-5756a
FIREBASE_SERVICE_ACCOUNT_BASE64=...
```

Nao salve service account no repositorio. Use uma chave nova se alguma chave anterior foi exposta.

A persistencia usa escrita incremental:

- metas atualizam apenas `goals/current`;
- TMB atualiza apenas `bmr/profile`;
- alimento personalizado atualiza apenas `customFoods/{foodId}`;
- favoritos e historico atualizam apenas `users/{uid}`;
- refeicoes atualizam apenas `days/{date}` e `days/{date}/entries`.

Regras de seguranca:

```text
usuarios autenticados podem ler/escrever apenas em users/{uid}
```

## Arquitetura

### Frontend

Diretorio: `frontend/`

Responsavel por:

- Renderizar a interface do tracker.
- Controlar navegacao e eventos da UI.
- Executar Firebase Auth no navegador.
- Enviar ID token para o backend.
- Manter estado local da tela e fallback em `localStorage`.
- Fazer busca local na base TACO estatica.

Arquivos principais:

- `frontend/index.html`
- `frontend/src/firebase.js`
- `frontend/src/api-config.js`
- `frontend/public/model/model.js`
- `frontend/public/view/view.js`
- `frontend/public/controller/controller.js`
- `frontend/public/services/api.js`

### Model

Arquivo: `frontend/public/model/model.js`

Responsavel por armazenar:

- A lista de alimentos cadastrados.
- A base TACO carregada de `frontend/public/data/taco-alimentos.js`.
- As refeicoes agrupadas por data e tipo de refeicao.
- As metas diarias de macronutrientes e calorias.
- O ultimo perfil usado na calculadora de taxa metabolica basal.
- Favoritos e historico de alimentos.
- As operacoes de adicao, consulta, repeticao, movimentacao e remocao dos dados.
- A emissao de alteracoes incrementais para sincronizacao via backend.

### View

Arquivo: `frontend/public/view/view.js`

Responsavel por:

- Renderizar a busca propria de alimentos, resultados por categoria e origem nutricional.
- Alternar as paginas internas da aplicacao.
- Renderizar favoritos, historico e alimentos personalizados.
- Renderizar os totais por refeicao.
- Renderizar as barras de progresso das metas diarias.
- Renderizar a dashboard do dia, distribuicao percentual e grafico de meta x consumido.
- Renderizar a calculadora de taxa metabolica basal.
- Renderizar a previa dos relatorios nutricionais.
- Renderizar a tabela das refeicoes diarias.
- Exibir os totais nutricionais da interface.
- Refletir estados de vazio e feedback visual da pagina.

### Controller

Arquivo: `frontend/public/controller/controller.js`

Responsavel por:

- Inicializar a aplicacao.
- Capturar eventos da interface.
- Controlar a navegacao entre Dashboard, Refeicoes, Alimentos, Metas, Relatorios e Calculadora.
- Validar os dados informados pelo usuario.
- Calcular os valores proporcionais da refeicao.
- Editar registros existentes e recalcular os macronutrientes.
- Salvar e aplicar as metas diarias.
- Calcular TMB e aplicar o resultado como meta calorica quando solicitado.
- Gerar relatorios por periodo e acionar a exportacao em PDF pela impressao do navegador.
- Orquestrar busca parcial, selecao, favoritos, historico, categorias nutricionais, movimentacao e repeticao entre `Model` e `View`.

### Backend

Diretorio: `backend/`

Responsavel por:

- Validar ID token Firebase.
- Ler e gravar dados no Firestore via Firebase Admin SDK.
- Aplicar escrita incremental por tipo de alteracao.
- Expor rotas protegidas da aplicacao.
- Gerenciar CORS e health check.

Rotas principais:

- `GET /api/health`
- `GET /api/tracker/state`
- `PUT /api/tracker/state`
- `PATCH /api/tracker/change`

## Base TACO

O arquivo original da TACO fica em `data/Taco-4a-Edicao(CMVCol taco3).csv`.

O CSV e convertido para um arquivo JavaScript estatico usado pelo frontend:

```bash
node scripts/converter-taco.js
```

Esse comando gera `frontend/public/data/taco-alimentos.js` com `window.TACO_ALIMENTOS`.

Regras de IDs:

- Alimentos da TACO usam `taco:<numero>`, exemplo: `taco:1`.
- Alimentos personalizados usam `custom:<uuid>`.
- Alimentos personalizados antigos sao migrados automaticamente para o prefixo `custom:`.

Os valores da TACO sao por 100g. Valores `Tr` e `NA` sao tratados como `0` na conversao.

## Fluxo de uso

1. Use o Dashboard para registrar rapidamente alimentos nas refeicoes do dia.
2. Acompanhe no Dashboard calorias, distribuicao percentual e meta x consumido.
3. Use Refeicoes para revisar, mover ou remover itens.
4. Use Alimentos para cadastrar alimentos personalizados.
5. Use Metas para ajustar calorias e macronutrientes.
6. Use Relatorios para gerar PDF de 1 dia, 7 dias, 30 dias ou datas pontuais.
7. Use Calculadora para estimar a TMB e aplicar como meta calorica.

## Melhorias aplicadas nesta versao

- Autocomplete de alimentos no fluxo de registro.
- Cadastro persistente de alimentos personalizados.
- Favoritos e historico de alimentos recentes.
- Registro separado por refeicoes.
- Totais por refeicao.
- Metas diarias de calorias e macronutrientes.
- Barras de progresso visual para cada macro e calorias.
- Dashboard organizada com resumo calorico, distribuicao percentual dos macros e grafico de meta x consumido.
- Relatorios nutricionais exportaveis em PDF com metricas de consistencia e macronutrientes.
- Reorganizacao da interface em paginas especificas por funcao.
- Importacao da base TACO por script de conversao para uso nativo na busca de alimentos.
- Calculadora de taxa metabolica basal com persistencia local e atalho para meta calorica.
- Movimentacao de itens entre refeicoes.
- Edicao de itens lancados nas refeicoes.
- Repeticao das refeicoes anteriores.
- Persistencia em Firestore com escrita incremental por usuario.
- Cadastro em duas etapas com codigo de confirmacao por e-mail.
- Redefinicao de senha por e-mail.
- Atualizacao visual da pagina com layout mais moderno, responsivo e mobile-first.
- Correcao da inicializacao da data para respeitar o horario local.
- Ajuste da organizacao do MVC, removendo duplicacao indevida da camada de visualizacao.
- Correcao de problemas estruturais no HTML.
- Renderizacao mais segura da tabela, evitando insercao direta de HTML com dados do usuario.
- Estados vazios e desabilitacao de acoes quando nao ha alimentos cadastrados.

## Limitacoes atuais

- A base TACO ainda e estatica no frontend.
- O backend precisa de credencial Firebase Admin configurada no ambiente para ler/gravar Firestore.

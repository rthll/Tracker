# Plano de Migração Frontend — Vue 3 + Tailwind CSS + Motion

Stack atual: Vanilla JS (MVC manual) + Vite + Bootstrap 5 + CSS customizado (VibeUX)
Stack destino: Vue 3 + Pinia + Tailwind CSS + Motion

Vantagem central: Vite já é o build tool. Adicionar Vue 3 e Tailwind é só config — sem trocar de bundler.

---

## Princípio da migração

Vue 3 pode ser montado em qualquer elemento do DOM. Isso permite criar "ilhas" Vue dentro do HTML existente, uma página por vez, enquanto o código vanilla continua funcionando ao redor. Nenhuma quebra durante a transição.

---

## Fase 0 — Setup (nenhuma quebra, ~1h)

Instalar as dependências e configurar sem tocar em nada funcional:

```bash
# Vue 3 + plugin Vite
npm install vue @vitejs/plugin-vue

# Tailwind CSS
npm install -D tailwindcss @tailwindcss/vite

# Motion
npm install motion
```

`vite.config.js`: adicionar `vue()` ao array `plugins`.

`tailwind.config.js`: configurar tokens com os mesmos valores do VibeUX (`--primary: #1D6B57`, `--accent: #d9822b`, etc.) para que Tailwind e o CSS atual convivam sem conflito visual durante a transição.

`index.css`: adicionar `@tailwind base/components/utilities` no topo. Bootstrap e o CSS customizado continuam funcionando em paralelo.

**Resultado:** Vue e Tailwind disponíveis, app 100% intacto.

---

## Fase 1 — Estado centralizado com Pinia (~2–3h)

Antes de migrar qualquer UI, migrar o Model para Pinia. É refatoração interna — nenhuma tela muda.

```bash
npm install pinia
```

Criar uma store por domínio:

- `useTrackerStore` → `metasDiarias`, `refeicoesPorData`, `tmbPerfil`
- `useFoodStore` → `alimentosTaco`, `alimentosPersonalizados`, `favoritos`, `historicoAlimentos`
- `useAuthStore` → usuário autenticado, token

Cada store replica o estado de `window.Model` e mantém os mesmos métodos `salvar()` e `applyIncrementalChange()`, chamando `window.Api` e `window.TrackerDataService` diretamente (que continuam existindo). O `window.Model` passa a ser um proxy fino sobre as stores durante a transição.

---

## Fase 2 — Migrar páginas (uma por vez, da mais simples à mais complexa)

### Ordem sugerida

| Ordem | Página (`data-page`) | Complexidade |
|---|---|---|
| 1 | `metas` | Baixa — formulário simples |
| 2 | `calculadora` | Baixa — form + resultado |
| 3 | `alimentos` | Média — lista + CRUD |
| 4 | `relatorios` | Média — exibição de dados |
| 5 | `dashboard` | Alta — gráficos, anéis de macro |
| 6 | `refeicoes` | Alta — items, adicionar alimento |

### Processo para cada página

1. Criar `src/pages/PageNome.vue` (componente Vue com Tailwind)
2. No `index.html`, dentro da `<section data-page="nome">`, adicionar `<div id="app-nome"></div>`
3. Em `firebase.js` (já é módulo), após auth estar pronta:

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PageMetas from './pages/PageMetas.vue'

createApp(PageMetas).use(pinia).mount('#app-metas')
```

4. Remover do `view.js` as funções que renderizavam essa página
5. Remover do `controller.js` os event listeners correspondentes

Cada página migrada já pode usar Motion para animações de entrada, feedback de interação e transições internas.

---

## Fase 3 — Shell global (nav, auth, toast)

Com todas as páginas em Vue, migrar a estrutura que envolve tudo:

- **Top nav / Bottom nav mobile** → `AppNav.vue` com controle de página via store
- **Modal de autenticação** → `AuthModal.vue` (usa `useAuthStore`)
- **Sistema de toast** → composable `useToast()` com `<TransitionGroup>` + Motion para animação de entrada/saída

Neste ponto, `view.js` e `controller.js` estão praticamente vazios.

---

## Fase 4 — Limpeza

- Remover Bootstrap (substituído por Tailwind)
- Remover `view.js`, `controller.js`, `model.js`
- Remover regras do `index.css` que foram para Tailwind
- Transformar `index.html` em entrada limpa do Vue app
- Converter `window.Api` e `window.TrackerDataService` em composables (`useApi`, `useFirestore`)

`index.html` passa de 700+ linhas para ~20:

```html
<div id="app"></div>
<script type="module" src="/src/main.js"></script>
```

---

## Fase 5 — Animações com Motion

Com a base limpa, adicionar animações onde fazem sentido:

| Elemento | Animação sugerida |
|---|---|
| Troca de página | `animate()` com `opacity` + `translateY` no mount/unmount |
| Itens de refeição | `<AnimatePresence>` — entrada e saída suave ao adicionar/remover |
| Anéis de macro (dashboard) | Animação do `stroke-dashoffset` ao carregar os valores |
| Cards de resumo | Stagger de entrada (`delay` incremental por index) |
| Toast | Slide + fade com `<TransitionGroup>` |
| Botões de ação | `whileHover` / `whileTap` para micro-feedback |

---

## Critério de conclusão de cada fase

Só avançar para a próxima fase quando:

- O app está funcional e testável no estado atual
- Não há regressão nas páginas já migradas
- O PWA (`sw.js`, `manifest.json`) continua funcionando

---

## Tempo estimado

| Fase | Estimativa |
|---|---|
| 0 — Setup | ~1h |
| 1 — Pinia | ~2–3h |
| 2 — Páginas (6x) | ~20–30h total |
| 3 — Shell global | ~4–6h |
| 4 — Limpeza | ~3–4h |
| 5 — Animações | ~6–10h |
| **Total** | **~36–54h** |

Trabalhando aos poucos: 3–5 semanas. Em modo focado: ~1 semana.

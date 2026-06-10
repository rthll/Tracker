<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Refeições</span>
      <h2>Organização do dia</h2>
    </div>
    <button class="btn btn-outline-secondary btn-compact"
      :disabled="quantidadeOntem === 0"
      @click="repetirRefeicao"
      type="button">
      {{ quantidadeOntem > 0 ? `Repetir refeições anteriores (${quantidadeOntem})` : 'Adicionar refeição completa' }}
    </button>
  </div>

  <!-- Meal summary grid: reactive -->
  <section class="meal-summary-grid" aria-label="Resumo por refeicao">
    <article v-for="tipo in tiposComTotais" :key="tipo.id" class="meal-summary-card">
      <span class="meal-summary-name">{{ tipo.nome }}</span>
      <strong class="meal-summary-calories">{{ fmt(tipo.totais.calorias) }} kcal</strong>
      <span class="meal-summary-macros">C {{ fmt(tipo.totais.carboidratos) }}g | P {{ fmt(tipo.totais.proteinas) }}g | G {{ fmt(tipo.totais.gorduras) }}g</span>
      <span class="meal-summary-count">{{ tipo.itens.length }} {{ tipo.itens.length === 1 ? 'item' : 'itens' }}</span>
    </article>
  </section>

  <!-- Edit panel: fully reactive -->
  <section v-if="edicaoAberta" ref="editPanelRef" class="panel edit-record-panel" id="painelEdicaoRegistro">
    <div class="panel-heading panel-heading-table">
      <div>
        <span class="panel-kicker">Edição</span>
        <h2>Editar registro</h2>
      </div>
      <p>Atualize alimento, quantidade ou refeição mantendo os macros recalculados.</p>
    </div>
    <div class="form-grid">
      <div class="field-group span-12">
        <label for="editarBuscaAlimento" class="form-label">Alimento</label>
        <FoodSearchDropdown
          :food-search="editSearch"
          input-id="editarBuscaAlimento"
          ref="editSearchWrapperRef"
          @selecionar="editSearch.selecionar"
        />
        <div class="food-category-shortcuts">
          <button
            v-for="cat in editSearch.categorias"
            :key="cat.id"
            type="button"
            class="food-category-chip"
            @click="editSearch.buscarPorCategoria(cat.id)"
          >{{ cat.label }}</button>
        </div>
        <p class="field-hint">
          {{ editSearch.alimentoSelecionado.value
            ? `${editSearch.alimentoSelecionado.value.nome} — C ${fmt(editSearch.alimentoSelecionado.value.carboidratos)}g | P ${fmt(editSearch.alimentoSelecionado.value.proteinas)}g | G ${fmt(editSearch.alimentoSelecionado.value.gorduras)}g | ${fmt(editSearch.alimentoSelecionado.value.calorias)} kcal/100g`
            : 'Selecione um alimento cadastrado para salvar a edição.' }}
        </p>
      </div>
      <div class="field-group span-12 span-md-6">
        <label for="editarTipoRefeicao" class="form-label">Refeição</label>
        <AppSelect
          v-model="edicaoDestRef"
          :options="tiposRefeicao.map(t => ({ value: t.id, label: t.nome }))"
        />
      </div>
      <div class="field-group span-12 span-md-6">
        <label for="editarQuantidade" class="form-label">Quantidade (g)</label>
        <input
          type="number"
          id="editarQuantidade"
          ref="editQtdRef"
          v-model.number="edicaoQtd"
          class="form-control"
          placeholder="Ex.: 150"
          min="0.01"
          step="0.01"
          inputmode="decimal"
        >
      </div>
      <div class="field-group span-12 edit-actions-row">
        <button class="btn btn-primary" type="button" @click="salvarEdicao">Salvar alteração</button>
        <button class="btn btn-outline-secondary" type="button" @click="cancelarEdicao">Cancelar</button>
      </div>
    </div>
  </section>

  <!-- Meal table: reactive -->
  <section class="panel">
    <div class="panel-heading panel-heading-table">
      <div>
        <span class="panel-kicker">Acompanhamento</span>
        <h2>Refeições do dia</h2>
      </div>
      <p>Itens adicionados, totais nutricionais e movimentação entre refeições.</p>
    </div>

    <div>
      <p v-if="!tiposRefeicao.length" class="refeicao-empty">Nenhuma refeição cadastrada. Clique em "+ Nova refeição" para começar.</p>
      <TransitionGroup
        name="card-reorder"
        tag="div"
        ref="listaCardsRef"
        class="refeicao-card-list"
        :class="{ 'is-reordering': dragRefeicao.ativo }">
      <details v-for="tipo in tiposComTotais" :key="tipo.id" class="refeicao-card" :data-id="tipo.id" open
        :class="{ 'is-dragging': dragRefeicao.id === tipo.id }"
        :style="dragRefeicao.id === tipo.id ? { transform: `translateY(${dragRefeicao.dy}px)` } : null">
        <summary class="refeicao-card-header">
          <div class="refeicao-card-title">
            <button
              type="button"
              class="refeicao-drag-handle"
              :aria-label="`Reordenar refeição ${tipo.nome}. Use as setas para mover.`"
              @pointerdown="iniciarDragRefeicao($event, tipo.id)"
              @pointermove="moverDragRefeicao"
              @pointerup="soltarDragRefeicao"
              @pointercancel="soltarDragRefeicao"
              @keydown.up.prevent="moverTipoPorTeclado(tipo.id, -1)"
              @keydown.down.prevent="moverTipoPorTeclado(tipo.id, 1)"
              @click.stop.prevent>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="5" r="1.7"/><circle cx="15" cy="5" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="19" r="1.7"/><circle cx="15" cy="19" r="1.7"/></svg>
            </button>
            <span class="refeicao-card-name">{{ tipo.nome }}</span>
            <span class="refeicao-card-count">{{ tipo.itens.length }} {{ tipo.itens.length === 1 ? 'item' : 'itens' }}</span>
          </div>
          <div class="refeicao-card-meta">
            <span class="refeicao-card-kcal">{{ fmt(tipo.totais.calorias) }} kcal</span>
            <svg class="refeicao-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            <button type="button" class="refeicao-card-delete" :aria-label="`Excluir refeição ${tipo.nome}`" @click.stop="removerTipo(tipo.id)">&times;</button>
          </div>
        </summary>
        <div class="refeicao-card-body">
          <p v-if="!tipo.itens.length" class="refeicao-item-vazio">Nenhum alimento adicionado.</p>
          <template v-else>
            <TransitionGroup name="meal-item" tag="div">
            <div v-for="(item, index) in tipo.itens" :key="item.id || `${tipo.id}-${index}`" class="refeicao-item">
              <div class="refeicao-item-info">
                <span class="refeicao-item-name">{{ item.nome }}</span>
                <span class="refeicao-item-qty">{{ fmt(item.quantidade) }}g</span>
              </div>
              <div class="refeicao-item-macros">
                <span class="rmacro rmacro-c">C {{ fmt(item.carboidratos) }}g</span>
                <span class="rmacro rmacro-p">P {{ fmt(item.proteinas) }}g</span>
                <span class="rmacro rmacro-g">G {{ fmt(item.gorduras) }}g</span>
                <span class="rmacro rmacro-cal">{{ fmt(item.calorias) }} kcal</span>
              </div>
              <div class="refeicao-item-actions">
                <button type="button" class="editar-registro" :aria-label="`Editar ${item.nome}`" @click="iniciarEdicao(tipo.id, index)">Editar</button>
                <AppSelect
                  class="move-select"
                  :model-value="''"
                  :options="[{ value: '', label: 'Mover' }, ...tiposRefeicao.filter(t => t.id !== tipo.id).map(t => ({ value: t.id, label: t.nome }))]"
                  @update:model-value="destId => destId && moverItem(tipo.id, index, destId)"
                />
                <button type="button" class="remover" :aria-label="`Remover ${item.nome}`" @click="removerItem(tipo.id, index)">x</button>
              </div>
            </div>
            </TransitionGroup>
            <div class="refeicao-card-footer">
              <button type="button" class="btn-salvar-template" @click="salvarTemplate(tipo.id)">Salvar como refeição completa</button>
            </div>
          </template>
        </div>
      </details>
      </TransitionGroup>
      <button type="button" class="btn-add-refeicao" @click="adicionarTipo">+ Nova refeição</button>
    </div>

    <!-- Total bar: reactive -->
    <div class="refeicao-total-bar">
      <span class="refeicao-total-label">Total do dia</span>
      <div class="refeicao-total-macros">
        <span>C <strong>{{ fmt(totalDia.carboidratos) }}</strong>g</span>
        <span>P <strong>{{ fmt(totalDia.proteinas) }}</strong>g</span>
        <span>G <strong>{{ fmt(totalDia.gorduras) }}</strong>g</span>
        <span class="refeicao-total-cal"><strong>{{ fmt(totalDia.calorias) }}</strong>&nbsp;kcal</span>
      </div>
    </div>
  </section>

  <!-- Templates: fully reactive -->
  <section class="panel" id="secaoRefeicaoCompleta">
    <div class="panel-heading panel-heading-table">
      <div>
        <span class="panel-kicker">Templates</span>
        <h2>Refeições completas</h2>
      </div>
      <p>Grupos de alimentos pré-salvos para adicionar ao seu dia com um toque.</p>
    </div>

    <!-- Template list -->
    <div>
      <p v-if="!templatesRefeicao.length" class="template-selection-empty">Nenhuma refeição completa salva ainda.</p>
      <div v-for="tpl in templatesRefeicao" :key="tpl.id" class="template-card">
        <div class="template-card-info">
          <span class="template-card-nome">{{ tpl.nome }}</span>
          <span class="template-card-meta">{{ tpl.itens?.length || 0 }} itens</span>
        </div>
        <div class="template-card-actions">
          <AppSelect
            :model-value="tplDestinos[tpl.id] || ''"
            @update:model-value="v => (tplDestinos[tpl.id] = v)"
            :options="[{ value: '', label: 'Aplicar em...' }, ...tiposRefeicao.map(t => ({ value: t.id, label: t.nome }))]"
          />
          <button
            type="button"
            class="btn-template-aplicar"
            @click="aplicarTemplate(tpl)"
          >Aplicar</button>
          <button
            type="button"
            class="btn-template-excluir"
            @click="excluirTemplate(tpl.id)"
          >&times;</button>
        </div>
      </div>
    </div>

    <!-- Template creation form -->
    <div v-if="tplFormAberto" class="refeicao-completa-form-header" style="margin-top:1rem;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
        <span class="refeicao-completa-form-titulo">Nova refeição completa</span>
        <button type="button" class="btn-ghost-sm" aria-label="Fechar formulário" @click="fecharTplForm">&times;</button>
      </div>
      <div class="form-grid refeicao-completa-form-grid">
        <div class="field-group span-12">
          <label class="form-label">Nome da refeição completa</label>
          <input type="text" v-model="tplNome" class="form-control" placeholder="Ex.: Café da manhã habitual">
        </div>
        <div class="field-group span-12">
          <label class="form-label">Buscar alimento</label>
          <div class="food-search-wrapper" ref="tplSearchWrapperRef">
            <input
              type="text"
              class="form-control"
              autocomplete="off"
              placeholder="Digite para buscar um alimento"
              :value="tplSearch.termo.value"
              @input="e => tplSearch.buscar(e.target.value)"
            >
            <div v-if="tplSearch.painelAberto.value" class="food-search-panel">
              <div
                v-for="alimento in tplSearch.resultados.value"
                :key="alimento.id"
                class="food-search-option"
                @mousedown.prevent="tplSearch.selecionar(alimento)"
              >
                <div class="food-search-option-top">
                  <span class="food-search-option-name">{{ alimento.nome }}</span>
                  <span :class="alimento.personalizado ? 'food-origin-badge personal' : 'food-origin-badge taco'">
                    {{ alimento.personalizado ? 'Personal' : 'TACO' }}
                  </span>
                </div>
                <span class="food-search-option-macros">
                  C {{ fmt(alimento.carboidratos) }}g | P {{ fmt(alimento.proteinas) }}g | G {{ fmt(alimento.gorduras) }}g | {{ fmt(alimento.calorias) }} kcal/100g
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="field-group span-8 span-md-6">
          <label class="form-label">Quantidade (g)</label>
          <input type="number" v-model.number="tplQtd" class="form-control" placeholder="Ex.: 150" min="0.01" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group span-4 span-md-6 field-group-end">
          <button class="btn btn-outline-secondary w-100" type="button" @click="adicionarItemTpl">Adicionar</button>
        </div>
        <div class="field-group span-12">
          <div class="nova-refeicao-itens">
            <p v-if="!tplItens.length" class="nova-refeicao-empty">Nenhum alimento adicionado ainda.</p>
            <div v-for="(item, idx) in tplItens" :key="idx" class="nova-refeicao-item">
              <span class="nova-refeicao-item-nome">{{ item.nome }}</span>
              <span class="nova-refeicao-item-qty">{{ fmt(item.quantidade) }}g</span>
              <button type="button" class="nova-refeicao-item-remove" @click="tplItens.splice(idx, 1)">&times;</button>
            </div>
          </div>
        </div>
        <div class="field-group span-12 edit-actions-row">
          <button class="btn btn-primary" type="button" @click="salvarTplForm">Salvar refeição completa</button>
          <button class="btn btn-outline-secondary" type="button" @click="fecharTplForm">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="refeicao-completa-footer">
      <button class="btn btn-outline-secondary btn-compact" type="button" @click="abrirTplForm">+ Criar nova refeição completa</button>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useTrackerStore } from '../stores/tracker.js'
import { useUIStore } from '../stores/ui.js'
import { useFoodStore } from '../stores/food.js'
import { useFoodSearch } from '../composables/useFoodSearch.js'
import AppSelect from '../components/AppSelect.vue'
import FoodSearchDropdown from '../components/FoodSearchDropdown.vue'

const trackerStore = useTrackerStore()
const uiStore      = useUIStore()
const foodStore    = useFoodStore()

// ── Food search instances ──────────────────────────────────────────────────────
const editSearch = useFoodSearch()
const tplSearch  = useFoodSearch()

// ── Edit panel state ───────────────────────────────────────────────────────────
const edicaoAberta   = ref(false)
const edicaoOrigRef  = ref('')      // meal type id (origin)
const edicaoIndex    = ref(-1)
const edicaoDestRef  = ref('')      // meal type id (destination — may differ)
const edicaoQtd      = ref(0)
const editPanelRef        = ref(null)
const editSearchWrapperRef = ref(null)
const editQtdRef          = ref(null)

// ── Templates state ────────────────────────────────────────────────────────────
const tplFormAberto      = ref(false)
const tplNome            = ref('')
const tplQtd             = ref(0)
const tplItens           = ref([])
const tplDestinos        = reactive({})
const tplSearchWrapperRef = ref(null)

// ── Computed ───────────────────────────────────────────────────────────────────
const tiposRefeicao   = computed(() => trackerStore.tiposRefeicao)
const templatesRefeicao = computed(() => trackerStore.templatesRefeicao)

const refeicoesDoDia = computed(() =>
  trackerStore.refeicoesPorData[trackerStore.dataAtual] || {}
)

const tiposComTotais = computed(() =>
  tiposRefeicao.value.map(tipo => {
    const itens = refeicoesDoDia.value[tipo.id] || []
    const totais = itens.reduce((acc, item) => {
      acc.carboidratos += Number(item.carboidratos) || 0
      acc.proteinas    += Number(item.proteinas)    || 0
      acc.gorduras     += Number(item.gorduras)     || 0
      acc.calorias     += Number(item.calorias)     || 0
      return acc
    }, { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
    return { ...tipo, itens, totais }
  })
)

const totalDia = computed(() =>
  tiposComTotais.value.reduce((acc, tipo) => {
    acc.carboidratos += tipo.totais.carboidratos
    acc.proteinas    += tipo.totais.proteinas
    acc.gorduras     += tipo.totais.gorduras
    acc.calorias     += tipo.totais.calorias
    return acc
  }, { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
)

const quantidadeOntem = computed(() => {
  const data = trackerStore.dataAtual
  if (!data) return 0
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  d.setDate(d.getDate() - 1)
  const ontem = d.toISOString().split('T')[0]
  const refOntem = trackerStore.refeicoesPorData[ontem] || {}
  return Object.values(refOntem).flat().length
})

function fmt(v) { return String(Math.round(Number(v) || 0)) }

// ── Meal operations ────────────────────────────────────────────────────────────

function iniciarEdicao(refeicaoId, index) {
  const item = trackerStore.getItemRefeicao(trackerStore.dataAtual, refeicaoId, index)
  if (!item) return
  edicaoOrigRef.value = refeicaoId
  edicaoIndex.value   = index
  edicaoDestRef.value = refeicaoId
  edicaoQtd.value     = item.quantidade
  edicaoAberta.value  = true
  // Pre-fill food search
  if (item.alimentoId) {
    const alimento = foodStore.getAlimentoPorId(item.alimentoId)
    if (alimento) {
      editSearch.selecionar(alimento)
    } else {
      editSearch.buscar(item.nome, true)
    }
  } else {
    editSearch.buscar(item.nome, true)
  }
  nextTick(() => {
    if (editPanelRef.value) {
      editPanelRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (editQtdRef.value) editQtdRef.value.focus()
  })
}

function salvarEdicao() {
  const alimento = editSearch.alimentoSelecionado.value
  if (!alimento) {
    uiStore.mostrarToast('Selecione um alimento antes de salvar.', 'error')
    return
  }
  if (!edicaoQtd.value || edicaoQtd.value <= 0) {
    uiStore.mostrarToast('Informe uma quantidade válida.', 'error')
    return
  }
  const f = edicaoQtd.value / 100
  const itemAtualizado = {
    id:           trackerStore.getItemRefeicao(trackerStore.dataAtual, edicaoOrigRef.value, edicaoIndex.value)?.id,
    alimentoId:   alimento.id,
    nome:         alimento.nome,
    quantidade:   edicaoQtd.value,
    carboidratos: alimento.carboidratos * f,
    proteinas:    alimento.proteinas    * f,
    gorduras:     alimento.gorduras     * f,
    calorias:     alimento.calorias     * f,
  }
  trackerStore.atualizarItemRefeicao(
    trackerStore.dataAtual,
    edicaoOrigRef.value,
    edicaoIndex.value,
    edicaoDestRef.value,
    itemAtualizado
  )
  trackerStore.registrarHistoricoAlimento(alimento.id, false)
  uiStore.mostrarToast('Registro atualizado.', 'success')
  cancelarEdicao()
}

function cancelarEdicao() {
  edicaoAberta.value  = false
  edicaoOrigRef.value = ''
  edicaoIndex.value   = -1
  edicaoDestRef.value = ''
  edicaoQtd.value     = 0
  editSearch.limpar()
}

function moverItem(refeicaoId, index, destId) {
  if (destId) trackerStore.moverItem(trackerStore.dataAtual, refeicaoId, index, destId)
}

function removerItem(refeicaoId, index) {
  trackerStore.removerItem(trackerStore.dataAtual, refeicaoId, index)
}

function removerTipo(id) {
  if (!confirm('Excluir esta refeição e todos os seus itens do dia?')) return
  trackerStore.removerTipoRefeicao(id)
}

// ── Reordenação de refeições (arrastar e soltar) ───────────────────────────────
// Drag via pointer events no handle: o card arrastado segue o ponteiro com
// translateY; os demais reordenam ao vivo quando o centro do card cruza o
// ponto médio de um vizinho. Coordenadas via pageY/offsetTop (documento),
// imunes aos transforms transitórios do TransitionGroup.

const listaCardsRef = ref(null)
const dragRefeicao  = reactive({ ativo: false, id: null, dy: 0, startY: 0, ultimoY: 0, ordemInicial: '' })
let reordenandoCards = false

function cardEl(id) {
  const lista = listaCardsRef.value?.$el
  return lista ? lista.querySelector(`.refeicao-card[data-id="${CSS.escape(id)}"]`) : null
}

function ordemAtualIds() {
  return tiposRefeicao.value.map(t => t.id)
}

function iniciarDragRefeicao(e, tipoId) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  e.preventDefault()
  e.currentTarget.setPointerCapture(e.pointerId)
  dragRefeicao.ativo        = true
  dragRefeicao.id           = tipoId
  dragRefeicao.startY       = e.pageY
  dragRefeicao.ultimoY      = e.pageY
  dragRefeicao.dy           = 0
  dragRefeicao.ordemInicial = ordemAtualIds().join('|')
}

async function moverDragRefeicao(e) {
  if (!dragRefeicao.ativo) return
  dragRefeicao.ultimoY = e.pageY
  dragRefeicao.dy      = e.pageY - dragRefeicao.startY
  if (reordenandoCards) return

  const el = cardEl(dragRefeicao.id)
  if (!el) return
  const tipos  = trackerStore.tiposRefeicao
  const idx    = tipos.findIndex(t => t.id === dragRefeicao.id)
  const centro = el.offsetTop + dragRefeicao.dy + el.offsetHeight / 2
  const outros = tipos.filter(t => t.id !== dragRefeicao.id).map(t => cardEl(t.id)).filter(Boolean)
  const novoIdx = outros.filter(o => centro > o.offsetTop + o.offsetHeight / 2).length
  if (novoIdx === idx || idx < 0) return

  reordenandoCards = true
  const offsetAntes = el.offsetTop
  const [movido] = tipos.splice(idx, 1)
  tipos.splice(novoIdx, 0, movido)
  await nextTick()
  // Compensa o deslocamento natural do card no novo slot para o arrasto seguir contínuo
  dragRefeicao.startY += el.offsetTop - offsetAntes
  dragRefeicao.dy      = dragRefeicao.ultimoY - dragRefeicao.startY
  reordenandoCards = false
}

function soltarDragRefeicao() {
  if (!dragRefeicao.ativo) return
  const mudou = ordemAtualIds().join('|') !== dragRefeicao.ordemInicial
  dragRefeicao.ativo = false
  dragRefeicao.id    = null
  dragRefeicao.dy    = 0
  if (mudou) trackerStore.reordenarTiposRefeicao(ordemAtualIds())
}

function moverTipoPorTeclado(tipoId, delta) {
  const ids = ordemAtualIds()
  const idx = ids.indexOf(tipoId)
  const novoIdx = idx + delta
  if (idx < 0 || novoIdx < 0 || novoIdx >= ids.length) return
  ids.splice(idx, 1)
  ids.splice(novoIdx, 0, tipoId)
  trackerStore.reordenarTiposRefeicao(ids)
}

function adicionarTipo() {
  const nome = prompt('Nome da nova refeição:')
  if (nome && nome.trim()) trackerStore.adicionarTipoRefeicao(nome.trim())
}

function salvarTemplate(refeicaoId) {
  const itens = refeicoesDoDia.value[refeicaoId] || []
  if (!itens.length) {
    uiStore.mostrarToast('Adicione alimentos à refeição antes de salvar como template.', 'error')
    return
  }
  const tipo = tiposRefeicao.value.find(t => t.id === refeicaoId)
  const nomeDefault = tipo ? tipo.nome : 'Refeição completa'
  const nome = prompt('Nome do template:', nomeDefault)
  if (!nome || !nome.trim()) return
  const template = {
    id:    `tpl:${Date.now()}`,
    nome:  nome.trim(),
    itens: itens.map(i => ({ ...i })),
  }
  trackerStore.adicionarTemplate(template)
  uiStore.mostrarToast('Template salvo com sucesso.', 'success')
}

function repetirRefeicao() {
  const data = trackerStore.dataAtual
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  d.setDate(d.getDate() - 1)
  const ontem = d.toISOString().split('T')[0]
  trackerStore.repetirRefeicao(ontem, data)
}

// ── Template operations ────────────────────────────────────────────────────────

function abrirTplForm() {
  tplFormAberto.value = true
  tplNome.value = ''
  tplQtd.value = 0
  tplItens.value = []
  tplSearch.limpar()
}

function fecharTplForm() {
  tplFormAberto.value = false
  tplSearch.limpar()
}

function adicionarItemTpl() {
  const alimento = tplSearch.alimentoSelecionado.value
  if (!alimento) { uiStore.mostrarToast('Selecione um alimento.', 'error'); return }
  if (!tplQtd.value || tplQtd.value <= 0) { uiStore.mostrarToast('Informe a quantidade.', 'error'); return }
  const f = tplQtd.value / 100
  tplItens.value.push({
    id:           `tpl-item:${Date.now()}`,
    alimentoId:   alimento.id,
    nome:         alimento.nome,
    quantidade:   tplQtd.value,
    carboidratos: alimento.carboidratos * f,
    proteinas:    alimento.proteinas    * f,
    gorduras:     alimento.gorduras     * f,
    calorias:     alimento.calorias     * f,
  })
  tplSearch.limpar()
  tplQtd.value = 0
}

function salvarTplForm() {
  if (!tplNome.value.trim()) { uiStore.mostrarToast('Informe o nome do template.', 'error'); return }
  if (!tplItens.value.length) { uiStore.mostrarToast('Adicione pelo menos um alimento.', 'error'); return }
  const template = {
    id:    `tpl:${Date.now()}`,
    nome:  tplNome.value.trim(),
    itens: [...tplItens.value],
  }
  trackerStore.adicionarTemplate(template)
  uiStore.mostrarToast('Refeição completa salva.', 'success')
  fecharTplForm()
}

function aplicarTemplate(tpl) {
  const refeicaoId = tplDestinos[tpl.id]
  if (!refeicaoId) { uiStore.mostrarToast('Selecione a refeição de destino.', 'error'); return }
  trackerStore.aplicarTemplateNoDia(tpl.itens, refeicaoId, trackerStore.dataAtual)
  uiStore.mostrarToast(`Template "${tpl.nome}" aplicado.`, 'success')
  tplDestinos[tpl.id] = ''
}

function excluirTemplate(id) {
  if (!confirm('Excluir este template?')) return
  trackerStore.removerTemplate(id)
}
</script>

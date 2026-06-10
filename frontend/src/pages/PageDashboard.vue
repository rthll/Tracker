<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Dashboard</span>
      <h2>Uso diário</h2>
    </div>
    <p>Resumo do dia e registro rápido de alimento em uma refeição.</p>
  </div>

  <section class="daily-layout">
    <!-- Quick-add panel: fully reactive -->
    <article class="panel quick-add-panel">
      <div class="panel-heading">
        <div>
          <span class="panel-kicker">Registro</span>
          <h2>Adicionar alimento</h2>
        </div>
      </div>
      <div class="form-grid">
        <div class="field-group span-12">
          <label for="buscaAlimento" class="form-label">Buscar alimento</label>
          <FoodSearchDropdown
            :food-search="foodSearch"
            input-id="buscaAlimento"
            ref="searchWrapperRef"
            @selecionar="selecionarAlimento"
          >
            <template #after-input>
              <button
                class="favorite-toggle"
                id="btnFavoritar"
                type="button"
                aria-label="Favoritar alimento selecionado"
                title="Favoritar alimento"
                :class="{ 'is-favorito': isFavorito }"
                @click="alternarFavorito"
              >{{ isFavorito ? '&#9733;' : '&#9734;' }}</button>
            </template>
          </FoodSearchDropdown>
          <div class="food-category-shortcuts">
            <button
              v-for="cat in foodSearch.categorias"
              :key="cat.id"
              type="button"
              class="food-category-chip"
              @click="foodSearch.buscarPorCategoria(cat.id)"
            >{{ cat.label }}</button>
          </div>
          <p class="field-hint" id="detalheAlimentoSelecionado">
            {{ foodSearch.alimentoSelecionado.value
              ? `${foodSearch.alimentoSelecionado.value.nome} — C ${fmt(foodSearch.alimentoSelecionado.value.carboidratos)}g | P ${fmt(foodSearch.alimentoSelecionado.value.proteinas)}g | G ${fmt(foodSearch.alimentoSelecionado.value.gorduras)}g | ${fmt(foodSearch.alimentoSelecionado.value.calorias)} kcal/100g`
              : 'Selecione um alimento cadastrado para adicionar à refeição.' }}
          </p>
        </div>
        <div class="field-group span-12 span-md-6">
          <label for="tipoRefeicao" class="form-label">Refeição</label>
          <AppSelect
            v-model="refeicaoSelecionada"
            :options="tiposRefeicao.map(t => ({ value: t.id, label: t.nome }))"
          />
        </div>
        <div class="field-group span-12 span-md-6">
          <label for="quantidade" class="form-label">Quantidade (g)</label>
          <input
            type="number"
            id="quantidade"
            ref="qtdRef"
            v-model.number="quantidade"
            class="form-control"
            placeholder="Ex.: 150"
            min="0.01"
            step="0.01"
            inputmode="decimal"
          >
        </div>
        <div class="field-group span-12 align-end">
          <button class="btn btn-accent w-100" id="btnAdicionar" type="button" @click="adicionarRefeicao">Adicionar à refeição</button>
        </div>
        <div class="field-group span-12 shortcuts-grid">
          <div class="quick-block">
            <div class="quick-block-heading"><h3>Favoritos</h3></div>
            <div class="chip-list">
              <span v-if="!alimentosFavoritos.length" class="chip-empty">Nenhum favorito.</span>
              <button
                v-for="alimento in alimentosFavoritos"
                :key="alimento.id"
                type="button"
                class="food-chip"
                @click="selecionarAlimento(alimento)"
              >
                <span class="food-chip-name">{{ alimento.nome }}</span>
                <span class="food-chip-macros">{{ fmt(alimento.calorias) }} kcal/100g</span>
              </button>
            </div>
          </div>
          <div class="quick-block">
            <div class="quick-block-heading"><h3>Recentes</h3></div>
            <div class="chip-list">
              <span v-if="!alimentosHistorico.length" class="chip-empty">Nenhum registro recente.</span>
              <button
                v-for="alimento in alimentosHistorico"
                :key="alimento.id"
                type="button"
                class="food-chip"
                @click="selecionarAlimento(alimento)"
              >
                <span class="food-chip-name">{{ alimento.nome }}</span>
                <span class="food-chip-macros">{{ fmt(alimento.calorias) }} kcal/100g</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>

    <div class="dashboard-stack">
      <!-- Macro rings: fully reactive -->
      <section class="macro-ring-grid" aria-label="Resumo nutricional do dia">
        <article v-for="m in rings" :key="m.chave" class="macro-ring-card" :class="m.cardClasse">
          <div class="macro-ring-wrap">
            <svg class="macro-ring-svg" viewBox="0 0 72 72" aria-hidden="true">
              <circle class="macro-ring-track" cx="36" cy="36" r="28"/>
              <circle class="macro-ring-fill" :class="[m.fillClasse, { 'ring-over': metasDiarias[m.chave] > 0 && animatedTotais[m.chave] > metasDiarias[m.chave] * 1.1 }]"
                cx="36" cy="36" r="28"
                :style="ringAnimReady ? { strokeDashoffset: circunf * (1 - ringPct(animatedTotais[m.chave], metasDiarias[m.chave])) } : {}"/>
            </svg>
            <div class="macro-ring-center"><span>{{ fmt(totais[m.chave]) }}</span><small>{{ m.unidade }}</small></div>
          </div>
          <span class="macro-ring-label">{{ m.nome }}</span>
          <span class="macro-ring-meta"
            :class="{ 'ring-meta--over': metasDiarias[m.chave] > 0 && totais[m.chave] > metasDiarias[m.chave] * 1.1, 'ring-meta--done': metasDiarias[m.chave] > 0 && totais[m.chave] >= metasDiarias[m.chave] }">
            {{ metasDiarias[m.chave] > 0 ? `meta: ${fmt(metasDiarias[m.chave])} ${m.unidade}` : 'sem meta' }}
          </span>
        </article>
      </section>

      <!-- Dashboard panel: fully reactive -->
      <section class="dashboard-panel" aria-label="Dashboard nutricional do dia">
        <div class="panel-heading dashboard-heading">
          <div>
            <span class="panel-kicker">Visão do dia</span>
            <h2>Progresso</h2>
          </div>
          <p>{{ statusCalorias }}</p>
        </div>

        <div class="dashboard-grid">
          <article class="dashboard-metric dashboard-metric-main">
            <span class="dashboard-label">Calorias consumidas</span>
            <div class="dashboard-main-value"><span>{{ fmt(totais.calorias) }}</span><small>kcal</small></div>
            <div class="dashboard-meta-row">
              <span>Meta: {{ fmt(metasDiarias.calorias) }} kcal</span>
              <strong>{{ textoCaloriasRestantes }}</strong>
            </div>
          </article>

          <article class="dashboard-metric">
            <span class="dashboard-label">Distribuição dos macros</span>
            <div class="macro-stack" aria-hidden="true">
              <span class="macro-stack-segment macro-carbs" :style="{ width: dist.carboidratos + '%' }"></span>
              <span class="macro-stack-segment macro-protein" :style="{ width: dist.proteinas + '%' }"></span>
              <span class="macro-stack-segment macro-fat" :style="{ width: dist.gorduras + '%' }"></span>
            </div>
            <div class="macro-distribution-list">
              <div><span>Carboidratos</span><strong>{{ fmt(dist.carboidratos) }}%</strong></div>
              <div><span>Proteínas</span><strong>{{ fmt(dist.proteinas) }}%</strong></div>
              <div><span>Gorduras</span><strong>{{ fmt(dist.gorduras) }}%</strong></div>
            </div>
          </article>
        </div>

        <div class="dashboard-chart-panel">
          <div class="dashboard-chart-heading">
            <span class="dashboard-label">Meta x consumido</span>
            <strong>{{ aderenciaTexto }}</strong>
          </div>
          <div class="macro-target-chart">
            <AppMacroBar
              v-for="m in chartItems" :key="m.chave"
              :value="totais[m.chave]"
              :target="metasDiarias[m.chave]"
              :color="m.color"
              :label="m.nome"
              :unit="m.unidade"
              :pct="chartPct(m)"
            />
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useTrackerStore } from '../stores/tracker.js'
import { useFoodStore } from '../stores/food.js'
import { useUIStore } from '../stores/ui.js'
import { useFoodSearch } from '../composables/useFoodSearch.js'
import AppSelect from '../components/AppSelect.vue'
import AppMacroBar from '../components/AppMacroBar.vue'
import FoodSearchDropdown from '../components/FoodSearchDropdown.vue'

const trackerStore = useTrackerStore()
const foodStore    = useFoodStore()
const uiStore      = useUIStore()
const foodSearch   = useFoodSearch()

const circunf = 175.93

// ── Quick-add state ───────────────────────────────────────────────────────────
const refeicaoSelecionada = ref('')
const quantidade          = ref(0)
const searchWrapperRef    = ref(null)
const qtdRef              = ref(null)

// Init meal select default
watch(() => trackerStore.tiposRefeicao, (tipos) => {
  if (tipos.length && !refeicaoSelecionada.value) {
    refeicaoSelecionada.value = tipos[0].id
  }
}, { immediate: true })

// Watch preselectedFoodId from uiStore
watch(() => uiStore.preselectedFoodId, async (id) => {
  if (!id) return
  const alimento = foodStore.getAlimentoPorId(id)
  if (alimento) {
    foodSearch.selecionar(alimento)
    uiStore.preselectedFoodId = null
    await nextTick()
    if (qtdRef.value) qtdRef.value.focus()
  }
})

// Fechar ao clicar fora fica a cargo do próprio FoodSearchDropdown

const ringAnimReady  = ref(false)
const animatedTotais = ref({ carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })

onMounted(() => {
  nextTick(() => {
    animatedTotais.value = { ...totais.value }
    ringAnimReady.value = true
  })
})

// ── Computeds ─────────────────────────────────────────────────────────────────
const tiposRefeicao     = computed(() => trackerStore.tiposRefeicao)
const metasDiarias      = computed(() => trackerStore.metasDiarias)
const alimentosFavoritos = computed(() => foodStore.alimentosFavoritos)
const alimentosHistorico = computed(() => foodStore.alimentosHistorico)

const isFavorito = computed(() => {
  const id = foodSearch.alimentoSelecionadoId.value
  return id ? foodStore.favoritos.includes(id) : false
})

const totais = computed(() => {
  const dia = trackerStore.refeicoesPorData[trackerStore.dataAtual] || {}
  return Object.values(dia).flat().reduce((acc, item) => {
    acc.carboidratos += Number(item.carboidratos) || 0
    acc.proteinas    += Number(item.proteinas)    || 0
    acc.gorduras     += Number(item.gorduras)     || 0
    acc.calorias     += Number(item.calorias)     || 0
    return acc
  }, { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
})

watch(totais, (v) => { animatedTotais.value = { ...v } })

const rings = [
  { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g',    fillClasse: 'ring-carbs',     cardClasse: '' },
  { chave: 'proteinas',    nome: 'Proteínas',    unidade: 'g',    fillClasse: 'ring-protein',   cardClasse: '' },
  { chave: 'gorduras',     nome: 'Gorduras',     unidade: 'g',    fillClasse: 'ring-fat',       cardClasse: '' },
  { chave: 'calorias',     nome: 'Calorias',     unidade: 'kcal', fillClasse: 'ring-calories',  cardClasse: 'macro-ring-card--calories' },
]

const chartItems = [
  { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g',    barClasse: 'macro-carbs',    color: '#2563eb' },
  { chave: 'proteinas',    nome: 'Proteínas',    unidade: 'g',    barClasse: 'macro-protein',  color: 'var(--primary)' },
  { chave: 'gorduras',     nome: 'Gorduras',     unidade: 'g',    barClasse: 'macro-fat',      color: '#b76617' },
  { chave: 'calorias',     nome: 'Calorias',     unidade: 'kcal', barClasse: 'macro-calories', color: 'var(--accent)' },
]

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function ringPct(consumido, meta) {
  if (!meta) return 0
  return Math.min(consumido / meta, 1)
}

const dist = computed(() => {
  const t = totais.value
  const cals = { c: t.carboidratos * 4, p: t.proteinas * 4, g: t.gorduras * 9 }
  const total = cals.c + cals.p + cals.g
  return total > 0
    ? { carboidratos: (cals.c / total) * 100, proteinas: (cals.p / total) * 100, gorduras: (cals.g / total) * 100 }
    : { carboidratos: 0, proteinas: 0, gorduras: 0 }
})

const statusCalorias = computed(() => {
  const c = totais.value.calorias, m = metasDiarias.value.calorias
  if (!m) return c > 0 ? 'Consumo registrado. Defina metas para comparar o desempenho do dia.' : 'Defina metas e registre alimentos para acompanhar o progresso.'
  const r = m - c
  return r >= 0
    ? `Dia dentro da meta calórica: ${fmt((c / m) * 100)}% consumido.`
    : `Meta calórica excedida em ${fmt(Math.abs(r))} kcal.`
})

const textoCaloriasRestantes = computed(() => {
  const c = totais.value.calorias, m = metasDiarias.value.calorias
  if (!m) return 'Meta não definida'
  const r = m - c
  return r >= 0 ? `${fmt(r)} kcal restantes` : `${fmt(Math.abs(r))} kcal acima`
})

const aderenciaTexto = computed(() => {
  const pcts = chartItems
    .filter(m => metasDiarias.value[m.chave] > 0)
    .map(m => Math.min((totais.value[m.chave] / metasDiarias.value[m.chave]) * 100, 100))
  if (!pcts.length) return 'Metas não definidas'
  return `${fmt(pcts.reduce((a, b) => a + b, 0) / pcts.length)}% de aderência média`
})

function chartPct(m) {
  const meta = metasDiarias.value[m.chave]
  if (!meta) return 0
  return (totais.value[m.chave] / meta) * 100
}

// ── Quick-add actions ─────────────────────────────────────────────────────────

function selecionarAlimento(alimento) {
  foodSearch.selecionar(alimento)
  nextTick(() => {
    if (qtdRef.value) qtdRef.value.focus()
  })
}

function alternarFavorito() {
  const id = foodSearch.alimentoSelecionadoId.value
  if (!id) return
  trackerStore.alternarFavorito(id)
}

function adicionarRefeicao() {
  const alimento = foodSearch.alimentoSelecionado.value
  if (!alimento) { uiStore.mostrarToast('Selecione um alimento.', 'error'); return }
  if (!quantidade.value || quantidade.value <= 0) { uiStore.mostrarToast('Informe uma quantidade válida.', 'error'); return }
  if (!refeicaoSelecionada.value) { uiStore.mostrarToast('Selecione uma refeição.', 'error'); return }

  const item = trackerStore.criarItemRefeicao(alimento, quantidade.value)
  trackerStore.adicionarRefeicao(trackerStore.dataAtual, refeicaoSelecionada.value, item)
  trackerStore.registrarHistoricoAlimento(alimento.id)

  uiStore.mostrarToast(`${alimento.nome} adicionado.`, 'success')
  foodSearch.limpar()
  quantidade.value = 0
}
</script>

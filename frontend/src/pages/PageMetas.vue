<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Metas</span>
      <h2>Calorias e macronutrientes</h2>
    </div>
    <p>Defina os objetivos diários usados nos gráficos e barras de progresso.</p>
  </div>

  <section class="goals-panel" aria-label="Metas diarias">
    <div class="panel-heading goals-heading">
      <div>
        <span class="panel-kicker">Configuração</span>
        <h2>Metas diárias</h2>
      </div>
      <button class="btn btn-primary btn-compact" @click="salvar" type="button">Salvar metas</button>
    </div>

    <div class="goals-form">
      <div class="field-group">
        <label class="form-label">Carboidratos (g)</label>
        <input type="number" v-model.number="form.carboidratos" class="form-control" placeholder="0" min="0" step="0.01" inputmode="decimal">
      </div>
      <div class="field-group">
        <label class="form-label">Proteínas (g)</label>
        <input type="number" v-model.number="form.proteinas" class="form-control" placeholder="0" min="0" step="0.01" inputmode="decimal">
      </div>
      <div class="field-group">
        <label class="form-label">Gorduras (g)</label>
        <input type="number" v-model.number="form.gorduras" class="form-control" placeholder="0" min="0" step="0.01" inputmode="decimal">
      </div>
      <div class="field-group">
        <label class="form-label">Calorias (kcal)</label>
        <input type="number" v-model.number="form.calorias" class="form-control" placeholder="0" min="0" step="0.01" inputmode="decimal">
      </div>
    </div>

    <div class="goal-progress-grid">
      <article v-for="m in macros" :key="m.chave" class="goal-progress-card">
        <AppMacroBar
          :value="totais[m.chave]"
          :target="metas[m.chave]"
          :color="m.color"
          :label="m.nome"
          :unit="m.unidade"
          :pct="pct(totais[m.chave], metas[m.chave])"
        />
        <span class="goal-progress-detail">{{ detalhe(totais[m.chave], metas[m.chave], m.unidade) }}</span>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTrackerStore } from '../stores/tracker.js'
import { useUIStore } from '../stores/ui.js'
import AppMacroBar from '../components/AppMacroBar.vue'

const trackerStore = useTrackerStore()
const uiStore      = useUIStore()

const form = ref({ carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })

watch(() => trackerStore.metasDiarias, (m) => { form.value = { ...m } }, { immediate: true })

const metas = computed(() => trackerStore.metasDiarias)

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

const macros = [
  { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g',    color: '#2563eb'        },
  { chave: 'proteinas',    nome: 'Proteínas',    unidade: 'g',    color: 'var(--primary)' },
  { chave: 'gorduras',     nome: 'Gorduras',     unidade: 'g',    color: '#b76617'        },
  { chave: 'calorias',     nome: 'Calorias',     unidade: 'kcal', color: 'var(--accent)'  },
]

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function pct(consumido, meta) {
  if (!meta) return 0
  return Math.round((consumido / meta) * 100)
}

function detalhe(consumido, meta, unidade) {
  if (!meta) return 'Meta não definida'
  const restante = meta - consumido
  return restante >= 0
    ? `Faltam ${fmt(restante)} ${unidade}`
    : `Excedeu ${fmt(Math.abs(restante))} ${unidade}`
}

function salvar() {
  const metas = { ...form.value }
  if (Object.values(metas).some(v => isNaN(v) || v < 0)) {
    uiStore.mostrarToast('Informe metas maiores ou iguais a zero.', 'error')
    return
  }
  trackerStore.atualizarMetasDiarias(metas)
  uiStore.mostrarToast('Metas salvas com sucesso.', 'success')
}
</script>

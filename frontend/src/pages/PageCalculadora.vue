<template>
  <div class="page-heading">
    <div>
      <span class="panel-kicker">Calculadora</span>
      <h2>Taxa metabólica basal</h2>
    </div>
    <p>Calcule a TMB pela equação da sua preferência e receba a distribuição de macronutrientes correspondente.</p>
  </div>

  <section class="bmr-panel" aria-label="Calculadora de taxa metabolica basal">
    <div class="panel-heading bmr-heading">
      <div>
        <span class="panel-kicker">Método</span>
        <h2>{{ nomeEquacao }}</h2>
      </div>
      <span class="bmr-method">TMB estimada</span>
    </div>

    <div class="bmr-grid">
      <div class="bmr-form">
        <div class="field-group">
          <label class="form-label">Sexo</label>
          <AppSelect v-model="form.sexo" placeholder="Selecione" :options="[
            { value: 'masculino', label: 'Masculino' },
            { value: 'feminino',  label: 'Feminino'  },
          ]" />
        </div>
        <div class="field-group">
          <label class="form-label">Peso (kg)</label>
          <input type="number" v-model.number="form.peso" class="form-control" placeholder="Ex.: 78" min="1" step="0.01" inputmode="decimal">
        </div>
        <div class="field-group">
          <label class="form-label">Altura (cm)</label>
          <input type="number" v-model.number="form.altura" class="form-control" placeholder="Ex.: 175" min="1" step="0.1" inputmode="decimal">
        </div>
        <div class="field-group">
          <label class="form-label">Idade</label>
          <input type="number" v-model.number="form.idade" class="form-control" placeholder="Ex.: 30" min="1" step="1" inputmode="numeric">
        </div>
        <div class="field-group bmr-equacao" :class="{ 'is-solo': form.equacao !== 'katch' }">
          <label class="form-label">Equação</label>
          <AppSelect v-model="form.equacao" @update:model-value="recalcularSeResultado" :options="[
            { value: 'mifflin', label: 'Mifflin-St Jeor' },
            { value: 'katch',   label: 'Katch-McArdle'   },
          ]" />
        </div>
        <div class="field-group bmr-gordura" v-if="form.equacao === 'katch'">
          <label class="form-label">Gordura corporal (%)</label>
          <input type="number" v-model.number="form.gorduraCorporal" class="form-control" placeholder="Ex.: 18" min="1" max="70" step="0.1" inputmode="decimal">
        </div>
        <div class="field-group bmr-objetivo">
          <label class="form-label">Objetivo</label>
          <AppSelect v-model="form.objetivo" @update:model-value="recalcularSeResultado" :options="[
            { value: 'manter', label: 'Manter peso'           },
            { value: 'perder', label: 'Perder gordura'        },
            { value: 'ganhar', label: 'Ganhar massa muscular' },
          ]" />
        </div>
        <div class="field-group bmr-actions">
          <button class="btn btn-primary w-100" @click="calcular" type="button">Calcular TMB</button>
        </div>
      </div>

      <article class="bmr-result-card">
        <span class="dashboard-label">TMB estimada</span>
        <div class="bmr-result-value"><span>{{ fmt(animatedResultado) }}</span><small>kcal/dia</small></div>
        <p>{{ perfil.resultado > 0 ? `Estimativa de repouso: ${fmt(animatedResultado)} kcal por dia.` : 'Informe os dados para calcular.' }}</p>
        <button class="btn btn-outline-secondary btn-compact" :disabled="perfil.resultado <= 0" @click="usarTmbMeta" type="button">Usar como meta calórica</button>
      </article>
    </div>

    <div class="bmr-macros" v-if="perfil.resultado > 0">
      <div class="bmr-macros-header">
        <div>
          <span class="panel-kicker">Estimativa</span>
          <h3>Distribuição de macronutrientes</h3>
        </div>
        <p class="bmr-macros-note">Proteínas e gorduras calculadas por g/kg de peso corporal (ISSN); carboidratos completam as calorias da TMB. Conversão: 4 kcal/g para proteínas e carboidratos, 9 kcal/g para gorduras.</p>
      </div>
      <div class="bmr-macros-grid">
        <article class="bmr-macro-card bmr-macro-card-proteinas">
          <span class="bmr-macro-label">Proteínas</span>
          <div class="bmr-macro-value"><span>{{ animatedMacros.proteinas }}</span><small>g/dia</small></div>
          <p class="bmr-macro-pct">{{ fmtGkg(gkg[perfil.objetivo]?.proteinas ?? 1.6) }} g por kg de peso</p>
        </article>
        <article class="bmr-macro-card bmr-macro-card-gorduras">
          <span class="bmr-macro-label">Gorduras</span>
          <div class="bmr-macro-value"><span>{{ animatedMacros.gorduras }}</span><small>g/dia</small></div>
          <p class="bmr-macro-pct">{{ fmtGkg(gkg[perfil.objetivo]?.gorduras ?? 0.8) }} g por kg de peso</p>
        </article>
        <article class="bmr-macro-card bmr-macro-card-carbs">
          <span class="bmr-macro-label">Carboidratos</span>
          <div class="bmr-macro-value"><span>{{ animatedMacros.carboidratos }}</span><small>g/dia</small></div>
          <p class="bmr-macro-pct">Calorias restantes da TMB</p>
        </article>
      </div>
      <button class="btn btn-accent w-100" @click="usarMacrosMeta" type="button">Usar calorias e macros como metas</button>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useTrackerStore, OBJETIVOS_MACROS } from '../stores/tracker.js'
import { useUIStore } from '../stores/ui.js'
import AppSelect from '../components/AppSelect.vue'

const trackerStore = useTrackerStore()
const uiStore      = useUIStore()

const gkg = OBJETIVOS_MACROS
const nomesEquacao = { mifflin: 'Mifflin-St Jeor', katch: 'Katch-McArdle' }

function fmtGkg(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 1 }) }

const perfil = computed(() => trackerStore.tmbPerfil)

// ── Count-up animation ────────────────────────────────────────────────────────
const animatedResultado = ref(0)
const animatedMacros    = reactive({ proteinas: 0, gorduras: 0, carboidratos: 0 })
let rafId = null

function animateAll(toResultado, toMacros) {
  if (rafId) cancelAnimationFrame(rafId)
  const fromR  = animatedResultado.value
  const fromM  = { ...animatedMacros }
  const start  = performance.now()
  const dur    = 600

  function tick(now) {
    const t      = Math.min((now - start) / dur, 1)
    const eased  = 1 - Math.pow(1 - t, 3) // ease-out cubic
    animatedResultado.value    = Math.round(fromR + (toResultado - fromR) * eased)
    animatedMacros.proteinas   = Math.round(fromM.proteinas   + ((toMacros.proteinas   || 0) - fromM.proteinas)   * eased)
    animatedMacros.gorduras    = Math.round(fromM.gorduras    + ((toMacros.gorduras    || 0) - fromM.gorduras)    * eased)
    animatedMacros.carboidratos = Math.round(fromM.carboidratos + ((toMacros.carboidratos || 0) - fromM.carboidratos) * eased)
    if (t < 1) rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

watch(perfil, (p) => animateAll(p.resultado, p.macros), { immediate: true, deep: true })
onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId) })

// ─────────────────────────────────────────────────────────────────────────────
const form = ref({ sexo: '', peso: 0, altura: 0, idade: 0, objetivo: 'manter', equacao: 'mifflin', gorduraCorporal: 0 })

const nomeEquacao = computed(() => nomesEquacao[form.value.equacao] || nomesEquacao.mifflin)

watch(perfil, (p) => {
  form.value = {
    sexo: p.sexo, peso: p.peso, altura: p.altura, idade: p.idade,
    objetivo: p.objetivo, equacao: p.equacao || 'mifflin', gorduraCorporal: p.gorduraCorporal || 0,
  }
}, { immediate: true })

function fmt(v) { return String(Math.round(Number(v) || 0)) }

function calcular() {
  const p = form.value
  if (!p.sexo || p.peso <= 0 || p.altura <= 0 || p.idade <= 0) {
    uiStore.mostrarToast('Informe sexo, peso, altura e idade para calcular a TMB.', 'error')
    return
  }
  if (p.equacao === 'katch' && (p.gorduraCorporal <= 0 || p.gorduraCorporal >= 100)) {
    uiStore.mostrarToast('Informe o percentual de gordura corporal para usar Katch-McArdle.', 'error')
    return
  }
  trackerStore.atualizarTmbPerfil({ ...p })
}

function recalcularSeResultado() {
  if (perfil.value.resultado <= 0) return
  const p = form.value
  if (p.equacao === 'katch' && (p.gorduraCorporal <= 0 || p.gorduraCorporal >= 100)) return
  calcular()
}

function usarTmbMeta() {
  if (perfil.value.resultado <= 0) return
  trackerStore.atualizarMetasDiarias({ ...trackerStore.metasDiarias, calorias: perfil.value.resultado })
  uiStore.mostrarToast('TMB definida como meta calórica.', 'success')
}

function usarMacrosMeta() {
  const m = perfil.value.macros
  trackerStore.atualizarMetasDiarias({
    carboidratos: m.carboidratos,
    proteinas: m.proteinas,
    gorduras: m.gorduras,
    calorias: perfil.value.resultado
  })
  uiStore.mostrarToast('Calorias e macros definidos como metas.', 'success')
}
</script>

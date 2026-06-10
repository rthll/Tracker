<template>
  <header class="app-topbar">
    <div class="brand-block">
      <span class="eyebrow">Tracker nutricional</span>
      <h1>Macronutrientes</h1>
    </div>

    <nav class="app-nav" aria-label="Navegação principal">
      <button v-for="p in paginas" :key="p.id"
        class="app-nav-button"
        :class="{ 'is-active': uiStore.paginaAtual === p.id }"
        :aria-current="uiStore.paginaAtual === p.id ? 'page' : 'false'"
        type="button"
        @click="navegar(p.id)">{{ p.label }}</button>
    </nav>

    <div class="date-panel date-panel-compact">
      <p class="date-panel-label">Dia selecionado</p>
      <p class="date-panel-value" id="resumoData">{{ dataFormatada }}</p>
      <label for="dataSelecionada" class="form-label">Selecionar data</label>
      <div class="date-nav-row">
        <button class="btn-date-nav" id="btnDataAnterior" type="button" aria-label="Dia anterior" @click="mudarData(-1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <input type="date" id="dataSelecionada" class="form-control" :value="trackerStore.dataAtual" :max="hoje" aria-describedby="resumoData" @change="onDateChange">
        <button class="btn-date-nav" id="btnDataProximo" type="button" aria-label="Próximo dia" @click="mudarData(1)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <div class="user-panel">
      <button class="btn btn-link user-account-btn" id="btnConta" type="button" aria-label="Minha conta" @click="uiStore.contaModalAberta = true">
        <span id="usuarioLogado">{{ nomeUsuario }}</span>
      </button>
      <button class="btn-theme-toggle" type="button" :aria-label="uiStore.isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'" @click="uiStore.toggleTema()">
        <!-- Moon: shown in light mode (click to go dark) -->
        <svg v-if="!uiStore.isDarkMode" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <!-- Sun: shown in dark mode (click to go light) -->
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      </button>
      <button class="btn btn-outline-secondary" id="btnLogout" type="button" @click="sair">Sair</button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useUIStore }     from '../stores/ui.js'
import { useAuthStore }   from '../stores/auth.js'
import { useTrackerStore } from '../stores/tracker.js'
import { dataLocalISO, somarDias } from '../composables/datas.js'

const uiStore      = useUIStore()
const authStore    = useAuthStore()
const trackerStore = useTrackerStore()

const paginas = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'refeicoes',   label: 'Refeições' },
  { id: 'alimentos',   label: 'Alimentos' },
  { id: 'metas',       label: 'Metas' },
  { id: 'relatorios',  label: 'Relatórios' },
  { id: 'calculadora', label: 'Calculadora' },
]

const hoje = computed(() => dataLocalISO())

const nomeUsuario = computed(() => {
  const u = authStore.user
  if (!u) return 'Usuário'
  return u.displayName || u.email?.split('@')[0] || 'Usuário'
})

const dataFormatada = computed(() => {
  const data = trackerStore.dataAtual
  if (!data) return 'Hoje'
  const hj = dataLocalISO()
  const ontem = somarDias(hj, -1)
  if (data === hj) return 'Hoje'
  if (data === ontem) return 'Ontem'
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
})

function navegar(pagina) {
  uiStore.navegarPara(pagina)
}

function mudarData(delta) {
  const input = document.getElementById('dataSelecionada')
  if (!input) return
  const base = input.value || trackerStore.dataAtual
  const novaData = somarDias(base, delta)
  if (delta > 0 && novaData > hoje.value) return
  input.value = novaData
  input.dispatchEvent(new Event('change'))
}

function onDateChange(event) {
  const novaData = event.target.value
  trackerStore.dataAtual = novaData
}

async function sair() {
  await window.TrackerAuth.logout()
}
</script>

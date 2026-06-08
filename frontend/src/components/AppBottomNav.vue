<template>
  <!-- "Mais" overlay -->
  <div class="bottom-nav-more-overlay" id="bottomNavOverlay" :hidden="!maisAberto" @click="maisAberto = false"></div>
  <nav class="bottom-nav-more-panel" id="bottomNavMaisPanel" :hidden="!maisAberto">
    <button class="bottom-nav-more-item" type="button" @click="navegar('alimentos')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Alimentos
    </button>
    <button class="bottom-nav-more-item" type="button" @click="navegar('relatorios')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
      Relatórios
    </button>
    <button class="bottom-nav-more-item" type="button" @click="toggleTema">
      <svg v-if="!isDarkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      {{ isDarkMode ? 'Modo claro' : 'Modo escuro' }}
    </button>
  </nav>

  <!-- Bottom nav -->
  <nav class="mobile-bottom-nav" aria-label="Navegação principal">
    <button class="bottom-nav-item" :class="{ 'is-active': paginaAtual === 'dashboard' }" type="button" id="bottomNavDashboard" @click="navegar('dashboard')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Dashboard</span>
    </button>
    <button class="bottom-nav-item" :class="{ 'is-active': paginaAtual === 'refeicoes' }" type="button" id="bottomNavRefeicoes" @click="navegar('refeicoes')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
      <span>Refeições</span>
    </button>
    <button class="bottom-nav-item" :class="{ 'is-active': paginaAtual === 'metas' }" type="button" id="bottomNavMetas" @click="navegar('metas')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
      <span>Metas</span>
    </button>
    <button class="bottom-nav-item" :class="{ 'is-active': paginaAtual === 'calculadora' }" type="button" id="bottomNavCalculadora" @click="navegar('calculadora')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10" stroke-width="3"/><line x1="12" y1="10" x2="12" y2="10" stroke-width="3"/><line x1="16" y1="10" x2="16" y2="10" stroke-width="3"/><line x1="8" y1="14" x2="8" y2="14" stroke-width="3"/><line x1="12" y1="14" x2="12" y2="14" stroke-width="3"/><line x1="16" y1="14" x2="16" y2="14" stroke-width="3"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="16" y1="18" x2="16" y2="18" stroke-width="3"/></svg>
      <span>Calc.</span>
    </button>
    <button class="bottom-nav-item" :class="{ 'is-active': maisAtivo }" type="button" id="btnBottomNavMais" @click="maisAberto = !maisAberto">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      <span>Mais</span>
    </button>
  </nav>

  <!-- FAB -->
  <button class="fab-add" id="fabAdicionarAlimento" type="button" aria-label="Adicionar alimento" @click="onFab">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUIStore } from '../stores/ui.js'

const uiStore    = useUIStore()
const maisAberto = ref(false)

const isDarkMode = computed(() => uiStore.isDarkMode)

function toggleTema() {
  uiStore.toggleTema()
  maisAberto.value = false
}

const paginaAtual = computed(() => uiStore.paginaAtual)
const maisAtivo   = computed(() => ['alimentos', 'relatorios'].includes(paginaAtual.value))

function navegar(pagina) {
  maisAberto.value = false
  uiStore.navegarPara(pagina)
}

function onFab() {
  if (paginaAtual.value !== 'dashboard') navegar('dashboard')
  setTimeout(() => {
    const campo = document.getElementById('buscaAlimento')
    if (campo) { campo.focus(); campo.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  }, 50)
}
</script>

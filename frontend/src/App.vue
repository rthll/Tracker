<template>
  <div class="page-shell">
    <div class="ambient-shape ambient-shape-left" aria-hidden="true"></div>
    <div class="ambient-shape ambient-shape-right" aria-hidden="true"></div>

    <!-- Auth gate -->
    <AuthModal v-if="!authStore.isLoggedIn" />

    <!-- App shell -->
    <section class="app-card" v-show="authStore.isLoggedIn" id="appShell">
      <AppHeader />
      <AppBottomNav />

      <Transition name="page" mode="out-in">
        <div class="page-view is-active" :key="paginaAtual">
          <component :is="pageComponents[paginaAtual]" />
        </div>
      </Transition>

      <AccountModal />
    </section>

    <AppToast />

    <template v-if="authStore.isLoggedIn">
      <ChatWidget />
      <ChatPanel />
    </template>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useAuthStore }   from './stores/auth.js'
import { useUIStore }     from './stores/ui.js'
import AuthModal     from './components/AuthModal.vue'
import AppHeader     from './components/AppHeader.vue'
import AppBottomNav  from './components/AppBottomNav.vue'
import AccountModal  from './components/AccountModal.vue'
import AppToast      from './components/AppToast.vue'
import ChatWidget    from './components/ChatWidget.vue'
import ChatPanel     from './components/ChatPanel.vue'
import PageDashboard   from './pages/PageDashboard.vue'
import PageRefeicoes   from './pages/PageRefeicoes.vue'
import PageAlimentos   from './pages/PageAlimentos.vue'
import PageMetas       from './pages/PageMetas.vue'
import PageRelatorios  from './pages/PageRelatorios.vue'
import PageCalculadora from './pages/PageCalculadora.vue'

const authStore = useAuthStore()
const uiStore   = useUIStore()

const paginaAtual = computed(() => uiStore.paginaAtual)

const pageComponents = {
  dashboard:   PageDashboard,
  refeicoes:   PageRefeicoes,
  alimentos:   PageAlimentos,
  metas:       PageMetas,
  relatorios:  PageRelatorios,
  calculadora: PageCalculadora,
}

// Detect page from URL hash on load
watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    const hash = window.location.hash.replace('#', '')
    const validas = ['dashboard','refeicoes','alimentos','metas','relatorios','calculadora']
    if (validas.includes(hash)) uiStore.paginaAtual = hash
  }
}, { immediate: true })
</script>

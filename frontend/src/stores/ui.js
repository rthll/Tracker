import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PAGINAS_VALIDAS = ['dashboard', 'refeicoes', 'alimentos', 'metas', 'relatorios', 'calculadora']
const THEME_KEY = 'tracker:theme'

export const useUIStore = defineStore('ui', () => {
  const paginaAtual       = ref('dashboard')
  const toasts            = ref([])
  const contaModalAberta  = ref(false)
  const authStatus        = ref('')
  const authStatusTipo    = ref('')
  const preselectedFoodId = ref(null)

  // ── Theme ────────────────────────────────────────────────────────────────────
  const temaAtual = ref(localStorage.getItem(THEME_KEY) || 'auto')

  const isDarkMode = computed(() => {
    if (temaAtual.value === 'dark') return true
    if (temaAtual.value === 'light') return false
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  function toggleTema() {
    const goingDark = !isDarkMode.value
    temaAtual.value = goingDark ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, temaAtual.value)
    document.documentElement.classList.add('theme-transitioning')
    document.documentElement.classList.toggle('dark', goingDark)
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300)
  }

  function navegarPara(pagina) {
    if (!PAGINAS_VALIDAS.includes(pagina)) return
    paginaAtual.value = pagina
    if (typeof window !== 'undefined' && window.location)
      window.location.hash = pagina
  }

  function mostrarToast(mensagem, tipo = 'info') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, mensagem, tipo })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3500)
  }

  function setAuthStatus(mensagem, tipo = '') {
    authStatus.value = mensagem || ''
    authStatusTipo.value = tipo
  }

  return { paginaAtual, toasts, contaModalAberta, authStatus, authStatusTipo, preselectedFoodId, navegarPara, mostrarToast, setAuthStatus, temaAtual, isDarkMode, toggleTema }
})

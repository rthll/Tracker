import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function normText(texto) {
  return String(texto || '').trim().toLocaleLowerCase('pt-BR')
}

export const useFoodStore = defineStore('food', () => {
  const alimentosTaco           = ref([])
  const alimentosPersonalizados = ref([])
  const favoritos               = ref([])
  const historicoAlimentos      = ref([])

  const todosAlimentos = computed(() =>
    [...alimentosTaco.value, ...alimentosPersonalizados.value]
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  )

  const alimentosFavoritos = computed(() =>
    favoritos.value.map(id => todosAlimentos.value.find(a => a.id === id)).filter(Boolean)
  )

  const alimentosHistorico = computed(() =>
    historicoAlimentos.value.map(id => todosAlimentos.value.find(a => a.id === id)).filter(Boolean)
  )

  function getAlimentoPorId(id) {
    return todosAlimentos.value.find(a => a.id === id) || null
  }

  function getAlimentoPorNome(nome) {
    const n = normText(nome)
    return todosAlimentos.value.find(a => normText(a.nome) === n) || null
  }

  function loadTacoData(tacoData) {
    if (!Array.isArray(tacoData)) return
    alimentosTaco.value = tacoData.map(a => ({
      id: a.id || (a.tacoId ? `taco:${a.tacoId}` : `taco:${Date.now()}-${Math.random().toString(16).slice(2)}`),
      nome: String(a.nome || '').trim(),
      carboidratos: parseFloat(a.carboidratos) || 0,
      proteinas:    parseFloat(a.proteinas)    || 0,
      gorduras:     parseFloat(a.gorduras)     || 0,
      calorias:     parseFloat(a.calorias)     || 0,
      fibra:        parseFloat(a.fibra)        || 0,
      personalizado: false,
      origem: 'TACO',
    }))
  }

  function loadUserData(alimentosPers, favs, historico) {
    alimentosPersonalizados.value = Array.isArray(alimentosPers) ? alimentosPers : []
    favoritos.value               = Array.isArray(favs)          ? favs          : []
    historicoAlimentos.value      = Array.isArray(historico)     ? historico     : []
  }

  function resetarDadosUsuario() {
    alimentosPersonalizados.value = []
    favoritos.value               = []
    historicoAlimentos.value      = []
  }

  return {
    alimentosTaco, alimentosPersonalizados, favoritos, historicoAlimentos,
    todosAlimentos, alimentosFavoritos, alimentosHistorico,
    getAlimentoPorId, getAlimentoPorNome, normText,
    loadTacoData, loadUserData, resetarDadosUsuario,
  }
})

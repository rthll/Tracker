import { ref, computed, watch } from 'vue'
import { useFoodStore } from '../stores/food.js'

export const CATEGORIAS_BUSCA = [
  { id: 'carboidratos',  label: 'Ricos em carboidratos' },
  { id: 'proteinas',     label: 'Ricos em proteínas' },
  { id: 'gorduras',      label: 'Ricos em gorduras' },
  { id: 'baixasCalorias', label: 'Baixas calorias' },
]

const FILTROS = {
  carboidratos:  a => a.carboidratos > 0,
  proteinas:     a => a.proteinas    > 0,
  gorduras:      a => a.gorduras     > 0,
  baixasCalorias: a => a.calorias    > 0,
}

const ORDENADORES = {
  carboidratos:  (a, b) => b.carboidratos - a.carboidratos,
  proteinas:     (a, b) => b.proteinas    - a.proteinas,
  gorduras:      (a, b) => b.gorduras     - a.gorduras,
  baixasCalorias: (a, b) => a.calorias   - b.calorias,
}

const LIMITE = 8

export function useFoodSearch() {
  const foodStore = useFoodStore()

  const termo               = ref('')
  const resultados          = ref([])
  const alimentoSelecionadoId = ref(null)
  const painelAberto        = ref(false)
  const focusedIndex        = ref(-1)
  let _timer = null

  const alimentoSelecionado = computed(() =>
    alimentoSelecionadoId.value
      ? foodStore.getAlimentoPorId(alimentoSelecionadoId.value)
      : null
  )

  watch(resultados, () => { focusedIndex.value = -1 })
  watch(painelAberto, (v) => { if (!v) focusedIndex.value = -1 })

  function moverFoco(delta) {
    if (!painelAberto.value || !resultados.value.length) return
    focusedIndex.value = Math.max(0, Math.min(resultados.value.length - 1, focusedIndex.value + delta))
  }

  function selecionarFocado() {
    if (focusedIndex.value >= 0 && resultados.value[focusedIndex.value]) {
      selecionar(resultados.value[focusedIndex.value])
      return true
    }
    return false
  }

  function buscar(texto, imediato = false) {
    // Deselect if text changed from the selected food name
    if (alimentoSelecionadoId.value) {
      const atual = foodStore.getAlimentoPorId(alimentoSelecionadoId.value)
      if (atual && foodStore.normText(texto) !== foodStore.normText(atual.nome)) {
        alimentoSelecionadoId.value = null
      }
    }
    termo.value = texto

    if (_timer) { clearTimeout(_timer); _timer = null }

    const run = () => {
      const t = foodStore.normText(texto)
      if (!t) {
        resultados.value  = foodStore.alimentosHistorico.slice(0, LIMITE)
        painelAberto.value = resultados.value.length > 0
        return
      }
      resultados.value = foodStore.todosAlimentos
        .filter(a => foodStore.normText(a.nome).includes(t))
        .sort((a, b) => {
          const ai = foodStore.normText(a.nome).startsWith(t) ? 0 : 1
          const bi = foodStore.normText(b.nome).startsWith(t) ? 0 : 1
          return ai !== bi ? ai - bi : a.nome.localeCompare(b.nome, 'pt-BR')
        })
        .slice(0, LIMITE)
      painelAberto.value = true
    }

    if (imediato) { run(); return }
    _timer = setTimeout(run, 120)
  }

  function buscarPorCategoria(categoriaId) {
    alimentoSelecionadoId.value = null
    termo.value = ''
    const filtro    = FILTROS[categoriaId]    || (() => true)
    const ordenador = ORDENADORES[categoriaId] || ((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    resultados.value  = [...foodStore.todosAlimentos].filter(filtro).sort(ordenador).slice(0, LIMITE)
    painelAberto.value = true
  }

  function selecionar(alimento) {
    alimentoSelecionadoId.value = alimento.id
    termo.value = alimento.nome
    painelAberto.value = false
    if (_timer) { clearTimeout(_timer); _timer = null }
  }

  function fecharPainel() {
    painelAberto.value = false
    if (_timer) { clearTimeout(_timer); _timer = null }
  }

  function limpar() {
    alimentoSelecionadoId.value = null
    termo.value = ''
    resultados.value = []
    painelAberto.value = false
    if (_timer) { clearTimeout(_timer); _timer = null }
  }

  return {
    termo, resultados, alimentoSelecionadoId, alimentoSelecionado, painelAberto, focusedIndex,
    categorias: CATEGORIAS_BUSCA,
    buscar, buscarPorCategoria, selecionar, fecharPainel, limpar, moverFoco, selecionarFocado,
  }
}

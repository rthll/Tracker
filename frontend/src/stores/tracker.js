import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../composables/api.js'
import { dataLocalISO } from '../composables/datas.js'
import { useAuthStore } from './auth.js'
import { useFoodStore } from './food.js'

const STORAGE_KEY_BASE = 'trackerMacronutrientes:v1'

// ─── Utilities ───────────────────────────────────────────────────────────────

function valNum(v) {
  const n = parseFloat(v)
  return isFinite(n) ? n : 0
}

function uid() {
  return crypto?.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function criarId(prefix = 'entry') {
  return `${prefix}:${uid()}`
}

const metasDefault   = () => ({ carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
const tiposPadrao    = () => [
  { id: 'cafe',    nome: 'Café da manhã' },
  { id: 'almoco',  nome: 'Almoço' },
  { id: 'jantar',  nome: 'Jantar' },
  { id: 'lanches', nome: 'Lanches' },
]
const tmbDefault = () => ({
  sexo: '', peso: 0, altura: 0, idade: 0, objetivo: 'manter',
  equacao: 'mifflin', gorduraCorporal: 0,
  resultado: 0, macros: { proteinas: 0, gorduras: 0, carboidratos: 0 },
})

// Gramas por kg de peso corporal. Faixas: proteínas 1,6–2,2 g/kg e gorduras
// 0,6–1,0 g/kg; o objetivo do usuário define o ponto usado dentro de cada faixa.
export const OBJETIVOS_MACROS = {
  manter: { proteinas: 1.6, gorduras: 0.8 },
  perder: { proteinas: 2.2, gorduras: 0.6 },
  ganhar: { proteinas: 2.0, gorduras: 1.0 },
}

// Fatores de Atwater: kcal por grama de cada macronutriente
const KCAL_POR_GRAMA = { proteinas: 4, carboidratos: 4, gorduras: 9 }

// Cálculo único da calculadora: TMB (pela equação escolhida) e, a partir dela,
// a distribuição de macros em gramas. Proteínas e gorduras saem de g/kg de
// peso corporal conforme o objetivo; carboidratos completam as calorias
// restantes, garantindo que 4·P + 9·G + 4·C feche com a TMB calculada.
function calcularPerfilTmb(p) {
  const vazio = { resultado: 0, macros: { proteinas: 0, gorduras: 0, carboidratos: 0 } }
  let tmb = 0
  if (p.equacao === 'katch') {
    if (p.peso <= 0 || p.gorduraCorporal <= 0 || p.gorduraCorporal >= 100) return vazio
    const massaMagra = p.peso * (1 - p.gorduraCorporal / 100)
    tmb = 370 + (21.6 * massaMagra)
  } else {
    if (!p.sexo || p.peso <= 0 || p.altura <= 0 || p.idade <= 0) return vazio
    tmb = (10 * p.peso) + (6.25 * p.altura) - (5 * p.idade) + (p.sexo === 'masculino' ? 5 : -161)
  }
  const resultado = Math.round(tmb)
  if (resultado <= 0) return vazio

  const cfg       = OBJETIVOS_MACROS[p.objetivo] || OBJETIVOS_MACROS.manter
  const proteinas = Math.round(p.peso * cfg.proteinas)
  const gorduras  = Math.round(p.peso * cfg.gorduras)
  const restante  = resultado - (proteinas * KCAL_POR_GRAMA.proteinas) - (gorduras * KCAL_POR_GRAMA.gorduras)
  const carboidratos = Math.max(0, Math.round(restante / KCAL_POR_GRAMA.carboidratos))
  return { resultado, macros: { proteinas, gorduras, carboidratos } }
}

function normalizarMetas(m) {
  return {
    carboidratos: valNum(m?.carboidratos),
    proteinas:    valNum(m?.proteinas),
    gorduras:     valNum(m?.gorduras),
    calorias:     valNum(m?.calorias),
  }
}

function normalizarTmbPerfil(p) {
  const sexo     = ['masculino', 'feminino'].includes(p?.sexo) ? p.sexo : ''
  const objetivo = ['manter', 'perder', 'ganhar'].includes(p?.objetivo) ? p.objetivo : 'manter'
  const equacao  = ['mifflin', 'katch'].includes(p?.equacao) ? p.equacao : 'mifflin'
  const perfil   = {
    sexo, objetivo, equacao,
    peso:            valNum(p?.peso),
    altura:          valNum(p?.altura),
    idade:           valNum(p?.idade),
    gorduraCorporal: valNum(p?.gorduraCorporal),
  }
  const { resultado, macros } = calcularPerfilTmb(perfil)
  perfil.resultado = resultado
  perfil.macros    = macros
  return perfil
}

function normalizarItemRefeicao(item) {
  return {
    id:           item.id || criarId('entry'),
    alimentoId:   item.alimentoId || null,
    nome:         String(item.nome || '').trim(),
    quantidade:   valNum(item.quantidade),
    carboidratos: valNum(item.carboidratos),
    proteinas:    valNum(item.proteinas),
    gorduras:     valNum(item.gorduras),
    calorias:     valNum(item.calorias),
  }
}

function normalizarAlimentoPersonalizado(a) {
  const rawId = String(a.id || '').trim()
  const id = rawId.startsWith('custom:') ? rawId
    : rawId.startsWith('taco:') ? `custom:${uid()}`
    : `custom:${rawId || uid()}`
  return {
    id, personalizado: true, origem: 'Personalizado',
    nome:         String(a.nome || '').trim(),
    carboidratos: valNum(a.carboidratos),
    proteinas:    valNum(a.proteinas),
    gorduras:     valNum(a.gorduras),
    calorias:     valNum(a.calorias),
    fibra:        valNum(a.fibra),
    criadoEm:     a.criadoEm || new Date().toISOString(),
  }
}

function criarRefeicoesVazias(tipos) {
  return tipos.reduce((r, t) => { r[t.id] = []; return r }, {})
}

function normalizarRefeicaoDia(dia, tipos) {
  const ref = criarRefeicoesVazias(tipos)
  if (!dia || typeof dia !== 'object') return ref
  tipos.forEach(t => {
    ref[t.id] = Array.isArray(dia[t.id]) ? dia[t.id].map(normalizarItemRefeicao) : []
  })
  return ref
}

function normalizarRefeicoes(porData, tipos) {
  if (!porData || typeof porData !== 'object') return {}
  return Object.fromEntries(
    Object.entries(porData).map(([data, dia]) => [data, normalizarRefeicaoDia(dia, tipos)])
  )
}

function calcularTotaisItens(itens) {
  return itens.reduce((t, i) => {
    t.carboidratos += valNum((i || {}).carboidratos)
    t.proteinas    += valNum((i || {}).proteinas)
    t.gorduras     += valNum((i || {}).gorduras)
    t.calorias     += valNum((i || {}).calorias)
    return t
  }, { carboidratos: 0, proteinas: 0, gorduras: 0, calorias: 0 })
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTrackerStore = defineStore('tracker', () => {
  const authStore = useAuthStore()

  const metasDiarias      = ref(metasDefault())
  const refeicoesPorData  = ref({})
  const tmbPerfil         = ref(tmbDefault())
  const tiposRefeicao     = ref(tiposPadrao())
  const templatesRefeicao = ref([])
  const dataAtual         = ref(dataLocalISO())

  // ── Persistence ────────────────────────────────────────────────────────────

  function getStorageKey() {
    const uid = authStore.uid
    return uid ? `${STORAGE_KEY_BASE}:user:${encodeURIComponent(uid)}` : STORAGE_KEY_BASE
  }

  function getDadosPersistencia() {
    const food = useFoodStore()
    return {
      tiposRefeicao:          tiposRefeicao.value.map(r => ({ ...r })),
      alimentosPersonalizados: food.alimentosPersonalizados.map(a => ({ ...a })),
      refeicoesPorData:       JSON.parse(JSON.stringify(refeicoesPorData.value)),
      favoritos:              [...food.favoritos],
      historicoAlimentos:     [...food.historicoAlimentos],
      templatesRefeicao:      templatesRefeicao.value.map(t => ({ ...t })),
      metasDiarias:           { ...metasDiarias.value },
      tmbPerfil:              { ...tmbPerfil.value },
    }
  }

  function salvar(alteracao = null) {
    const dados = getDadosPersistencia()
    try { localStorage.setItem(getStorageKey(), JSON.stringify(dados)) } catch {}
    if (authStore.isLoggedIn) {
      const p = alteracao
        ? api.applyTrackerChange(alteracao, dados)
        : api.saveTrackerState(dados)
      p.catch(e => console.warn('Remote save failed:', e))
    }
  }

  // ── Init / Reset ───────────────────────────────────────────────────────────

  function carregarDados(dados) {
    const food = useFoodStore()
    tiposRefeicao.value = Array.isArray(dados?.tiposRefeicao) && dados.tiposRefeicao.length
      ? dados.tiposRefeicao
      : tiposPadrao()
    const tipos = tiposRefeicao.value
    refeicoesPorData.value  = normalizarRefeicoes(dados?.refeicoesPorData, tipos)
    templatesRefeicao.value = Array.isArray(dados?.templatesRefeicao) ? dados.templatesRefeicao : []
    metasDiarias.value      = normalizarMetas(dados?.metasDiarias)
    tmbPerfil.value         = normalizarTmbPerfil(dados?.tmbPerfil)
    const alimentosPers = Array.isArray(dados?.alimentosPersonalizados)
      ? dados.alimentosPersonalizados.map(normalizarAlimentoPersonalizado)
      : Array.isArray(dados?.alimentos)
        ? dados.alimentos.map(normalizarAlimentoPersonalizado)
        : []
    food.loadUserData(
      alimentosPers,
      Array.isArray(dados?.favoritos)          ? dados.favoritos          : [],
      Array.isArray(dados?.historicoAlimentos) ? dados.historicoAlimentos : [],
    )
  }

  function init(dadosRemotos, usuarioUid) {
    const food = useFoodStore()
    food.loadTacoData(window.TACO_ALIMENTOS)
    resetarDadosUsuario()

    let dados = dadosRemotos
    if (!dados) {
      try {
        const key = usuarioUid
          ? `${STORAGE_KEY_BASE}:user:${encodeURIComponent(usuarioUid)}`
          : STORAGE_KEY_BASE
        const raw = localStorage.getItem(key)
        if (raw) dados = JSON.parse(raw)
      } catch {}
    }

    if (dados) carregarDados(dados)
    if (dadosRemotos) {
      try { localStorage.setItem(getStorageKey(), JSON.stringify(getDadosPersistencia())) } catch {}
    }
  }

  function resetarDadosUsuario() {
    const food = useFoodStore()
    tiposRefeicao.value     = tiposPadrao()
    templatesRefeicao.value = []
    refeicoesPorData.value  = {}
    metasDiarias.value      = metasDefault()
    tmbPerfil.value         = tmbDefault()
    food.resetarDadosUsuario()
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function normalizarRefeicaoId(id) {
    return tiposRefeicao.value.some(t => t.id === id) ? id : (tiposRefeicao.value[0]?.id || 'almoco')
  }

  function garantirRefeicoesDoDia(data) {
    if (!refeicoesPorData.value[data]) {
      refeicoesPorData.value[data] = criarRefeicoesVazias(tiposRefeicao.value)
    }
    return refeicoesPorData.value[data]
  }

  function criarItemRefeicao(alimentoBase, quantidade) {
    const f = quantidade / 100
    return {
      id:           criarId('entry'),
      alimentoId:   alimentoBase.id,
      nome:         alimentoBase.nome,
      quantidade,
      carboidratos: alimentoBase.carboidratos * f,
      proteinas:    alimentoBase.proteinas    * f,
      gorduras:     alimentoBase.gorduras     * f,
      calorias:     alimentoBase.calorias     * f,
    }
  }

  function getRefeicoesDoDia(data) {
    return refeicoesPorData.value[data] || criarRefeicoesVazias(tiposRefeicao.value)
  }

  function getItensDoDia(data) {
    const ref = refeicoesPorData.value[data] || {}
    return tiposRefeicao.value.flatMap(t => ref[t.id] || [])
  }

  function getQuantidadeItensDia(data) {
    return getItensDoDia(data).length
  }

  function getItemRefeicao(data, refeicaoId, index) {
    const ref = (refeicoesPorData.value[data] || {})[normalizarRefeicaoId(refeicaoId)] || []
    if (index < 0 || index >= ref.length) return null
    return { ...ref[index] }
  }

  // ── Meal CRUD ──────────────────────────────────────────────────────────────

  function adicionarRefeicao(data, refeicaoId, item) {
    if (!data) return
    const ref = garantirRefeicoesDoDia(data)
    const id  = normalizarRefeicaoId(refeicaoId)
    if (!ref[id]) ref[id] = []
    ref[id].push(item)
    salvar({ tipo: 'day', data, refeicoesDoDia: ref })
  }

  function removerItem(data, refeicaoId, index) {
    const ref = refeicoesPorData.value[data]
    if (!ref) return
    const id  = normalizarRefeicaoId(refeicaoId)
    const arr = ref[id]
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) return
    arr.splice(index, 1)
    salvar({ tipo: 'day', data, refeicoesDoDia: ref })
  }

  function moverItem(data, origemId, index, destinoId) {
    const ref    = refeicoesPorData.value[data]
    if (!ref) return false
    const oId    = normalizarRefeicaoId(origemId)
    const dId    = normalizarRefeicaoId(destinoId)
    if (oId === dId) return false
    const origem = ref[oId]
    const destino = ref[dId]
    if (!Array.isArray(origem) || !Array.isArray(destino) || index < 0 || index >= origem.length) return false
    const [item] = origem.splice(index, 1)
    destino.push(item)
    salvar({ tipo: 'day', data, refeicoesDoDia: ref })
    return true
  }

  function atualizarItemRefeicao(data, origemId, index, destinoId, itemAtualizado) {
    if (!data) return false
    const ref   = garantirRefeicoesDoDia(data)
    const oId   = normalizarRefeicaoId(origemId)
    const dId   = normalizarRefeicaoId(destinoId)
    const orig  = ref[oId]
    const dest  = ref[dId]
    if (!Array.isArray(orig) || !Array.isArray(dest) || index < 0 || index >= orig.length) return false
    const item  = normalizarItemRefeicao(itemAtualizado)
    if (oId === dId) { orig[index] = item } else { orig.splice(index, 1); dest.push(item) }
    salvar({ tipo: 'day', data, refeicoesDoDia: ref })
    return true
  }

  function repetirRefeicao(dataOrigem, dataDestino) {
    const food     = useFoodStore()
    const refOrig  = refeicoesPorData.value[dataOrigem] || {}
    const total    = Object.values(refOrig).flat().length
    if (!total || !dataDestino) return 0
    const refDest  = garantirRefeicoesDoDia(dataDestino)
    tiposRefeicao.value.forEach(tipo => {
      const copiados = (refOrig[tipo.id] || []).map(i => ({ ...i, id: criarId('entry') }))
      refDest[tipo.id] = [...(refDest[tipo.id] || []), ...copiados]
      copiados.forEach(i => {
        if (i.alimentoId) {
          food.historicoAlimentos = [
            i.alimentoId,
            ...food.historicoAlimentos.filter(x => x !== i.alimentoId),
          ].slice(0, 8)
        }
      })
    })
    salvar({ tipo: 'day', data: dataDestino, refeicoesDoDia: refDest })
    salvar({ tipo: 'userMeta', favoritos: food.favoritos, historicoAlimentos: food.historicoAlimentos })
    return total
  }

  // ── Food (accessed via food store) ─────────────────────────────────────────

  function adicionarAlimento(alimento) {
    const food        = useFoodStore()
    const normalizado = normalizarAlimentoPersonalizado(alimento)
    food.alimentosPersonalizados = [...food.alimentosPersonalizados, normalizado]
    salvar({ tipo: 'customFood', alimento: normalizado })
    return normalizado
  }

  function atualizarAlimento(alimentoId, dados) {
    const food      = useFoodStore()
    const existente = food.alimentosPersonalizados.find(a => a.id === alimentoId)
    if (!existente) return null
    const atualizado = normalizarAlimentoPersonalizado({ ...existente, ...dados, id: alimentoId })
    food.alimentosPersonalizados = food.alimentosPersonalizados.map(a =>
      a.id === alimentoId ? atualizado : a
    )
    salvar({ tipo: 'customFood', alimento: atualizado })
    return atualizado
  }

  function removerAlimento(alimentoId) {
    const food      = useFoodStore()
    const existente = food.alimentosPersonalizados.find(a => a.id === alimentoId)
    if (!existente) return false
    food.alimentosPersonalizados = food.alimentosPersonalizados.filter(a => a.id !== alimentoId)
    salvar({ tipo: 'removeCustomFood', alimentoId })
    const tinhaReferencia = food.favoritos.includes(alimentoId) || food.historicoAlimentos.includes(alimentoId)
    if (tinhaReferencia) {
      food.favoritos          = food.favoritos.filter(id => id !== alimentoId)
      food.historicoAlimentos = food.historicoAlimentos.filter(id => id !== alimentoId)
      salvar({ tipo: 'userMeta', favoritos: food.favoritos, historicoAlimentos: food.historicoAlimentos })
    }
    return true
  }

  function alternarFavorito(alimentoId) {
    const food = useFoodStore()
    if (!food.getAlimentoPorId(alimentoId)) return false
    food.favoritos = food.favoritos.includes(alimentoId)
      ? food.favoritos.filter(id => id !== alimentoId)
      : [alimentoId, ...food.favoritos]
    salvar({ tipo: 'userMeta', favoritos: food.favoritos, historicoAlimentos: food.historicoAlimentos })
    return food.favoritos.includes(alimentoId)
  }

  function registrarHistoricoAlimento(alimentoId, shouldSave = true) {
    const food = useFoodStore()
    if (!food.getAlimentoPorId(alimentoId)) return
    food.historicoAlimentos = [
      alimentoId,
      ...food.historicoAlimentos.filter(id => id !== alimentoId),
    ].slice(0, 8)
    if (shouldSave) {
      salvar({ tipo: 'userMeta', favoritos: food.favoritos, historicoAlimentos: food.historicoAlimentos })
    }
  }

  // ── Goals & BMR ───────────────────────────────────────────────────────────

  function atualizarMetasDiarias(metas) {
    metasDiarias.value = normalizarMetas(metas)
    salvar({ tipo: 'goals', metasDiarias: metasDiarias.value })
    return { ...metasDiarias.value }
  }

  function atualizarTmbPerfil(perfil) {
    tmbPerfil.value = normalizarTmbPerfil(perfil)
    salvar({ tipo: 'bmr', tmbPerfil: tmbPerfil.value })
    return { ...tmbPerfil.value }
  }

  // ── Meal types ────────────────────────────────────────────────────────────

  function adicionarTipoRefeicao(nome) {
    const nomeLimpo = String(nome || '').trim()
    if (!nomeLimpo) return null
    const novo = { id: `refeicao:${Date.now()}`, nome: nomeLimpo }
    tiposRefeicao.value = [...tiposRefeicao.value, novo]
    salvar()
    return novo
  }

  function removerTipoRefeicao(id) {
    tiposRefeicao.value = tiposRefeicao.value.filter(r => r.id !== id)
    salvar()
  }

  function reordenarTiposRefeicao(ordemIds) {
    if (!Array.isArray(ordemIds) || !ordemIds.length) return
    const porId = new Map(tiposRefeicao.value.map(t => [t.id, t]))
    const novaOrdem = ordemIds.map(id => porId.get(id)).filter(Boolean)
    if (novaOrdem.length !== porId.size) return
    tiposRefeicao.value = novaOrdem
    const food = useFoodStore()
    salvar({
      tipo: 'userMeta',
      favoritos: food.favoritos,
      historicoAlimentos: food.historicoAlimentos,
      tiposRefeicao: novaOrdem.map(t => ({ ...t })),
    })
  }

  // ── Templates ─────────────────────────────────────────────────────────────

  function adicionarTemplate(template) {
    templatesRefeicao.value = [template, ...templatesRefeicao.value]
    salvar({ tipo: 'templates', templatesRefeicao: templatesRefeicao.value })
  }

  function removerTemplate(id) {
    templatesRefeicao.value = templatesRefeicao.value.filter(t => t.id !== id)
    salvar({ tipo: 'templates', templatesRefeicao: templatesRefeicao.value })
  }

  function aplicarTemplateNoDia(templateItens, refeicaoId, data) {
    if (!data || !Array.isArray(templateItens) || !templateItens.length) return
    const ref = garantirRefeicoesDoDia(data)
    const id  = normalizarRefeicaoId(refeicaoId)
    if (!ref[id]) ref[id] = []
    templateItens.forEach(item => ref[id].push({ ...item, id: criarId('entry') }))
    salvar({ tipo: 'day', data, refeicoesDoDia: ref })
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  function gerarRelatorio(datas) {
    const datasNorm = [...new Set(
      (datas || []).map(d => String(d || '').trim())
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
    )].sort()

    const metas    = { ...metasDiarias.value }
    const dias     = datasNorm.map(d => criarResumoDia(d))
    const total    = dias.length
    const totais   = calcularTotaisItens(dias.map(d => d.totais))
    const media    = {
      carboidratos: total ? totais.carboidratos / total : 0,
      proteinas:    total ? totais.proteinas    / total : 0,
      gorduras:     total ? totais.gorduras     / total : 0,
      calorias:     total ? totais.calorias     / total : 0,
    }
    const refeicoesResumo = tiposRefeicao.value.map(tipo => {
      const refDias     = dias.map(d => d.refeicoes.find(r => r.id === tipo.id))
      const totaisRef   = calcularTotaisItens(refDias.map(r => r ? r.totais : {}))
      const totalItens  = refDias.reduce((s, r) => s + (r ? r.totalItens : 0), 0)
      const diasCom     = refDias.filter(r => r && r.totalItens > 0).length
      return {
        id: tipo.id, nome: tipo.nome, totalItens, diasComRegistro: diasCom,
        totais: totaisRef, mediaCaloriasPorDia: total ? totaisRef.calorias / total : 0,
      }
    })
    const diasOrd = [...dias].sort((a, b) => b.totais.calorias - a.totais.calorias)

    return {
      geradoEm:    new Date().toISOString(),
      datas:       datasNorm,
      totalDias:   total,
      totalItens:  dias.reduce((s, d) => s + d.totalItens, 0),
      metas, totais, mediaDiaria: media,
      distribuicaoMacros:   calcularDistribuicaoMacros(totais),
      metricasMacros:       calcularMetricasMacros(dias, metas, total),
      metricasConsistencia: calcularMetricasConsistencia(dias, metas, total),
      refeicoesResumo,
      diaMaiorCalorias: diasOrd[0]                    || null,
      diaMenorCalorias: diasOrd[diasOrd.length - 1]   || null,
      dias,
    }
  }

  function criarResumoDia(data) {
    const ref      = getRefeicoesDoDia(data)
    const refeicoes = tiposRefeicao.value.map(tipo => {
      const itens  = (ref[tipo.id] || []).map(i => ({ ...i }))
      const totais = calcularTotaisItens(itens)
      return { id: tipo.id, nome: tipo.nome, itens, totais, totalItens: itens.length }
    })
    return {
      data,
      refeicoes,
      totais:                   calcularTotaisItens(refeicoes.map(r => r.totais)),
      totalItens:               refeicoes.reduce((s, r) => s + r.totalItens, 0),
      totalRefeicoesRegistradas: refeicoes.filter(r => r.totalItens > 0).length,
    }
  }

  function calcularDistribuicaoMacros(t) {
    const cals  = { c: t.carboidratos * 4, p: t.proteinas * 4, g: t.gorduras * 9 }
    const total = cals.c + cals.p + cals.g
    return {
      carboidratos: total > 0 ? (cals.c / total) * 100 : 0,
      proteinas:    total > 0 ? (cals.p / total) * 100 : 0,
      gorduras:     total > 0 ? (cals.g / total) * 100 : 0,
    }
  }

  function calcularMetricasMacros(dias, metas, total) {
    return [
      { chave: 'carboidratos', nome: 'Carboidratos', unidade: 'g'    },
      { chave: 'proteinas',    nome: 'Proteínas',    unidade: 'g'    },
      { chave: 'gorduras',     nome: 'Gorduras',     unidade: 'g'    },
      { chave: 'calorias',     nome: 'Calorias',     unidade: 'kcal' },
    ].map(cfg => {
      const consumidoTotal  = dias.reduce((s, d) => s + (d.totais[cfg.chave] || 0), 0)
      const metaDiaria      = metas[cfg.chave] || 0
      const metaTotal       = metaDiaria * total
      const mediaConsumida  = total ? consumidoTotal / total : 0
      const diasDentroMeta  = metaDiaria > 0
        ? dias.filter(d => { const v = d.totais[cfg.chave] || 0; return v >= metaDiaria * 0.9 && v <= metaDiaria * 1.1 }).length
        : 0
      return {
        ...cfg, consumidoTotal, mediaConsumida, metaDiaria, metaTotal,
        diferencaMedia:           mediaConsumida - metaDiaria,
        percentualMeta:           metaTotal > 0 ? (consumidoTotal / metaTotal) * 100 : 0,
        diasDentroMeta,
        percentualDiasDentroMeta: metaDiaria > 0 && total > 0 ? (diasDentroMeta / total) * 100 : 0,
      }
    })
  }

  function calcularMetricasConsistencia(dias, metas, total) {
    const diasComRegistro = dias.filter(d => d.totalItens > 0).length
    const refReg          = dias.reduce((s, d) => s + d.totalRefeicoesRegistradas, 0)
    const refPoss         = total * tiposRefeicao.value.length
    const diasTres        = dias.filter(d => d.totalRefeicoesRegistradas >= 3).length
    const diasMetaCal     = metas.calorias > 0
      ? dias.filter(d => d.totais.calorias >= metas.calorias * 0.9 && d.totais.calorias <= metas.calorias * 1.1).length
      : 0
    const mm              = calcularMetricasMacros(dias, metas, total).filter(m => m.metaDiaria > 0)
    const aderencia       = mm.length
      ? mm.reduce((s, m) => s + Math.min(m.percentualMeta, 100), 0) / mm.length
      : 0
    return {
      diasComRegistro,
      percentualDiasComRegistro:          total > 0 ? (diasComRegistro / total) * 100 : 0,
      refeicoesRegistradas:               refReg,
      refeicoesPossiveis:                 refPoss,
      percentualRefeicoesRegistradas:     refPoss > 0 ? (refReg / refPoss) * 100 : 0,
      mediaRefeicoesPorDia:               total > 0 ? refReg / total : 0,
      diasComTresOuMaisRefeicoes:         diasTres,
      percentualDiasComTresOuMaisRefeicoes: total > 0 ? (diasTres / total) * 100 : 0,
      diasDentroMetaCalorica:             diasMetaCal,
      percentualDiasDentroMetaCalorica:   metas.calorias > 0 && total > 0 ? (diasMetaCal / total) * 100 : 0,
      metaCaloricaDefinida:               metas.calorias > 0,
      aderenciaMediaMacros:               aderencia,
    }
  }

  return {
    // State
    metasDiarias, refeicoesPorData, tmbPerfil, tiposRefeicao, templatesRefeicao, dataAtual,
    // Init
    init, resetarDadosUsuario, salvar,
    // Food (via food store)
    adicionarAlimento, atualizarAlimento, removerAlimento, alternarFavorito, registrarHistoricoAlimento, criarItemRefeicao,
    // Meal CRUD
    adicionarRefeicao, removerItem, moverItem, atualizarItemRefeicao, repetirRefeicao,
    // Meal type
    adicionarTipoRefeicao, removerTipoRefeicao, reordenarTiposRefeicao,
    // Templates
    adicionarTemplate, removerTemplate, aplicarTemplateNoDia,
    // Goals & BMR
    atualizarMetasDiarias, atualizarTmbPerfil,
    // Helpers
    normalizarRefeicaoId, getRefeicoesDoDia, getItensDoDia, getQuantidadeItensDia, getItemRefeicao,
    // Reports
    gerarRelatorio,
  }
})

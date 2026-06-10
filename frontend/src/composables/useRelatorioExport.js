// Exportação de relatórios em CSV e Excel (.xlsx).
//
// Recebe o objeto `relatorio` produzido por trackerStore.gerarRelatorio() e gera:
//   - CSV: arquivo único com blocos por seção (Resumo, Refeições, Detalhe por dia),
//     separador ";" e decimal "," (compatível com Excel pt-BR), com BOM UTF-8.
//   - XLSX: planilha pré-pronta com 3 abas estilizadas (ExcelJS, importado sob demanda).
//
// Cores por macro seguem o design system (ver CLAUDE.md).

import { dataLocalISO } from './datas.js'

const COR_PRIMARY = '1D6B57' // verde marca (cabeçalhos)
const COR_HEADER_TXT = 'FFFFFF'
const COR_ZEBRA = 'F3F4F6'
const COR_CARBS = '2563EB'
const COR_PROT = '1D6B57'
const COR_GORD = 'B76617'
const COR_KCAL = 'D9822B'

// ── Helpers de número/string ──────────────────────────────────────────────────

function r0(v) { return Math.round(Number(v) || 0) }
function r1(v) { return Math.round((Number(v) || 0) * 10) / 10 }

// Número → string pt-BR (decimal vírgula), para o CSV.
function ptNum(v, dec = 0) {
  const n = Number(v) || 0
  return n.toFixed(dec).replace('.', ',')
}

function periodoLabel(relatorio) {
  if (!relatorio.datas.length) return ''
  const ini = relatorio.datas[0]
  const fim = relatorio.datas[relatorio.datas.length - 1]
  return ini === fim ? ini : `${ini} até ${fim}`
}

function nomeArquivo(relatorio, ext) {
  const hoje = dataLocalISO()
  return `relatorio-macros_${hoje}.${ext}`
}

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── CSV ────────────────────────────────────────────────────────────────────────

function csvCampo(v) {
  const s = String(v ?? '')
  // Aspas se contiver separador, aspas ou quebra de linha.
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function linhaCsv(campos) {
  return campos.map(csvCampo).join(';')
}

export function exportarRelatorioCsv(relatorio) {
  if (!relatorio) return
  const L = []

  // Cabeçalho do documento
  L.push(linhaCsv(['Relatório de Macronutrientes']))
  L.push(linhaCsv(['Período', periodoLabel(relatorio)]))
  L.push(linhaCsv(['Total de dias', relatorio.totalDias]))
  L.push(linhaCsv(['Total de itens', relatorio.totalItens]))
  L.push(linhaCsv(['Gerado em', new Date(relatorio.geradoEm).toLocaleString('pt-BR')]))
  L.push('')

  // Seção: Consistência
  const c = relatorio.metricasConsistencia
  L.push(linhaCsv(['=== CONSISTÊNCIA ===']))
  L.push(linhaCsv(['Métrica', 'Valor', '%']))
  L.push(linhaCsv(['Dias com registro', `${c.diasComRegistro} / ${relatorio.totalDias}`, ptNum(c.percentualDiasComRegistro)]))
  L.push(linhaCsv(['Refeições registradas', c.refeicoesRegistradas, `${ptNum(c.mediaRefeicoesPorDia, 1)}/dia`]))
  L.push(linhaCsv(['Dias com 3+ refeições', c.diasComTresOuMaisRefeicoes, ptNum(c.percentualDiasComTresOuMaisRefeicoes)]))
  L.push(linhaCsv(['Dias na meta calórica', c.diasDentroMetaCalorica, ptNum(c.percentualDiasDentroMetaCalorica)]))
  L.push(linhaCsv(['Aderência média aos macros', `${ptNum(c.aderenciaMediaMacros)}%`, '']))
  L.push('')

  // Seção: Macronutrientes
  L.push(linhaCsv(['=== MACRONUTRIENTES ===']))
  L.push(linhaCsv(['Macro', 'Total', 'Média/dia', 'Meta/dia', 'Diferença/dia', 'Aderência %', 'Dias na meta']))
  for (const m of relatorio.metricasMacros) {
    const temMeta = m.metaDiaria > 0
    L.push(linhaCsv([
      m.nome,
      `${ptNum(m.consumidoTotal)} ${m.unidade}`,
      `${ptNum(m.mediaConsumida, 1)} ${m.unidade}`,
      temMeta ? `${ptNum(m.metaDiaria)} ${m.unidade}` : '—',
      temMeta ? `${m.diferencaMedia >= 0 ? '+' : ''}${ptNum(m.diferencaMedia, 1)} ${m.unidade}` : '—',
      temMeta ? ptNum(m.percentualMeta) : '—',
      temMeta ? `${m.diasDentroMeta} de ${relatorio.totalDias}` : '—',
    ]))
  }
  L.push('')

  // Seção: Refeições
  L.push(linhaCsv(['=== REFEIÇÕES ===']))
  L.push(linhaCsv(['Refeição', 'Dias com registro', 'Itens', 'Calorias (kcal)', 'Carbs (g)', 'Proteínas (g)', 'Gorduras (g)']))
  for (const ref of relatorio.refeicoesResumo) {
    L.push(linhaCsv([
      ref.nome, ref.diasComRegistro, ref.totalItens,
      ptNum(ref.totais.calorias), ptNum(ref.totais.carboidratos),
      ptNum(ref.totais.proteinas), ptNum(ref.totais.gorduras),
    ]))
  }
  L.push('')

  // Seção: Detalhe por dia (uma linha por item)
  L.push(linhaCsv(['=== DETALHE POR DIA ===']))
  L.push(linhaCsv(['Data', 'Refeição', 'Alimento', 'Qtd (g)', 'Carbs (g)', 'Proteínas (g)', 'Gorduras (g)', 'Calorias (kcal)']))
  for (const dia of relatorio.dias) {
    if (dia.totalItens === 0) {
      L.push(linhaCsv([dia.data, '—', 'Sem registros neste dia.', '', '', '', '', '']))
      continue
    }
    for (const ref of dia.refeicoes) {
      for (const item of ref.itens) {
        L.push(linhaCsv([
          dia.data, ref.nome, item.nome,
          ptNum(item.quantidade), ptNum(item.carboidratos),
          ptNum(item.proteinas), ptNum(item.gorduras), ptNum(item.calorias),
        ]))
      }
    }
  }

  const conteudo = '﻿' + L.join('\r\n') // BOM para acentos no Excel
  baixarBlob(new Blob([conteudo], { type: 'text/csv;charset=utf-8;' }), nomeArquivo(relatorio, 'csv'))
}

// ── XLSX (ExcelJS) ───────────────────────────────────────────────────────────

function estilizarCabecalho(row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: COR_HEADER_TXT }, size: 11 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_PRIMARY } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'D0D5DD' } } }
  })
  row.height = 20
}

function aplicarZebra(ws, primeiraLinhaDados, ultimaLinhaDados) {
  for (let i = primeiraLinhaDados; i <= ultimaLinhaDados; i++) {
    if ((i - primeiraLinhaDados) % 2 === 1) {
      ws.getRow(i).eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_ZEBRA } }
      })
    }
  }
}

export async function exportarRelatorioXlsx(relatorio) {
  if (!relatorio) return
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Tracker de Macronutrientes'
  wb.created = new Date()

  const NUM = '#,##0'
  const NUM1 = '#,##0.0'

  // ── Aba 1: Resumo ─────────────────────────────────────────────────────────
  const wsResumo = wb.addWorksheet('Resumo', { views: [{ state: 'frozen', ySplit: 1 }] })
  wsResumo.columns = [
    { width: 32 }, { width: 18 }, { width: 16 }, { width: 16 },
    { width: 16 }, { width: 14 }, { width: 16 },
  ]

  // Título do documento
  wsResumo.mergeCells('A1:G1')
  const titulo = wsResumo.getCell('A1')
  titulo.value = 'Relatório de Macronutrientes'
  titulo.font = { bold: true, size: 16, color: { argb: COR_PRIMARY } }
  titulo.alignment = { vertical: 'middle' }
  wsResumo.getRow(1).height = 26

  wsResumo.addRow([`Período: ${periodoLabel(relatorio)}`])
  wsResumo.addRow([`Total de dias: ${relatorio.totalDias}    |    Total de itens: ${relatorio.totalItens}`])
  wsResumo.addRow([`Gerado em: ${new Date(relatorio.geradoEm).toLocaleString('pt-BR')}`])
  wsResumo.addRow([])

  // Consistência
  const c = relatorio.metricasConsistencia
  const hConsist = wsResumo.addRow(['Consistência'])
  hConsist.getCell(1).font = { bold: true, size: 12, color: { argb: COR_PRIMARY } }
  const hcMet = wsResumo.addRow(['Métrica', 'Valor', '%'])
  estilizarCabecalho(hcMet)
  const consistRows = [
    ['Dias com registro', `${c.diasComRegistro} / ${relatorio.totalDias}`, r0(c.percentualDiasComRegistro)],
    ['Refeições registradas', c.refeicoesRegistradas, `${r1(c.mediaRefeicoesPorDia)}/dia`],
    ['Dias com 3+ refeições', c.diasComTresOuMaisRefeicoes, r0(c.percentualDiasComTresOuMaisRefeicoes)],
    ['Dias na meta calórica', c.diasDentroMetaCalorica, r0(c.percentualDiasDentroMetaCalorica)],
    ['Aderência média aos macros', `${r0(c.aderenciaMediaMacros)}%`, ''],
  ]
  const consistIni = wsResumo.rowCount + 1
  consistRows.forEach(r => wsResumo.addRow(r))
  aplicarZebra(wsResumo, consistIni, wsResumo.rowCount)
  wsResumo.addRow([])

  // Macronutrientes
  const hMacro = wsResumo.addRow(['Macronutrientes'])
  hMacro.getCell(1).font = { bold: true, size: 12, color: { argb: COR_PRIMARY } }
  const hmCab = wsResumo.addRow(['Macro', 'Total', 'Média/dia', 'Meta/dia', 'Diferença/dia', 'Aderência %', 'Dias na meta'])
  estilizarCabecalho(hmCab)
  const corMacro = { carboidratos: COR_CARBS, proteinas: COR_PROT, gorduras: COR_GORD, calorias: COR_KCAL }
  const macroIni = wsResumo.rowCount + 1
  for (const m of relatorio.metricasMacros) {
    const temMeta = m.metaDiaria > 0
    const row = wsResumo.addRow([
      m.nome,
      r0(m.consumidoTotal),
      r1(m.mediaConsumida),
      temMeta ? r0(m.metaDiaria) : '—',
      temMeta ? r1(m.diferencaMedia) : '—',
      temMeta ? r0(m.percentualMeta) : '—',
      temMeta ? `${m.diasDentroMeta} de ${relatorio.totalDias}` : '—',
    ])
    row.getCell(1).font = { bold: true, color: { argb: corMacro[m.chave] || '1D2939' } }
    row.getCell(2).numFmt = NUM
    row.getCell(3).numFmt = NUM1
    if (temMeta) {
      row.getCell(4).numFmt = NUM
      row.getCell(5).numFmt = NUM1
      row.getCell(6).numFmt = NUM
    }
  }
  aplicarZebra(wsResumo, macroIni, wsResumo.rowCount)

  // ── Aba 2: Refeições ──────────────────────────────────────────────────────
  const wsRef = wb.addWorksheet('Refeições', { views: [{ state: 'frozen', ySplit: 1 }] })
  wsRef.columns = [
    { header: 'Refeição', key: 'nome', width: 22 },
    { header: 'Dias com registro', key: 'dias', width: 18 },
    { header: 'Itens', key: 'itens', width: 10 },
    { header: 'Calorias (kcal)', key: 'kcal', width: 16 },
    { header: 'Carbs (g)', key: 'c', width: 12 },
    { header: 'Proteínas (g)', key: 'p', width: 14 },
    { header: 'Gorduras (g)', key: 'g', width: 14 },
  ]
  estilizarCabecalho(wsRef.getRow(1))
  const refIni = 2
  for (const ref of relatorio.refeicoesResumo) {
    const row = wsRef.addRow({
      nome: ref.nome, dias: ref.diasComRegistro, itens: ref.totalItens,
      kcal: r0(ref.totais.calorias), c: r0(ref.totais.carboidratos),
      p: r0(ref.totais.proteinas), g: r0(ref.totais.gorduras),
    })
    row.getCell('nome').font = { bold: true }
    ;['kcal', 'c', 'p', 'g'].forEach(k => { row.getCell(k).numFmt = NUM })
  }
  aplicarZebra(wsRef, refIni, wsRef.rowCount)

  // ── Aba 3: Detalhe por dia ────────────────────────────────────────────────
  const wsDet = wb.addWorksheet('Detalhe por dia', { views: [{ state: 'frozen', ySplit: 1 }] })
  wsDet.columns = [
    { header: 'Data', key: 'data', width: 13 },
    { header: 'Refeição', key: 'ref', width: 18 },
    { header: 'Alimento', key: 'alimento', width: 30 },
    { header: 'Qtd (g)', key: 'qtd', width: 10 },
    { header: 'Carbs (g)', key: 'c', width: 11 },
    { header: 'Proteínas (g)', key: 'p', width: 13 },
    { header: 'Gorduras (g)', key: 'g', width: 13 },
    { header: 'Calorias (kcal)', key: 'kcal', width: 15 },
  ]
  estilizarCabecalho(wsDet.getRow(1))
  const detIni = 2
  for (const dia of relatorio.dias) {
    if (dia.totalItens === 0) {
      wsDet.addRow({ data: dia.data, ref: '—', alimento: 'Sem registros neste dia.' })
      continue
    }
    for (const ref of dia.refeicoes) {
      for (const item of ref.itens) {
        const row = wsDet.addRow({
          data: dia.data, ref: ref.nome, alimento: item.nome,
          qtd: r0(item.quantidade), c: r0(item.carboidratos),
          p: r0(item.proteinas), g: r0(item.gorduras), kcal: r0(item.calorias),
        })
        ;['qtd', 'c', 'p', 'g', 'kcal'].forEach(k => { row.getCell(k).numFmt = NUM })
      }
    }
  }
  aplicarZebra(wsDet, detIni, wsDet.rowCount)

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  baixarBlob(blob, nomeArquivo(relatorio, 'xlsx'))
}

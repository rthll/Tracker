// Datas de calendário no fuso horário local (YYYY-MM-DD).
// Nunca usar toISOString() para "hoje": ele converte para UTC e, no Brasil
// (UTC-3), a partir das 21h devolve a data do dia seguinte.

export function dataLocalISO(d = new Date()) {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function somarDias(dataISO, delta) {
  const [ano, mes, dia] = String(dataISO).split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  d.setDate(d.getDate() + delta)
  return dataLocalISO(d)
}

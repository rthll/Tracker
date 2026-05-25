const fs = require("fs");
const path = require("path");

const raizProjeto = path.resolve(__dirname, "..");
const arquivoEntrada = path.join(raizProjeto, "data", "Taco-4a-Edicao(CMVCol taco3).csv");
const arquivoSaida = path.join(raizProjeto, "data", "taco-alimentos.js");

function parseNumero(valor) {
  const texto = String(valor || "").trim();

  if (!texto || /^NA$/i.test(texto) || /^Tr$/i.test(texto)) {
    return 0;
  }

  const numero = Number.parseFloat(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(texto) {
  return String(texto || "").trim().replace(/\s+/g, " ");
}

function converterLinha(linha) {
  const colunas = linha.split(";");

  if (!/^\d+$/.test(colunas[0]) || !normalizarTexto(colunas[1])) {
    return null;
  }

  return {
    id: `taco:${colunas[0]}`,
    tacoId: Number.parseInt(colunas[0], 10),
    nome: normalizarTexto(colunas[1]),
    carboidratos: parseNumero(colunas[8]),
    proteinas: parseNumero(colunas[5]),
    gorduras: parseNumero(colunas[6]),
    calorias: parseNumero(colunas[3]),
    fibra: parseNumero(colunas[9]),
    origem: "TACO",
    personalizado: false
  };
}

function main() {
  if (!fs.existsSync(arquivoEntrada)) {
    throw new Error(`Arquivo de entrada nao encontrado: ${arquivoEntrada}`);
  }

  const conteudo = fs.readFileSync(arquivoEntrada, "latin1");
  const alimentos = conteudo
    .split(/\r?\n/)
    .map(converterLinha)
    .filter(Boolean);

  const conteudoSaida = `// Gerado por scripts/converter-taco.js a partir da TACO 4a Edicao.\n// Valores nutricionais por 100g.\nwindow.TACO_ALIMENTOS = ${JSON.stringify(alimentos, null, 2)};\n`;

  fs.writeFileSync(arquivoSaida, conteudoSaida, "utf8");
  console.log(`Convertidos ${alimentos.length} alimentos para ${path.relative(raizProjeto, arquivoSaida)}`);
}

main();

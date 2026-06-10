// Sanitizacao e validacao dos payloads do tracker antes de gravar no Firestore.
// Estrategia: coercao silenciosa para valores fora do formato (igual ao frontend),
// erro 400 apenas para problemas estruturais (data invalida, body que nao e objeto).

const MAX_NAME_LENGTH = 200;
const MAX_ID_LENGTH = 120;
const MAX_FAVORITES = 300;
const MAX_HISTORY = 300;
const MAX_MEAL_TYPES = 30;
const MAX_ENTRIES_PER_MEAL = 300;
const MAX_DAYS = 4000;
const MAX_CUSTOM_FOODS = 1000;
const MAX_TEMPLATES = 200;
const MAX_TEMPLATE_ITEMS = 100;
const MAX_NUMBER = 1_000_000;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SEXOS = ["masculino", "feminino", ""];
const OBJETIVOS = ["manter", "perder", "ganhar"];
const EQUACOES_TMB = ["mifflin", "katch"];

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeNumber(value) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.min(Math.max(number, 0), MAX_NUMBER);
}

function sanitizeString(value, maxLength = MAX_NAME_LENGTH) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function sanitizeId(value) {
  return sanitizeString(value, MAX_ID_LENGTH);
}

function sanitizeStringArray(value, maxItems) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .slice(0, maxItems)
    .map((item) => sanitizeId(item))
    .filter(Boolean);
}

export function assertValidDate(date) {
  const value = String(date || "");
  if (!DATE_REGEX.test(value) || Number.isNaN(Date.parse(value))) {
    throw createHttpError("Data invalida. Use o formato YYYY-MM-DD.", 400);
  }
  return value;
}

export function sanitizeMetas(metas) {
  return {
    carboidratos: sanitizeNumber(metas?.carboidratos),
    proteinas: sanitizeNumber(metas?.proteinas),
    gorduras: sanitizeNumber(metas?.gorduras),
    calorias: sanitizeNumber(metas?.calorias)
  };
}

export function sanitizeTmbPerfil(perfil) {
  return {
    sexo: SEXOS.includes(perfil?.sexo) ? perfil.sexo : "",
    objetivo: OBJETIVOS.includes(perfil?.objetivo) ? perfil.objetivo : "manter",
    equacao: EQUACOES_TMB.includes(perfil?.equacao) ? perfil.equacao : "mifflin",
    peso: sanitizeNumber(perfil?.peso),
    altura: sanitizeNumber(perfil?.altura),
    idade: sanitizeNumber(perfil?.idade),
    gorduraCorporal: Math.min(sanitizeNumber(perfil?.gorduraCorporal), 100),
    resultado: sanitizeNumber(perfil?.resultado),
    macros: {
      proteinas: sanitizeNumber(perfil?.macros?.proteinas),
      gorduras: sanitizeNumber(perfil?.macros?.gorduras),
      carboidratos: sanitizeNumber(perfil?.macros?.carboidratos)
    }
  };
}

function sanitizeEntry(entry) {
  return {
    id: sanitizeId(entry?.id),
    alimentoId: entry?.alimentoId ? sanitizeId(entry.alimentoId) : null,
    nome: sanitizeString(entry?.nome),
    quantidade: sanitizeNumber(entry?.quantidade),
    carboidratos: sanitizeNumber(entry?.carboidratos),
    proteinas: sanitizeNumber(entry?.proteinas),
    gorduras: sanitizeNumber(entry?.gorduras),
    calorias: sanitizeNumber(entry?.calorias)
  };
}

export function sanitizeDayMeals(dayMeals) {
  if (!dayMeals || typeof dayMeals !== "object" || Array.isArray(dayMeals)) {
    return {};
  }

  return Object.entries(dayMeals)
    .slice(0, MAX_MEAL_TYPES)
    .reduce((result, [refeicaoId, entries]) => {
      const id = sanitizeId(refeicaoId);
      if (!id) {
        return result;
      }
      result[id] = Array.isArray(entries)
        ? entries.slice(0, MAX_ENTRIES_PER_MEAL).map(sanitizeEntry)
        : [];
      return result;
    }, {});
}

export function sanitizeCustomFood(alimento) {
  if (!alimento || typeof alimento !== "object") {
    return null;
  }

  const id = sanitizeId(alimento.id);
  if (!id) {
    return null;
  }

  return {
    id,
    personalizado: true,
    origem: "Personalizado",
    nome: sanitizeString(alimento.nome),
    carboidratos: sanitizeNumber(alimento.carboidratos),
    proteinas: sanitizeNumber(alimento.proteinas),
    gorduras: sanitizeNumber(alimento.gorduras),
    calorias: sanitizeNumber(alimento.calorias),
    fibra: sanitizeNumber(alimento.fibra),
    criadoEm: sanitizeString(alimento.criadoEm, 40)
  };
}

export function sanitizeTemplates(templates) {
  if (!Array.isArray(templates)) {
    return [];
  }

  return templates
    .slice(0, MAX_TEMPLATES)
    .map((template) => ({
      id: sanitizeId(template?.id),
      nome: sanitizeString(template?.nome),
      itens: Array.isArray(template?.itens)
        ? template.itens.slice(0, MAX_TEMPLATE_ITEMS).map(sanitizeEntry)
        : []
    }))
    .filter((template) => template.id);
}

export function sanitizeTiposRefeicao(tipos) {
  if (!Array.isArray(tipos)) {
    return [];
  }

  return tipos
    .slice(0, MAX_MEAL_TYPES)
    .map((tipo) => ({
      id: sanitizeId(tipo?.id),
      nome: sanitizeString(tipo?.nome)
    }))
    .filter((tipo) => tipo.id && tipo.nome);
}

export function sanitizeUserMeta(data) {
  return {
    favoritos: sanitizeStringArray(data?.favoritos, MAX_FAVORITES),
    historicoAlimentos: sanitizeStringArray(data?.historicoAlimentos, MAX_HISTORY),
    tiposRefeicao: sanitizeTiposRefeicao(data?.tiposRefeicao)
  };
}

export function sanitizeFullState(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw createHttpError("Payload invalido.", 400);
  }

  const refeicoesPorData = {};
  if (data.refeicoesPorData && typeof data.refeicoesPorData === "object" && !Array.isArray(data.refeicoesPorData)) {
    Object.entries(data.refeicoesPorData)
      .slice(0, MAX_DAYS)
      .forEach(([date, dayMeals]) => {
        refeicoesPorData[assertValidDate(date)] = sanitizeDayMeals(dayMeals);
      });
  }

  const alimentosPersonalizados = Array.isArray(data.alimentosPersonalizados)
    ? data.alimentosPersonalizados
      .slice(0, MAX_CUSTOM_FOODS)
      .map(sanitizeCustomFood)
      .filter(Boolean)
    : [];

  return {
    ...sanitizeUserMeta(data),
    alimentosPersonalizados,
    refeicoesPorData,
    metasDiarias: sanitizeMetas(data.metasDiarias),
    tmbPerfil: sanitizeTmbPerfil(data.tmbPerfil),
    templatesRefeicao: sanitizeTemplates(data.templatesRefeicao)
  };
}

export function sanitizeChange(change) {
  if (!change || typeof change !== "object") {
    return null;
  }

  switch (change.tipo) {
    case "goals":
      return { tipo: "goals", metasDiarias: sanitizeMetas(change.metasDiarias) };
    case "bmr":
      return { tipo: "bmr", tmbPerfil: sanitizeTmbPerfil(change.tmbPerfil) };
    case "customFood": {
      const alimento = sanitizeCustomFood(change.alimento);
      if (!alimento) {
        throw createHttpError("Alimento invalido.", 400);
      }
      return { tipo: "customFood", alimento };
    }
    case "removeCustomFood": {
      const alimentoId = sanitizeId(change.alimentoId);
      if (!alimentoId) {
        throw createHttpError("Alimento invalido.", 400);
      }
      return { tipo: "removeCustomFood", alimentoId };
    }
    case "userMeta":
      return { tipo: "userMeta", ...sanitizeUserMeta(change) };
    case "day":
      return {
        tipo: "day",
        data: assertValidDate(change.data),
        refeicoesDoDia: sanitizeDayMeals(change.refeicoesDoDia)
      };
    case "templates":
      return { tipo: "templates", templatesRefeicao: sanitizeTemplates(change.templatesRefeicao) };
    default:
      return null;
  }
}

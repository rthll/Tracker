import { db, fieldValue } from "../config/firebase-admin.js";

function getUserStateRef(userId) {
  return db.doc(`users/${userId}/tracker/state`);
}

function getUserRef(userId) {
  return db.doc(`users/${userId}`);
}

function getCustomFoodsRef(userId) {
  return db.collection(`users/${userId}/customFoods`);
}

function getTemplatesRef(userId) {
  return db.collection(`users/${userId}/templates`);
}

function getDaysRef(userId) {
  return db.collection(`users/${userId}/days`);
}

function getDayRef(userId, date) {
  return db.doc(`users/${userId}/days/${date}`);
}

function getEntriesRef(userId, date) {
  return db.collection(`users/${userId}/days/${date}/entries`);
}

function getGoalsRef(userId) {
  return db.doc(`users/${userId}/goals/current`);
}

function getBmrRef(userId) {
  return db.doc(`users/${userId}/bmr/profile`);
}

function getSafeDocId(id) {
  return String(id || crypto.randomUUID()).replace(/\//g, "_");
}

function getEmptyMeals() {
  return {
    cafe: [],
    almoco: [],
    jantar: [],
    lanches: []
  };
}

function getNumericValue(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function getTotals(items) {
  return items.reduce((totals, item) => {
    totals.carboidratos += getNumericValue(item.carboidratos);
    totals.proteinas += getNumericValue(item.proteinas);
    totals.gorduras += getNumericValue(item.gorduras);
    totals.calorias += getNumericValue(item.calorias);
    return totals;
  }, {
    carboidratos: 0,
    proteinas: 0,
    gorduras: 0,
    calorias: 0
  });
}

function getDayEntries(dayMeals) {
  return Object.entries(dayMeals || {}).flatMap(([refeicaoId, entries]) => (
    Array.isArray(entries)
      ? entries.map((entry, index) => ({
        ...entry,
        id: entry.id || getSafeDocId(`entry:${Date.now()}-${index}`),
        refeicaoId,
        order: index
      }))
      : []
  ));
}

function getDaySummary(date, dayMeals) {
  const entries = getDayEntries(dayMeals);
  const mealTotals = Object.entries(dayMeals || {}).reduce((totals, [refeicaoId, items]) => {
    totals[refeicaoId] = getTotals(Array.isArray(items) ? items : []);
    return totals;
  }, {});

  return {
    date,
    totals: getTotals(entries),
    mealTotals,
    entryCount: entries.length,
    updatedAt: fieldValue.serverTimestamp()
  };
}

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }

  return Object.entries(value).reduce((result, [key, entryValue]) => {
    if (entryValue !== undefined) {
      result[key] = stripUndefined(entryValue);
    }
    return result;
  }, {});
}

async function syncCollection(collectionRef, nextItems, getId, mapData) {
  const snapshot = await collectionRef.get();
  const nextIds = new Set(nextItems.map(getId));
  const batch = db.batch();

  snapshot.docs.forEach((documentSnapshot) => {
    if (!nextIds.has(documentSnapshot.id)) {
      batch.delete(documentSnapshot.ref);
    }
  });

  nextItems.forEach((item) => {
    const id = getId(item);
    batch.set(collectionRef.doc(id), stripUndefined(mapData(item)), { merge: true });
  });

  await batch.commit();
}

async function loadLegacyState(userId) {
  const snapshot = await getUserStateRef(userId).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function loadStructuredState(userId) {
  const [userSnapshot, goalsSnapshot, bmrSnapshot, customFoodsSnapshot, daysSnapshot, templatesSnapshot] = await Promise.all([
    getUserRef(userId).get(),
    getGoalsRef(userId).get(),
    getBmrRef(userId).get(),
    getCustomFoodsRef(userId).get(),
    getDaysRef(userId).get(),
    getTemplatesRef(userId).get()
  ]);

  const refeicoesPorData = {};
  await Promise.all(daysSnapshot.docs.map(async (dayDocument) => {
    const entriesSnapshot = await getEntriesRef(userId, dayDocument.id).get();
    const dayMeals = getEmptyMeals();

    entriesSnapshot.docs
      .map((entryDocument) => ({
        documentId: entryDocument.id,
        ...entryDocument.data()
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((entry) => {
        const refeicaoId = entry.refeicaoId || "almoco";
        if (!dayMeals[refeicaoId]) {
          dayMeals[refeicaoId] = [];
        }
        dayMeals[refeicaoId].push({
          id: entry.id || entry.documentId,
          alimentoId: entry.alimentoId || null,
          nome: entry.nome || "",
          quantidade: getNumericValue(entry.quantidade),
          carboidratos: getNumericValue(entry.carboidratos),
          proteinas: getNumericValue(entry.proteinas),
          gorduras: getNumericValue(entry.gorduras),
          calorias: getNumericValue(entry.calorias)
        });
      });

    refeicoesPorData[dayDocument.id] = dayMeals;
  }));

  const hasStructuredData = goalsSnapshot.exists
    || bmrSnapshot.exists
    || customFoodsSnapshot.size > 0
    || daysSnapshot.size > 0
    || userSnapshot.exists
    || templatesSnapshot.size > 0;

  if (!hasStructuredData) {
    return null;
  }

  const userData = userSnapshot.exists ? userSnapshot.data() : {};

  return {
    alimentosPersonalizados: customFoodsSnapshot.docs.map((documentSnapshot) => ({
      id: documentSnapshot.id,
      ...documentSnapshot.data()
    })),
    refeicoesPorData,
    favoritos: Array.isArray(userData.favoritos) ? userData.favoritos : [],
    historicoAlimentos: Array.isArray(userData.historicoAlimentos) ? userData.historicoAlimentos : [],
    metasDiarias: goalsSnapshot.exists ? goalsSnapshot.data() : null,
    tmbPerfil: bmrSnapshot.exists ? bmrSnapshot.data() : null,
    templatesRefeicao: templatesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    tiposRefeicao: Array.isArray(userData.tiposRefeicao) && userData.tiposRefeicao.length
      ? userData.tiposRefeicao
      : null
  };
}

export async function loadUserData(userId) {
  const structuredState = await loadStructuredState(userId);
  return structuredState || loadLegacyState(userId);
}

export async function saveStructuredState(userId, data) {
  const customFoods = Array.isArray(data.alimentosPersonalizados) ? data.alimentosPersonalizados : [];
  const refeicoesPorData = data.refeicoesPorData && typeof data.refeicoesPorData === "object"
    ? data.refeicoesPorData
    : {};

  await setUserMeta(userId, data);

  await Promise.all([
    setGoals(userId, data.metasDiarias || {}),
    setBmrProfile(userId, data.tmbPerfil || {}),
    syncCollection(
      getCustomFoodsRef(userId),
      customFoods,
      (food) => getSafeDocId(food.id),
      (food) => ({
        ...food,
        id: getSafeDocId(food.id),
        updatedAt: fieldValue.serverTimestamp()
      })
    ),
    setTemplates(userId, data.templatesRefeicao || [])
  ]);

  const daysSnapshot = await getDaysRef(userId).get();
  const nextDates = new Set(Object.keys(refeicoesPorData));
  await Promise.all(daysSnapshot.docs.map(async (dayDocument) => {
    if (!nextDates.has(dayDocument.id)) {
      const entriesSnapshot = await getEntriesRef(userId, dayDocument.id).get();
      const batch = db.batch();
      entriesSnapshot.docs.forEach((entryDocument) => batch.delete(entryDocument.ref));
      batch.delete(dayDocument.ref);
      await batch.commit();
    }
  }));

  await Promise.all(Object.entries(refeicoesPorData).map(([date, dayMeals]) => setDay(userId, date, dayMeals)));
}

export async function setUserMeta(userId, data) {
  const payload = {
    favoritos: Array.isArray(data.favoritos) ? data.favoritos : [],
    historicoAlimentos: Array.isArray(data.historicoAlimentos) ? data.historicoAlimentos : [],
    updatedAt: fieldValue.serverTimestamp()
  };
  if (Array.isArray(data.tiposRefeicao) && data.tiposRefeicao.length) {
    payload.tiposRefeicao = data.tiposRefeicao;
  }
  await getUserRef(userId).set(payload, { merge: true });
}

export async function setGoals(userId, metasDiarias) {
  await getGoalsRef(userId).set({
    ...(metasDiarias || {}),
    updatedAt: fieldValue.serverTimestamp()
  }, { merge: true });
}

export async function setBmrProfile(userId, tmbPerfil) {
  await getBmrRef(userId).set({
    ...(tmbPerfil || {}),
    updatedAt: fieldValue.serverTimestamp()
  }, { merge: true });
}

export async function setTemplates(userId, templates) {
  const templatesList = Array.isArray(templates) ? templates : [];
  await syncCollection(
    getTemplatesRef(userId),
    templatesList,
    (t) => getSafeDocId(t.id),
    (t) => ({ ...t, id: getSafeDocId(t.id), updatedAt: fieldValue.serverTimestamp() })
  );
}

export async function setCustomFood(userId, alimento) {
  if (!alimento || !alimento.id) {
    return;
  }

  await getCustomFoodsRef(userId).doc(getSafeDocId(alimento.id)).set(stripUndefined({
    ...alimento,
    id: getSafeDocId(alimento.id),
    updatedAt: fieldValue.serverTimestamp()
  }), { merge: true });
}

export async function setDay(userId, date, dayMeals) {
  if (!date || !dayMeals) {
    return;
  }

  await getDayRef(userId, date).set(getDaySummary(date, dayMeals), { merge: true });

  const entries = getDayEntries(dayMeals);
  await syncCollection(
    getEntriesRef(userId, date),
    entries,
    (entry) => getSafeDocId(entry.id),
    (entry) => ({
      ...entry,
      id: getSafeDocId(entry.id),
      updatedAt: fieldValue.serverTimestamp()
    })
  );
}

export async function applyIncrementalChange(userId, change, fullData) {
  switch (change && change.tipo) {
    case "goals":
      return setGoals(userId, change.metasDiarias);
    case "bmr":
      return setBmrProfile(userId, change.tmbPerfil);
    case "customFood":
      return setCustomFood(userId, change.alimento);
    case "userMeta":
      return setUserMeta(userId, change);
    case "day":
      return setDay(userId, change.data, change.refeicoesDoDia);
    case "templates":
      return setTemplates(userId, change.templatesRefeicao);
    default:
      return saveStructuredState(userId, fullData);
  }
}

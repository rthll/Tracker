import {
  applyIncrementalChange,
  loadUserData,
  saveStructuredState
} from "../services/tracker-data.service.js";
import {
  sanitizeChange,
  sanitizeFullState
} from "../services/tracker-validation.service.js";

export async function getTrackerState(request, response, next) {
  try {
    const data = await loadUserData(request.user.uid);
    response.json(data || null);
  } catch (error) {
    next(error);
  }
}

export async function putTrackerState(request, response, next) {
  try {
    await saveStructuredState(request.user.uid, sanitizeFullState(request.body));
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function patchTrackerChange(request, response, next) {
  try {
    const change = sanitizeChange(request.body && request.body.change);
    // Change desconhecido ou ausente cai no full save — sanitizado da mesma forma
    const fullData = change ? null : sanitizeFullState(request.body && request.body.fullData);
    await applyIncrementalChange(request.user.uid, change, fullData);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

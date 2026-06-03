import {
  applyIncrementalChange,
  loadUserData,
  saveStructuredState
} from "../services/tracker-data.service.js";

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
    await saveStructuredState(request.user.uid, request.body || {});
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function patchTrackerChange(request, response, next) {
  try {
    await applyIncrementalChange(
      request.user.uid,
      request.body && request.body.change,
      request.body && request.body.fullData
    );
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

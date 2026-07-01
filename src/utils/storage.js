// Local storage fallback — se usa cuando Sheets no está disponible

export function localGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function localSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const KEYS = {
  PROJECTS:   "nuwek_projects",
  ACTIVITIES: "nuwek_activities",
  PENDING:    "nuwek_pending",
};

// Cambios locales no confirmados por Sheets (sobreviven a recargas)
function getPending() {
  return localGet(KEYS.PENDING) || { activities: {}, projects: {} };
}

export function pendingAdd(entity, id, action, data = null) {
  const p = getPending();
  if (!p[entity]) p[entity] = {};
  p[entity][id] = { action, data };
  localSet(KEYS.PENDING, p);
}

export function pendingRemove(entity, id) {
  const p = getPending();
  if (p[entity]) delete p[entity][id];
  localSet(KEYS.PENDING, p);
}

// Aplica cambios pendientes encima de los datos que vienen de Sheets
export function applyPending(entity, items) {
  const changes = getPending()[entity] || {};
  let result = [...items];
  for (const [id, change] of Object.entries(changes)) {
    if (change.action === "delete") {
      result = result.filter(x => x.id !== id);
    } else if (change.action === "upsert" && change.data) {
      const idx = result.findIndex(x => x.id === id);
      if (idx >= 0) result[idx] = change.data;
      else result.push(change.data);
    }
  }
  return result;
}

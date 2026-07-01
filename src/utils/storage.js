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
  PROJECTS:    "nuwek_projects",
  ACTIVITIES:  "nuwek_activities",
};

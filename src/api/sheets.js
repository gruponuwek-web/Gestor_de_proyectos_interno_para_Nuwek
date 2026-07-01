import { SHEETS_URL } from "../constants";

async function withRetry(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === attempts - 1) throw e;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
}

async function sheetsGet(entity) {
  return withRetry(async () => {
    const res  = await fetch(`${SHEETS_URL}?entity=${entity}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  });
}

async function sheetsPost(entity, body) {
  return withRetry(async () => {
    const res  = await fetch(`${SHEETS_URL}?entity=${entity}&method=POST`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  });
}

async function sheetsDelete(entity, id) {
  return withRetry(async () => {
    const res  = await fetch(`${SHEETS_URL}?entity=${entity}&method=DELETE&id=${id}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  });
}

// ── Proyectos ─────────────────────────────────────────────────────────────────
export async function fetchProyectos() {
  return sheetsGet("proyectos");
}

export async function upsertProyecto(proj) {
  return sheetsPost("proyectos", proj);
}

export async function removeProyecto(id) {
  return sheetsDelete("proyectos", id);
}

// ── Actividades ───────────────────────────────────────────────────────────────
export async function fetchActividades() {
  return sheetsGet("actividades");
}

export async function upsertActividad(act) {
  return sheetsPost("actividades", act);
}

export async function removeActividad(id) {
  return sheetsDelete("actividades", id);
}

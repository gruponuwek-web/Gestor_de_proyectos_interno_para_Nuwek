import { SHEETS_URL } from "../constants";

async function sheetsGet(entity) {
  const res  = await fetch(`${SHEETS_URL}?entity=${entity}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function sheetsPost(entity, body) {
  const res  = await fetch(`${SHEETS_URL}?entity=${entity}&method=POST`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function sheetsDelete(entity, id) {
  const res  = await fetch(`${SHEETS_URL}?entity=${entity}&method=DELETE&id=${id}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
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

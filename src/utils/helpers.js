import { EVA_PHASES, SBOS_PHASES } from "../constants";

export function getPhasesForType(type) {
  return type === "EVA+"
    ? EVA_PHASES.map(n => ({ name: n, color: "#D97706" }))
    : SBOS_PHASES;
}

export function getPhaseColor(type, name) {
  if (type === "EVA+") return "#D97706";
  return SBOS_PHASES.find(s => s.name === name)?.color || "#6B7280";
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function expandRecurring(act) {
  if (!act.recurrence || act.recurrence === "No se repite") return [act];
  if (!act.date) return [act];
  const gap = { Semanal: 7, Quincenal: 14, Mensual: 30 }[act.recurrence] || 7;
  const count = parseInt(act.recurrenceCount) || 12;
  const excluded  = new Set(act.excludeDates   || []);
  const completed = new Set(act.completedDates || []);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(act.date);
    d.setDate(d.getDate() + i * gap);
    const date = d.toISOString().split("T")[0];
    if (excluded.has(date)) return null;
    // completedDates marca la ocurrencia; el status base "Completado" no debe heredarse a todas las ocurrencias
    const baseStatus = act.status === "Completado" ? "Pendiente" : act.status;
    const status = completed.has(date) ? "Completado" : baseStatus;
    return { ...act, id: `${act.id}_${i}`, date, isChild: i > 0, status };
  }).filter(Boolean);
}

export function getStatusColor(s) {
  return { "Completado": "#16A34A", "En progreso": "#2563EB", "Pendiente": "#D97706", "Reagendado": "#DC2626" }[s] || "#6B7280";
}

export function getStatusBg(s) {
  return { "Completado": "#DCFCE7", "En progreso": "#DBEAFE", "Pendiente": "#FEF9C3", "Reagendado": "#FEE2E2" }[s] || "#F3F4F6";
}

export function getPriorityColor(p) {
  return { "Alta": "#DC2626", "Media": "#D97706", "Baja": "#16A34A" }[p] || "#6B7280";
}

export function formatDateMX(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

// Normaliza cualquier formato de fecha a yyyy-MM-dd para inputs tipo date
export function normalizeDate(val) {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
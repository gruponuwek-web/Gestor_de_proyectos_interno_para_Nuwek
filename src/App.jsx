import { useState, useCallback, useRef } from "react";
import { generateId, todayStr } from "./utils/helpers";
import { useProjects } from "./hooks/useProjects";
import { useActivities } from "./hooks/useActivities";

import ActivityForm   from "./components/forms/ActivityForm";
import ProjectForm    from "./components/forms/ProjectForm";
import Dashboard      from "./components/views/Dashboard";
import CalendarView   from "./components/views/CalendarView";
import GanttView      from "./components/views/GanttView";
import ActivitiesList from "./components/views/ActivitiesList";
import ProjectsView   from "./components/views/ProjectsView";

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const bg   = type === "saving" ? "#1B4332" : type === "error" ? "#DC2626" : "#16A34A";
  const icon = type === "saving" ? "⏳"       : type === "error" ? "❌"       : "✅";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 999,
      background: bg, color: "#fff", borderRadius: 10,
      padding: "12px 20px", fontSize: 13, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      animation: "fadeIn 0.2s ease",
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {icon} {message}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,            setView]            = useState("dashboard");
  // selectedProject: id del proyecto activo (vacío = vista global)
  const [selectedProject, setSelectedProject] = useState("");
  const [showForm,        setShowForm]        = useState(false);
  const [showProjForm,    setShowProjForm]    = useState(false);
  const [editAct,         setEditAct]         = useState(null);
  const [editProj,        setEditProj]        = useState(null);
  const [toast,           setToast]           = useState({ message: "", type: "" });
  const [editOccurrence,  setEditOccurrence]  = useState(null);
  const toastTimer = useRef(null);

  // Proyectos expandidos en el sidebar (persistido en localStorage)
  const [expandedProjects, setExpandedProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("nuwek_expanded_projs");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  const { projects, loading: projLoading, saveProject, deleteProject } = useProjects();
  const { activities, loading: actLoading, saveActivity, saveActivitiesBatch, deleteActivity, deleteSeriesOccurrences, excludeOccurrence, completeOccurrence, uncompleteOccurrence, updateStatus } = useActivities();

  const loading = projLoading || actLoading;

  const showToast = useCallback((message, type = "success", duration = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: "", type: "" }), duration);
  }, []);

  // Expande/colapsa un proyecto en el sidebar
  const toggleProject = (id) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("nuwek_expanded_projs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Navega a una subvista de proyecto (abre el proyecto si estaba colapsado)
  const goProjectView = (projectId, viewName) => {
    setSelectedProject(projectId);
    setView(viewName);
    setExpandedProjects(() => {
      const next = new Set([projectId]);
      try { localStorage.setItem("nuwek_expanded_projs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // Navega a una vista global (sin proyecto seleccionado)
  const goGlobalView = (viewName) => {
    setSelectedProject("");
    setView(viewName);
  };

  const handleSaveAct = async (act) => {
    const isNew = !act.id;
    const isRecurring = act.recurrence && act.recurrence !== "No se repite";
    showToast("Guardando en Sheets...", "saving", 60000);
    try {
      if (isNew && isRecurring) {
        const GAPS = { Semanal: 7, Quincenal: 14, Mensual: 30 };
        const gap   = GAPS[act.recurrence] || 7;
        const count = parseInt(act.recurrenceCount) || 12;
        const seriesId = generateId();
        const occurrences = Array.from({ length: count }, (_, i) => {
          const d = new Date(act.date + "T12:00:00");
          d.setDate(d.getDate() + i * gap);
          return { ...act, id: generateId(), date: d.toISOString().split("T")[0], seriesId, occurrenceIndex: i + 1, status: "Pendiente", recurrence: "No se repite", recurrenceCount: 1 };
        });
        await saveActivitiesBatch(occurrences);
        showToast(`${count} sesiones agendadas`, "success");
      } else {
        let actToSave = { ...act, id: act.id || generateId() };
        if (!isNew && isRecurring && !act.seriesId && act.status === "Completado" && editOccurrence?.baseId === act.id) {
          const baseAct = activities.find(a => a.id === act.id);
          const existing = baseAct?.completedDates || [];
          actToSave = {
            ...actToSave,
            status: baseAct?.status || "Pendiente",
            completedDates: existing.includes(editOccurrence.date) ? existing : [...existing, editOccurrence.date],
          };
        }
        await saveActivity(actToSave);
        showToast(isNew ? "Actividad creada" : "Actividad actualizada", "success");
      }
    } catch {
      showToast("Guardado local · Error al sincronizar con Sheets", "error");
    }
    setTimeout(() => { setShowForm(false); setEditAct(null); setEditOccurrence(null); }, 300);
  };

  const handleEditAct = (act) => {
    const base = activities.find(a => a.id === act.id || act.id?.startsWith(a.id + "_"));
    if (base) {
      const isOccurrence = act.id !== base.id;
      const isRecurring = base.recurrence && base.recurrence !== "No se repite";
      setEditOccurrence(isOccurrence && isRecurring ? { baseId: base.id, date: act.date } : null);
      setEditAct(base);
      setShowForm(true);
    }
  };

  const handleNewWithPrefill = (prefillData) => {
    if (prefillData?.fullAct) {
      const isExisting = prefillData.fullAct.id && activities.some(a => a.id === prefillData.fullAct.id);
      setEditAct(isExisting ? prefillData.fullAct : { ...prefillData.fullAct, id: "" });
    } else if (prefillData?.prefill) {
      const s = prefillData.prefill;
      setEditAct({ id: "", projectId: s.projectId, phase: s.phase, description: "", clientResponsible: "", nuwekResponsible: "", clientGuests: [], nuwekGuests: [], priority: s.priority || "Media", date: todayStr(), timeStart: "", timeEnd: "", interactionType: s.interactionType || "Con cliente", modality: s.modality || "En línea", recurrence: "No se repite", recurrenceCount: 12, status: "Pendiente", notes: "", originalDate: "" });
    } else { setEditAct(null); }
    setShowForm(true);
  };

  const handleSaveProj = async (proj) => {
    const isNew = !proj.id;
    showToast("Guardando en Sheets...", "saving", 60000);
    try {
      await saveProject({ ...proj, id: proj.id || generateId() });
      showToast(isNew ? "Proyecto creado" : "Proyecto actualizado", "success");
    } catch {
      showToast("Guardado local · Error al sincronizar con Sheets", "error");
    }
    setTimeout(() => { setShowProjForm(false); setEditProj(null); }, 300);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTop: "3px solid #1B4332", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#1B4332", fontWeight: 700, fontSize: 14, margin: 0 }}>Sincronizando con Google Sheets...</p>
      <p style={{ color: "#9CA3AF", fontSize: 12, margin: 0 }}>Cargando proyectos y actividades</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const subViews = [
    { id: "activities", label: "Actividades", icon: "☰" },
    { id: "calendar",   label: "Calendario",  icon: "▦" },
    { id: "gantt",      label: "Gantt",       icon: "≡" },
  ];
  const globalViews = [
    { id: "proyectos", label: "Proyectos",   icon: "◈" },
    { id: "dashboard", label: "Dashboard",   icon: "◎" },
    { id: "calendar",  label: "Calendario",  icon: "▦" },
    { id: "activities",label: "Actividades", icon: "☰" },
  ];
  const isProjectSubView = selectedProject && ["calendar","gantt","activities"].includes(view);
  const isGlobalActive = (id) => !selectedProject && view === id;

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{ width: 230, flexShrink: 0, background: "#1B4332", display: "flex", flexDirection: "column" }}>

        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#D4A853,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>N</div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>Nuwek</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Project Manager</p>
            </div>
          </div>
        </div>

        {/* Global + Proyectos expandibles (scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>

          {/* Vistas globales */}
          <p style={{ margin: "0 0 6px 14px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Global</p>
          {globalViews.map(item => {
            const isActive = isGlobalActive(item.id);
            return (
              <button key={item.id + "-global"} onClick={() => goGlobalView(item.id)}
                style={{ width: "calc(100% - 8px)", display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", marginInline: 4, borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.52)", fontWeight: isActive ? 600 : 400, textAlign: "left", marginBottom: 1 }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 13, color: isActive ? "#D4A853" : "rgba(255,255,255,0.4)" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Divisor */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "10px 12px" }} />

          {/* Label proyectos */}
          <p style={{ margin: "0 0 6px 14px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Proyectos</p>

          {projects.map(p => {
            const isOpen = expandedProjects.has(p.id);
            const isThisProjectActive = selectedProject === p.id && ["calendar","gantt","activities"].includes(view);
            return (
              <div key={p.id}>
                {/* Cabecera del proyecto */}
                <div
                  onClick={() => { goProjectView(p.id, "activities"); }}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px 6px 12px", marginInline: 4, borderRadius: 7, cursor: "pointer", background: isThisProjectActive ? "rgba(255,255,255,0.07)" : "transparent" }}
                  onMouseEnter={e => { if (!isThisProjectActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { if (!isThisProjectActive) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, flex: 1, fontWeight: isThisProjectActive ? 600 : 400 }}>{p.name}</span>
                  <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 10 }}>{p.type}</span>
                  <span onClick={e => { e.stopPropagation(); toggleProject(p.id); }} style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.18s", padding: "2px 4px" }}>▶</span>
                </div>

                {/* Sub-vistas del proyecto */}
                {isOpen && (
                  <div style={{ paddingLeft: 24, marginBottom: 2 }}>
                    {subViews.map(sv => {
                      const isActive = selectedProject === p.id && view === sv.id;
                      return (
                        <button key={sv.id}
                          onClick={() => goProjectView(p.id, sv.id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: isActive ? 600 : 400, textAlign: "left", marginBottom: 1 }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                          <span style={{ fontSize: 11, color: isActive ? "#D4A853" : "rgba(255,255,255,0.35)" }}>{sv.icon}</span>
                          <span>{sv.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* CTA */}
        <div style={{ padding: "14px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { setEditAct(null); setShowForm(true); }}
            style={{ width: "100%", padding: "10px 0", background: "#D4A853", color: "#1B4332", border: "none", borderRadius: 9, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            + Nueva actividad
          </button>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {view === "proyectos"  && <ProjectsView   projects={projects} activities={activities} onAdd={() => { setEditProj(null); setShowProjForm(true); }} onEdit={p => { setEditProj(p); setShowProjForm(true); }} onDelete={deleteProject} onGoGantt={id => goProjectView(id, "gantt")} onGoActivities={id => goProjectView(id, "activities")} />}
        {view === "dashboard"  && <Dashboard      projects={projects} activities={activities} onNewActivity={() => { setEditAct(null); setShowForm(true); }} onEdit={handleEditAct} onGoActivities={id => goProjectView(id, "activities")} />}
        {view === "calendar"   && <CalendarView   key={selectedProject} projects={projects} activities={activities} selectedProject={selectedProject} onNewActivity={() => { setEditAct(null); setShowForm(true); }} onEdit={handleEditAct} />}
        {view === "gantt"      && <GanttView      projects={projects} activities={activities} selectedProject={selectedProject} onProjectChange={id => goProjectView(id, "gantt")} />}
        {view === "activities" && <ActivitiesList key={selectedProject} projects={projects} activities={activities} defaultProject={selectedProject} onNew={handleNewWithPrefill} onEdit={handleEditAct} onDelete={deleteActivity} onDeleteOccurrence={excludeOccurrence} onDeleteSeries={deleteSeriesOccurrences} onStatusChange={updateStatus} onCompleteOccurrence={completeOccurrence} onUncompleteOccurrence={uncompleteOccurrence} onSaveActivity={handleSaveAct} />}
      </div>

      {showForm     && <ActivityForm projects={projects} editActivity={editAct} onSave={handleSaveAct} onCancel={() => { setShowForm(false); setEditAct(null); setEditOccurrence(null); }} />}
      {showProjForm && <ProjectForm  editProject={editProj} onSave={handleSaveProj} onCancel={() => { setShowProjForm(false); setEditProj(null); }} />}

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

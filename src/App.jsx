import { useState, useCallback, useRef } from "react";
import { PROJECTS_INIT } from "./constants";
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

const NAV = [
  { id: "proyectos",  label: "Proyectos",   icon: "◈" },
  { id: "dashboard",  label: "Dashboard",   icon: "◎" },
  { id: "calendar",   label: "Calendario",  icon: "▦" },
  { id: "gantt",      label: "Gantt",       icon: "≡" },
  { id: "activities", label: "Actividades", icon: "☰" },
];

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
  const [selectedProject, setSelectedProject] = useState(PROJECTS_INIT[0]?.id || "");
  const [showForm,        setShowForm]        = useState(false);
  const [showProjForm,    setShowProjForm]    = useState(false);
  const [editAct,         setEditAct]         = useState(null);
  const [editProj,        setEditProj]        = useState(null);
  const [toast,           setToast]           = useState({ message: "", type: "" });
  const toastTimer = useRef(null);

  const { projects, loading: projLoading, saveProject, deleteProject } = useProjects();
  const { activities, loading: actLoading, saveActivity, deleteActivity, excludeOccurrence, completeOccurrence, updateStatus } = useActivities();

  const loading = projLoading || actLoading;

  const showToast = useCallback((message, type = "success", duration = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: "", type: "" }), duration);
  }, []);

  const handleSaveAct = async (act) => {
    const isNew = !act.id;
    showToast("Guardando en Sheets...", "saving", 60000);
    try {
      await saveActivity({ ...act, id: act.id || generateId() });
      showToast(isNew ? "Actividad creada" : "Actividad actualizada", "success");
    } catch {
      showToast("Guardado local · Error al sincronizar con Sheets", "error");
    }
    setTimeout(() => { setShowForm(false); setEditAct(null); }, 300);
  };

  const handleEditAct = (act) => {
    const base = activities.find(a => a.id === act.id || act.id?.startsWith(a.id + "_"));
    if (base) { setEditAct(base); setShowForm(true); }
  };

  const handleNewWithPrefill = (prefillData) => {
    if (prefillData?.fullAct) {
      setEditAct({ ...prefillData.fullAct, id: "" });
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: "#1B4332", display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#D4A853,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>N</div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1 }}>Nuwek</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Project Manager</p>
            </div>
          </div>
        </div>

        {/* Projects list */}
        <div style={{ padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ margin: "0 0 10px 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Proyectos</p>
          {projects.map(p => (
            <div key={p.id} onClick={() => { setSelectedProject(p.id); setView("gantt"); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, flex: 1 }}>{p.name}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{p.type}</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          <p style={{ margin: "0 0 10px 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Vistas</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, marginBottom: 2, background: view === item.id ? "rgba(255,255,255,0.12)" : "transparent", color: view === item.id ? "#fff" : "rgba(255,255,255,0.55)", fontWeight: view === item.id ? 600 : 400, textAlign: "left" }}
              onMouseEnter={e => { if (view !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (view !== item.id) e.currentTarget.style.background = "transparent"; }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => { setEditAct(null); setShowForm(true); }}
            style={{ width: "100%", padding: "10px 0", background: "#D4A853", color: "#1B4332", border: "none", borderRadius: 9, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            + Nueva actividad
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {view === "proyectos"  && <ProjectsView   projects={projects} activities={activities} onAdd={() => { setEditProj(null); setShowProjForm(true); }} onEdit={p => { setEditProj(p); setShowProjForm(true); }} onDelete={deleteProject} onGoGantt={id => { setSelectedProject(id); setView("gantt"); }} />}
        {view === "dashboard"  && <Dashboard      projects={projects} activities={activities} onNewActivity={() => { setEditAct(null); setShowForm(true); }} onEdit={handleEditAct} />}
        {view === "calendar"   && <CalendarView   projects={projects} activities={activities} onNewActivity={() => { setEditAct(null); setShowForm(true); }} onEdit={handleEditAct} />}
        {view === "gantt"      && <GanttView      projects={projects} activities={activities} selectedProject={selectedProject} onProjectChange={setSelectedProject} />}
        {view === "activities" && <ActivitiesList projects={projects} activities={activities} onNew={handleNewWithPrefill} onEdit={handleEditAct} onDelete={deleteActivity} onDeleteOccurrence={excludeOccurrence} onStatusChange={updateStatus} onCompleteOccurrence={completeOccurrence} onSaveActivity={handleSaveAct} />}
      </div>

      {showForm     && <ActivityForm projects={projects} editActivity={editAct} onSave={handleSaveAct} onCancel={() => { setShowForm(false); setEditAct(null); }} />}
      {showProjForm && <ProjectForm  editProject={editProj} onSave={handleSaveProj} onCancel={() => { setShowProjForm(false); setEditProj(null); }} />}

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
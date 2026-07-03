import { useMemo, useState } from "react";
import { getPhasesForType, expandRecurring, todayStr, tomorrowStr, getStatusColor, getStatusBg, getPriorityColor } from "../../utils/helpers";

function Dashboard({ projects, activities, onNewActivity, onEdit, onGoActivities }) {
  const today   = todayStr();
  const tmrw    = tomorrowStr();
  const all     = useMemo(() => activities.flatMap(expandRecurring), [activities]);

  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; })();
  const in7days = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const todayActs    = all.filter(a => a.date === today  && a.status !== "Completado");
  const tmrwActs     = all.filter(a => a.date === tmrw   && a.status !== "Completado");
  const overdueActs  = all.filter(a => a.date <  today   && a.status !== "Completado");
  const next7Acts    = all.filter(a => a.date >  tmrw    && a.date <= in7days && a.status !== "Completado").sort((a,b) => a.date.localeCompare(b.date));
  const pendingAll   = all.filter(a => a.status !== "Completado");
  const doneWeek     = all.filter(a => a.status === "Completado" && a.date >= weekAgo && a.date <= today);
  const activeProjs  = projects.filter(p => (p.status || "Activo") === "Activo");

  const kpis = [
    { label: "Proyectos activos", value: activeProjs.length,  color: "#374151", bg: "#F9FAFB", border: "#D1D5DB" },
    { label: "Pendientes",        value: pendingAll.length,   color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
    { label: "Completadas · sem", value: doneWeek.length,     color: "#166534", bg: "#F0FDF4", border: "#BBF7D0" },
    { label: "Vencidas",          value: overdueActs.length,  color: overdueActs.length > 0 ? "#DC2626" : "#6B7280", bg: overdueActs.length > 0 ? "#FEF2F2" : "#F9FAFB", border: overdueActs.length > 0 ? "#FECACA" : "#E5E7EB" },
  ];

  const AgendaRow = ({ act }) => {
    const pr = projects.find(p => p.id === act.projectId);
    return (
      <div onClick={() => onEdit(act)}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"0.5px solid var(--border)", cursor:"pointer" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:getPriorityColor(act.priority), flexShrink:0 }} />
        <span style={{ flex:1, fontSize:12, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.description}</span>
        <span style={{ fontSize:10, color:pr?.color || "var(--text-muted)", fontWeight:600, flexShrink:0 }}>{pr?.name}</span>
      </div>
    );
  };

  const AgendaCard = ({ title, icon, acts, showDate }) => {
    const [expanded, setExpanded] = useState(false);
    const limit = showDate ? 4 : 5;
    const visible = expanded ? acts : acts.slice(0, limit);
    return (
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:10, padding:"12px 14px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
        <p style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.07em", color:"#9CA3AF", borderBottom:"1px solid #F3F4F6", paddingBottom:6, marginBottom:8 }}>
          {icon} {title} · <span style={{ color:"#6B7280" }}>{acts.length}</span>
        </p>
        {acts.length === 0
          ? <p style={{ fontSize:11, color:"#9CA3AF", textAlign:"center", padding:"12px 0" }}>Sin actividades</p>
          : visible.map((a, i) => (
              <div key={a.id} onClick={() => onEdit(a)}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom: i < visible.length - 1 ? "1px solid #F3F4F6" : "none", cursor:"pointer" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:getPriorityColor(a.priority), flexShrink:0 }} />
                <span style={{ flex:1, fontSize:11, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.description}</span>
                {showDate
                  ? <span style={{ fontSize:10, color:"#9CA3AF", flexShrink:0 }}>{new Date(a.date+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})}</span>
                  : <span style={{ fontSize:10, fontWeight:500, flexShrink:0, color:getStatusColor(a.status), background:getStatusBg(a.status), padding:"1px 6px", borderRadius:20 }}>{a.status}</span>
                }
              </div>
            ))
        }
        {acts.length > limit && (
          <p onClick={() => setExpanded(e => !e)}
            style={{ fontSize:10, color:"#2563EB", textAlign:"center", paddingTop:8, cursor:"pointer", fontWeight:600 }}>
            {expanded ? "▲ Ver menos" : `+${acts.length - limit} más`}
          </p>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding:32, background:"var(--surface-0, #F9FAFB)", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:"var(--text-primary)" }}>Dashboard</h1>
          <p style={{ margin:"3px 0 0", fontSize:13, color:"var(--text-muted)" }}>{new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <button onClick={onNewActivity} style={{ padding:"9px 18px", background:"#1B4332", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Actividad</button>
      </div>

      {/* ① KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.border}`, borderRadius:12, padding:"20px 22px" }}>
            <p style={{ margin:"0 0 10px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em", color:k.color }}>{k.label}</p>
            <p style={{ margin:0, fontSize:36, fontWeight:700, color:k.color, lineHeight:1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ② Agenda */}
      <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"#9CA3AF" }}>Seguimientos próximos</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:20 }}>
        <AgendaCard title="Hoy"          icon="📋" acts={todayActs}  showDate={false} />
        <AgendaCard title="Mañana"       icon="📅" acts={tmrwActs}   showDate={false} />
        <AgendaCard title="Próx. 7 días" icon="🗓" acts={next7Acts}  showDate={true}  />
      </div>

      {/* ③ Proyectos */}
      <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--text-muted)" }}>Proyectos</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {projects.map(proj => {
          const pa     = all.filter(a => a.projectId === proj.id);
          const total  = pa.length;
          const done   = pa.filter(a => a.status === "Completado").length;
          const pct    = total > 0 ? Math.round(done / total * 100) : 0;
          const phases = getPhasesForType(proj.type).map(ph => {
            const pha = pa.filter(a => a.phase === ph.name);
            const pd  = pha.filter(a => a.status === "Completado").length;
            return { ...ph, done: pd, total: pha.length, pct: pha.length > 0 ? Math.round(pd/pha.length*100) : 0 };
          }).filter(ph => ph.total > 0);

          return (
            <div key={proj.id}
              onClick={() => onGoActivities && onGoActivities(proj.id)}
              style={{ background:"var(--surface-2, #fff)", border:"0.5px solid var(--border)", borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"box-shadow 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:proj.color, flexShrink:0 }} />
                  <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{proj.name}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:10, color:"var(--text-muted)", background:"var(--surface-1)", padding:"2px 8px", borderRadius:20 }}>{proj.type}</span>
                  <span style={{ fontSize:16, fontWeight:700, color:proj.color }}>{pct}%</span>
                </div>
              </div>

              <p style={{ margin:"0 0 10px", fontSize:11, color:"var(--text-muted)" }}>{total} actividades · {done} completadas</p>

              <div style={{ borderTop:"0.5px solid var(--border)" }}>
                {phases.slice(0, 5).map((ph, i) => (
                  <div key={ph.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 0", borderBottom: i < phases.slice(0,5).length - 1 ? "0.5px solid var(--border)" : "none" }}>
                    <span style={{ fontSize:12, color: ph.color || proj.color }}>{ph.name}</span>
                    <span style={{ fontSize:12, color: ph.color || proj.color }}>{ph.pct}% · {ph.done}/{ph.total}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;

import { useMemo } from "react";
import { getPhasesForType, expandRecurring, todayStr, tomorrowStr, getStatusColor, getStatusBg, getPriorityColor } from "../../utils/helpers";
import Badge from "../ui/Badge";

function Dashboard({ projects, activities, onNewActivity, onEdit }) {
  const today = todayStr();
  const tmrwStr = tomorrowStr();
  const all = useMemo(() => activities.flatMap(expandRecurring), [activities]);
  const todayActs  = all.filter(a => a.date===today    && a.status!=="Completado");
  const tmrwActs   = all.filter(a => a.date===tmrwStr  && a.status!=="Completado");
  const overdueActs= all.filter(a => a.date<today      && a.status!=="Completado");

  function getPhaseProgress(proj) {
    const pa = all.filter(a => a.projectId===proj.id);
    return getPhasesForType(proj.type).map(ph => {
      const pha = pa.filter(a => a.phase===ph.name);
      const done=pha.filter(a=>a.status==="Completado").length, total=pha.length;
      return { ...ph, done, total, pct: total>0?Math.round(done/total*100):0 };
    });
  }

  const ActRow = ({ act }) => {
    const proj = projects.find(p => p.id===act.projectId);
    return (
      <div onClick={() => onEdit(act)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer", borderBottom:"1px solid #F9FAFB" }}
        onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:getPriorityColor(act.priority), flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:500, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{act.description}</p>
          <p style={{ margin:0, fontSize:11, color:"#9CA3AF" }}><span style={{color:proj?.color||"#6B7280"}}>{proj?.name}</span> · {act.phase}</p>
        </div>
        <Badge label={act.status} color={getStatusColor(act.status)} bg={getStatusBg(act.status)} />
      </div>
    );
  };

  const statCards = [
    { label:"Hoy",     acts:todayActs,   color:"#2563EB", bg:"#EFF6FF", icon:"📋" },
    { label:"Mañana",  acts:tmrwActs,    color:"#7C3AED", bg:"#F5F3FF", icon:"📅" },
    { label:"Vencidas",acts:overdueActs, color:"#DC2626", bg:"#FEF2F2", icon:"⚠️" },
  ];

  return (
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827" }}>Dashboard</h1>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#9CA3AF" }}>{new Date().toLocaleDateString("es-MX",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <button onClick={onNewActivity} style={{ padding:"10px 20px", background:"#1B4332", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Actividad</button>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:28 }}>
        {statCards.map(({label,acts,color,bg,icon}) => (
          <div key={label} style={{ background:"#fff", borderRadius:12, padding:"20px 24px", border:"1px solid #F3F4F6", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <span style={{ background:bg, color, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>{acts.length}</span>
            </div>
            <p style={{ margin:0, fontSize:13, color:"#6B7280", fontWeight:500, marginBottom:12 }}>{label}</p>
            <div style={{ maxHeight:160, overflowY:"auto" }}>
              {acts.length===0
                ? <p style={{ margin:0, fontSize:12, color:"#D1D5DB", textAlign:"center", padding:"12px 0" }}>{label==="Vencidas"?"¡Al corriente! 🎉":"Nada por ahora"}</p>
                : acts.map(a => <ActRow key={a.id} act={a} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
        {projects.map(proj => {
          const phases = getPhaseProgress(proj);
          const total = all.filter(a=>a.projectId===proj.id).length;
          const done  = all.filter(a=>a.projectId===proj.id&&a.status==="Completado").length;
          const pct   = total>0?Math.round(done/total*100):0;
          return (
            <div key={proj.id} style={{ background:"#fff", borderRadius:12, padding:24, border:"1px solid #F3F4F6", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:14, borderBottom:"1px solid #F3F4F6", marginBottom:16 }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:proj.color, flexShrink:0 }} />
                <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#111827", flex:1 }}>{proj.name}</h3>
                <span style={{ background:"#F3F4F6", color:"#6B7280", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600 }}>{proj.type}</span>
                <span style={{ fontSize:22, fontWeight:800, color:proj.color }}>{pct}%</span>
              </div>
              <p style={{ margin:"0 0 14px", fontSize:12, color:"#9CA3AF" }}>{total} actividades · {done} completadas</p>
              {/* Phase bars */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {phases.map(ph => (
                  <div key={ph.name}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:12, color:"#374151" }}>{ph.name}</span>
                      <span style={{ fontSize:11, color:ph.color, fontWeight:600 }}>{ph.pct}% · {ph.done}/{ph.total}</span>
                    </div>
                    <div style={{ height:6, background:"#F3F4F6", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ width:`${ph.pct}%`, height:"100%", background:ph.color, borderRadius:99, transition:"width 0.4s" }} />
                    </div>
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

// ─── GANTT ────────────────────────────────────────────────────────────────────

export default Dashboard;

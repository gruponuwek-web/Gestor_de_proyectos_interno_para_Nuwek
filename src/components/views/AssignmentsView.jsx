import { useState, useMemo } from "react";
import { expandRecurring, todayStr } from "../../utils/helpers";

const PERSON_COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#6366F1","#EC4899","#14B8A6","#F97316","#06B6D4","#84CC16","#A855F7"];

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function AssignmentsView({ projects, activities, onGoActivities, onNewActivity }) {
  const [period,      setPeriod]      = useState("sem");
  const [filterProj,  setFilterProj]  = useState("todos");
  const [offset,      setOffset]      = useState(0);

  // All unique nuwek people across all projects
  const allPeople = useMemo(() =>
    [...new Set(projects.flatMap(p => p.nuwekMembers || []))].sort(),
    [projects]
  );

  // Date range
  const { dateMin, dateMax, label } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === "hoy") {
      const s = todayStr();
      return { dateMin: s, dateMax: s, label: today.toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" }) };
    }

    if (period === "sem") {
      const base = new Date(today);
      base.setDate(base.getDate() + offset * 7);
      const mon = new Date(base);
      mon.setDate(base.getDate() - (base.getDay() === 0 ? 6 : base.getDay() - 1));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const fmt = d => d.toLocaleDateString("es-MX", { day:"numeric", month:"short" });
      return { dateMin: mon.toISOString().split("T")[0], dateMax: sun.toISOString().split("T")[0], label: `${fmt(mon)} – ${fmt(sun)}` };
    }

    // mes
    const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return {
      dateMin: base.toISOString().split("T")[0],
      dateMax: last.toISOString().split("T")[0],
      label: base.toLocaleDateString("es-MX", { month:"long", year:"numeric" }),
    };
  }, [period, offset]);

  // Filtered & expanded activities in range
  const all = useMemo(() =>
    activities.flatMap(expandRecurring).filter(a =>
      ["Pendiente", "En progreso"].includes(a.status) &&
      a.date >= dateMin && a.date <= dateMax
    ),
    [activities, dateMin, dateMax]
  );

  const visibleProjects = useMemo(() =>
    filterProj === "todos" ? projects : projects.filter(p => p.id === filterProj),
    [projects, filterProj]
  );

  const getCellActs = (projectId, person) =>
    all.filter(a =>
      a.projectId === projectId &&
      (a.nuwekResponsible === person || (a.nuwekGuests || []).includes(person))
    );

  const selStyle = { padding:"7px 12px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:13, color:"#374151", cursor:"pointer" };
  const navBtn   = { width:30, height:30, border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", cursor:"pointer", fontSize:15, color:"#374151" };

  return (
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", flex:1 }}>Asignaciones</h1>

        {/* Period toggle */}
        <div style={{ display:"flex", border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
          {[{v:"hoy",l:"Hoy"},{v:"sem",l:"Semana"},{v:"mes",l:"Mes"}].map(({v,l}) => (
            <button key={v} onClick={() => { setPeriod(v); setOffset(0); }}
              style={{ padding:"6px 14px", border:"none", background:period===v?"#1B4332":"#fff", color:period===v?"#fff":"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Project filter */}
        <select style={selStyle} value={filterProj} onChange={e => setFilterProj(e.target.value)}>
          <option value="todos">Todos los proyectos</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Navigation */}
        {period !== "hoy" && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={() => setOffset(o => o - 1)} style={navBtn}>‹</button>
            <span style={{ fontSize:12, fontWeight:600, color:"#111827", minWidth:160, textAlign:"center", textTransform:"capitalize" }}>{label}</span>
            <button onClick={() => setOffset(o => o + 1)} style={navBtn}>›</button>
            {offset !== 0 && (
              <button onClick={() => setOffset(0)} style={{ padding:"4px 10px", border:"1px solid #E5E7EB", borderRadius:7, background:"#fff", fontSize:11, color:"#374151", cursor:"pointer" }}>Hoy</button>
            )}
          </div>
        )}

        <button onClick={onNewActivity} style={{ padding:"9px 18px", background:"#1B4332", color:"#fff", border:"none", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer" }}>+ Actividad</button>
      </div>

      {/* Matrix */}
      <div style={{ overflowX:"auto", borderRadius:12, border:"1px solid #F3F4F6", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth: 150 + allPeople.length * 130 }}>
          <thead>
            <tr style={{ background:"#F9FAFB" }}>
              <th style={{ padding:"12px 16px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#9CA3AF", textAlign:"left", borderBottom:"1px solid #F3F4F6", borderRight:"1px solid #F3F4F6", width:150, minWidth:150 }}>
                Proyecto
              </th>
              {allPeople.map((person, i) => (
                <th key={person} style={{ padding:"10px 8px", textAlign:"center", borderBottom:"1px solid #F3F4F6", borderRight: i < allPeople.length - 1 ? "1px solid #F3F4F6" : "none", minWidth:120 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:PERSON_COLORS[i % PERSON_COLORS.length], color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, margin:"0 auto 5px" }}>
                    {initials(person)}
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:"#6B7280" }}>{person}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map((proj, pi) => (
              <tr key={proj.id} style={{ borderBottom: pi < visibleProjects.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                {/* Project label */}
                <td style={{ padding:"10px 14px", borderRight:"1px solid #F3F4F6", verticalAlign:"top", background:"#FAFAFA" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:proj.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{proj.name}</span>
                  </div>
                  <p style={{ margin:"2px 0 0 15px", fontSize:10, color:"#9CA3AF" }}>{proj.type}</p>
                </td>

                {/* Person cells */}
                {allPeople.map((person, i) => {
                  const cellActs = getCellActs(proj.id, person);
                  const color    = PERSON_COLORS[i % PERSON_COLORS.length];
                  const isLast   = i === allPeople.length - 1;
                  return (
                    <td key={person} style={{ padding:"8px 6px", borderRight: !isLast ? "1px solid #F3F4F6" : "none", verticalAlign:"top", width:130, maxWidth:130 }}>
                      {cellActs.length === 0
                        ? <div style={{ color:"#E5E7EB", fontSize:11, textAlign:"center", paddingTop:10 }}>—</div>
                        : <>
                            {cellActs.slice(0, 3).map(a => (
                              <div key={a.id}
                                onClick={() => onGoActivities(proj.id, person)}
                                title={a.description}
                                style={{ fontSize:10, padding:"3px 8px", borderRadius:20, marginBottom:4, cursor:"pointer", background:color+"18", border:`1px solid ${color}33`, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}
                                onMouseEnter={e => { e.currentTarget.style.background = color+"30"; e.currentTarget.style.borderColor = color+"66"; }}
                                onMouseLeave={e => { e.currentTarget.style.background = color+"18"; e.currentTarget.style.borderColor = color+"33"; }}>
                                {a.description}
                              </div>
                            ))}
                            {cellActs.length > 3 && (
                              <div
                                onClick={() => onGoActivities(proj.id, person)}
                                title={`Ver todas las actividades de ${person} en ${proj.name}`}
                                style={{ fontSize:10, padding:"2px 8px", borderRadius:20, cursor:"pointer", color:color, fontWeight:600 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                                +{cellActs.length - 3} más
                              </div>
                            )}
                          </>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}

            {visibleProjects.length === 0 && (
              <tr>
                <td colSpan={allPeople.length + 1} style={{ textAlign:"center", color:"#9CA3AF", padding:60, fontSize:13 }}>
                  Sin proyectos para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssignmentsView;

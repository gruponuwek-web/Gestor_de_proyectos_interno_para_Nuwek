import { useState, useMemo } from "react";
import { DAYS_ES, MONTHS_ES } from "../../constants";
import { expandRecurring } from "../../utils/helpers";

const CONFLICT_PEOPLE = ['Carlos', 'Daniel', 'Estrella', 'Gerry', 'Jaime', 'Juan Daniel', 'SRM', 'Yun'];
const HOUR_H = 54;
const START_H = 7;
const NHOURS = 13; // 7:00 – 20:00

function toMin(t) {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function DayModal({ date, acts, projects, onEdit, onClose }) {
  const label = new Date(date + "T12:00:00").toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" });
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(0,0,0,0.15)", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#111827", textTransform:"capitalize" }}>{label}</p>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, color:"#9CA3AF", cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:12, maxHeight:400, overflowY:"auto" }}>
          {acts.map(a => {
            const pr = projects.find(p=>p.id===a.projectId);
            return (
              <div key={a.id} onClick={()=>{ onEdit(a); onClose(); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, marginBottom:6, cursor:"pointer", background:"#F9FAFB", border:"1px solid #F3F4F6" }}
                onMouseEnter={e=>e.currentTarget.style.background="#F3F4F6"}
                onMouseLeave={e=>e.currentTarget.style.background="#F9FAFB"}>
                <div style={{ width:4, height:36, borderRadius:2, background:pr?.color||"#6B7280", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:13, fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.description}</p>
                  <p style={{ margin:0, fontSize:11, color:"#9CA3AF" }}>{pr?.name}{a.timeStart?` · ${a.timeStart}${a.timeEnd?`–${a.timeEnd}`:""}`:""}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarView({ projects, activities, onNewActivity, onEdit, selectedProject }) {
  const [cur, setCur]       = useState(new Date());
  const [fp, setFp]         = useState(selectedProject || "todos");
  const [fNuwek, setFNuwek] = useState("Todos");
  const [dayModal, setDayModal] = useState(null);
  const [calView, setCalView]   = useState("mes");
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const allNuwek = [...new Set(projects.flatMap(p => p.nuwekMembers || []))].sort();
  const ALIVE = ["Pendiente", "En progreso"];
  const all  = useMemo(() => activities.flatMap(expandRecurring).filter(a => ALIVE.includes(a.status)), [activities]);
  const filt = useMemo(() => {
    let a = fp === "todos" ? all : all.filter(x => x.projectId === fp);
    if (fNuwek !== "Todos") a = a.filter(x => x.nuwekResponsible === fNuwek || (x.nuwekGuests||[]).includes(fNuwek));
    return a;
  }, [all, fp, fNuwek]);

  // ── Month helpers ──
  const y = cur.getFullYear(), m = cur.getMonth();
  const cells = [];
  for (let i = 0; i < new Date(y,m,1).getDay(); i++) cells.push(null);
  for (let d = 1; d <= new Date(y,m+1,0).getDate(); d++) cells.push(d);
  const dateStr = d => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const td = new Date();
  const isToday = d => d === td.getDate() && m === td.getMonth() && y === td.getFullYear();

  // ── Week helpers ──
  const weekDays = useMemo(() => Array.from({ length:6 }, (_,i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const todayIso = td.toISOString().split("T")[0];

  const weekActsByDay = useMemo(() => weekDays.map(d => {
    const iso = d.toISOString().split("T")[0];
    return filt.filter(a => a.date === iso);
  }), [filt, weekDays]);

  const conflictIds = useMemo(() => {
    if (calView !== "semana") return new Set();
    const ids = new Set();
    const groups = {};
    weekDays.forEach((_, di) => {
      weekActsByDay[di].filter(a => a.timeStart && a.timeEnd).forEach(act => {
        const people = [act.nuwekResponsible, ...(act.nuwekGuests||[])].filter(p => CONFLICT_PEOPLE.includes(p));
        people.forEach(person => {
          const key = `${person}_${di}`;
          (groups[key] = groups[key] || []).push(act);
        });
      });
    });
    Object.values(groups).forEach(arr => {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const as = toMin(arr[i].timeStart), ae = toMin(arr[i].timeEnd);
          const bs = toMin(arr[j].timeStart), be = toMin(arr[j].timeEnd);
          if (Math.max(as, bs) < Math.min(ae, be)) { ids.add(arr[i].id); ids.add(arr[j].id); }
        }
      }
    });
    return ids;
  }, [weekDays, weekActsByDay, calView]);

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const goToday  = () => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    d.setHours(0,0,0,0);
    setWeekStart(new Date(d));
  };

  const weekLabel = (() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 5);
    return `${weekStart.toLocaleDateString("es-MX",{day:"numeric",month:"short"})} – ${end.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}`;
  })();

  const selStyle   = { padding:"8px 12px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:13, color:"#374151", cursor:"pointer" };
  const navBtn     = { width:32, height:32, borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", cursor:"pointer", fontSize:16, color:"#374151" };
  const WEEK_DAYS  = ["LUN","MAR","MIÉ","JUE","VIE","SÁB"];

  return (
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", flex:1 }}>
          Calendario{selectedProject ? <span style={{ color:"#9CA3AF", fontWeight:500 }}> · {projects.find(p=>p.id===selectedProject)?.name}</span> : ""}
        </h1>

        {/* Mes / Semana toggle */}
        <div style={{ display:"flex", border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
          {[{v:"mes",l:"Mes"},{v:"semana",l:"Semana"}].map(({v,l}) => (
            <button key={v} onClick={() => setCalView(v)}
              style={{ padding:"6px 14px", border:"none", background:calView===v?"#1B4332":"#fff", color:calView===v?"#fff":"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }}>
              {l}
            </button>
          ))}
        </div>

        {!selectedProject && (
          <select style={selStyle} value={fp} onChange={e=>setFp(e.target.value)}>
            <option value="todos">Todos los proyectos</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select style={selStyle} value={fNuwek} onChange={e=>setFNuwek(e.target.value)}>
          <option value="Todos">Equipo Nuwek</option>
          {allNuwek.map(n=><option key={n}>{n}</option>)}
        </select>

        {/* Navigation */}
        {calView === "mes" ? (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={()=>setCur(new Date(y,m-1,1))} style={navBtn}>‹</button>
            <span style={{ fontWeight:600, color:"#111827", minWidth:160, textAlign:"center" }}>{MONTHS_ES[m]} {y}</span>
            <button onClick={()=>setCur(new Date(y,m+1,1))} style={navBtn}>›</button>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={prevWeek} style={navBtn}>‹</button>
            <span style={{ fontWeight:600, color:"#111827", minWidth:196, textAlign:"center", fontSize:13 }}>{weekLabel}</span>
            <button onClick={nextWeek} style={navBtn}>›</button>
            <button onClick={goToday} style={{ padding:"6px 10px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:12, color:"#374151", cursor:"pointer" }}>Hoy</button>
          </div>
        )}

        <button onClick={onNewActivity} style={{ padding:"10px 20px",background:"#1B4332",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer" }}>+ Actividad</button>
      </div>

      {/* Conflict banner */}
      {calView === "semana" && conflictIds.size > 0 && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:9, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#991B1B" }}>
          ⚠ {conflictIds.size} actividad{conflictIds.size !== 1 ? "es" : ""} con conflicto de horario esta semana · Los bloques con borde rojo tienen solapamiento para la misma persona del equipo
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {calView === "mes" && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #F3F4F6", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #F3F4F6" }}>
            {DAYS_ES.map(d=><div key={d} style={{ textAlign:"center", padding:"10px 0", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" }}>{d}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
            {cells.map((d,i) => {
              if (!d) return <div key={"p"+i} style={{ minHeight:96, borderRight:"1px solid #F9FAFB", borderBottom:"1px solid #F9FAFB" }} />;
              const da = filt.filter(a => a.date === dateStr(d));
              return (
                <div key={d} style={{ minHeight:96, borderRight:"1px solid #F9FAFB", borderBottom:"1px solid #F9FAFB", padding:6, background:isToday(d)?"#F0FDF4":"#fff" }}>
                  <div style={{ fontSize:12, fontWeight:isToday(d)?700:400, color:isToday(d)?"#166534":"#9CA3AF", marginBottom:4 }}>{d}</div>
                  {da.slice(0,3).map(a => {
                    const pr = projects.find(p=>p.id===a.projectId);
                    return (
                      <div key={a.id} onClick={()=>onEdit(a)}
                        style={{ fontSize:11, padding:"2px 6px", borderRadius:4, marginBottom:2, cursor:"pointer", background:(pr?.color||"#6B7280")+"18", borderLeft:`3px solid ${pr?.color||"#6B7280"}`, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {a.description}
                      </div>
                    );
                  })}
                  {da.length > 3 && <div onClick={()=>setDayModal({date:dateStr(d),acts:da})} style={{fontSize:10,color:"#2563EB",textAlign:"center",cursor:"pointer",fontWeight:600,padding:"2px 0"}}>+{da.length-3} más</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {calView === "semana" && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #F3F4F6", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"52px repeat(6,1fr)", borderBottom:"1px solid #E5E7EB", background:"#F9FAFB" }}>
            <div style={{ borderRight:"1px solid #F3F4F6" }} />
            {weekDays.map((d, i) => {
              const iso   = d.toISOString().split("T")[0];
              const isTd  = iso === todayIso;
              return (
                <div key={i} style={{ textAlign:"center", padding:"10px 4px", borderRight:i<5?"1px solid #F3F4F6":"none" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.05em" }}>{WEEK_DAYS[i]}</div>
                  <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:"50%", background:isTd?"#1B4332":"transparent", color:isTd?"#fff":"#111827", fontSize:15, fontWeight:isTd?700:500, marginTop:2 }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize:10, color:"#9CA3AF" }}>{d.toLocaleDateString("es-MX",{month:"short"})}</div>
                </div>
              );
            })}
          </div>

          {/* All-day band */}
          <div style={{ display:"grid", gridTemplateColumns:"52px repeat(6,1fr)", borderBottom:"1px solid #E5E7EB", background:"#FAFAFA" }}>
            <div style={{ borderRight:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:6, fontSize:9, color:"#9CA3AF", paddingTop:4, paddingBottom:4 }}>todo el día</div>
            {weekDays.map((d, di) => {
              const iso      = d.toISOString().split("T")[0];
              const adActs   = weekActsByDay[di].filter(a => !a.timeStart);
              const MAX_SHOW = 3;
              return (
                <div key={di} style={{ borderRight:di<5?"1px solid #F3F4F6":"none", padding:"3px 3px", minHeight:28 }}>
                  {adActs.slice(0, MAX_SHOW).map(a => {
                    const pr = projects.find(p=>p.id===a.projectId);
                    const color = pr?.color || "#6B7280";
                    return (
                      <div key={a.id} onClick={()=>onEdit(a)}
                        style={{ fontSize:10, padding:"1px 5px", borderRadius:3, marginBottom:2, cursor:"pointer", background:color+"22", borderLeft:`3px solid ${color}`, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {a.description}
                      </div>
                    );
                  })}
                  {adActs.length > MAX_SHOW && (
                    <div onClick={()=>setDayModal({date:iso, acts:adActs})}
                      style={{ fontSize:9, color:"#2563EB", cursor:"pointer", fontWeight:600, paddingLeft:4 }}>
                      +{adActs.length - MAX_SHOW} más
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ display:"grid", gridTemplateColumns:"52px repeat(6,1fr)" }}>
            {/* Hour labels */}
            <div>
              {Array.from({ length:NHOURS }, (_,i) => (
                <div key={i} style={{ height:HOUR_H, borderBottom:"1px solid #F9FAFB", borderRight:"1px solid #F3F4F6", display:"flex", alignItems:"flex-start", paddingTop:4, paddingRight:6, justifyContent:"flex-end", fontSize:10, color:"#9CA3AF", boxSizing:"border-box" }}>
                  {START_H + i}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((_, di) => {
              const dayActs   = weekActsByDay[di];
              const timedActs = dayActs.filter(a => a.timeStart && a.timeEnd && toMin(a.timeEnd) > toMin(a.timeStart));
              return (
                <div key={di} style={{ position:"relative", height:HOUR_H * NHOURS, borderRight:di<5?"1px solid #F3F4F6":"none", boxSizing:"border-box", overflow:"hidden" }}>
                  {/* Hour lines */}
                  {Array.from({ length:NHOURS }, (_,i) => (
                    <div key={i} style={{ position:"absolute", left:0, right:0, top:i*HOUR_H, height:HOUR_H, borderBottom:"1px solid #F9FAFB", pointerEvents:"none" }} />
                  ))}

                  {/* Timed activities */}
                  {timedActs.map(a => {
                    const pr         = projects.find(p=>p.id===a.projectId);
                    const color      = pr?.color || "#6B7280";
                    const isConflict = conflictIds.has(a.id);
                    const sMin       = toMin(a.timeStart) - START_H * 60;
                    const eMin       = toMin(a.timeEnd)   - START_H * 60;
                    const top        = Math.max(0, sMin / 60 * HOUR_H);
                    const height     = Math.max(20, (eMin - sMin) / 60 * HOUR_H - 2);
                    return (
                      <div key={a.id} onClick={()=>onEdit(a)}
                        style={{ position:"absolute", left:2, right:2, top, height, background:color+"22", borderLeft:`3px solid ${color}`, borderRadius:4, padding:"3px 5px", fontSize:10, overflow:"hidden", cursor:"pointer", boxSizing:"border-box", outline:isConflict?"2px solid #DC2626":"none", outlineOffset:"-1px" }}>
                        {isConflict && (
                          <span style={{ fontSize:9, background:"#DC2626", color:"#fff", padding:"0 3px", borderRadius:2, display:"block", marginBottom:1 }}>⚠ Conflicto</span>
                        )}
                        <span style={{ fontWeight:600, color, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {pr?.name} · {a.timeStart}–{a.timeEnd}
                        </span>
                        <span style={{ color:"#374151", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.description}</span>
                        {fNuwek === "Todos" && (
                          <span style={{ color:"#9CA3AF", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.nuwekResponsible}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dayModal && <DayModal date={dayModal.date} acts={dayModal.acts} projects={projects} onEdit={onEdit} onClose={()=>setDayModal(null)} />}
    </div>
  );
}

export default CalendarView;

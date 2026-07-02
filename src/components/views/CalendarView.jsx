import { useState, useMemo } from "react";
import { DAYS_ES, MONTHS_ES } from "../../constants";
import { expandRecurring } from "../../utils/helpers";

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

function CalendarView({ projects, activities, onNewActivity, onEdit }) {
  const [cur, setCur]     = useState(new Date());
  const [fp, setFp]       = useState("todos");
  const [fNuwek, setFNuwek] = useState("Todos");
  const [dayModal, setDayModal] = useState(null);
  const allNuwek = [...new Set(projects.flatMap(p=>p.nuwekMembers))].sort();
  const ALIVE = ["Pendiente","En progreso"]; // Completado y Reagendado fuera
  const all = useMemo(()=>activities.flatMap(expandRecurring).filter(a=>ALIVE.includes(a.status)),[activities]);
  const filt= useMemo(()=>{
    let a = fp==="todos" ? all : all.filter(x=>x.projectId===fp);
    if(fNuwek!=="Todos") a=a.filter(x=>x.nuwekResponsible===fNuwek||(x.nuwekGuests||[]).includes(fNuwek));
    return a;
  },[all,fp,fNuwek]);
  const y=cur.getFullYear(), m=cur.getMonth();
  const cells=[]; for(let i=0;i<new Date(y,m,1).getDay();i++)cells.push(null);
  for(let d=1;d<=new Date(y,m+1,0).getDate();d++)cells.push(d);
  const ds=(d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const td=new Date(), isToday=(d)=>d===td.getDate()&&m===td.getMonth()&&y===td.getFullYear();
  const selStyle={ padding:"8px 12px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:13, color:"#374151", cursor:"pointer" };

  return (
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", flex:1 }}>Calendario</h1>
        <select style={selStyle} value={fp} onChange={e=>setFp(e.target.value)}>
          <option value="todos">Todos los proyectos</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={selStyle} value={fNuwek} onChange={e=>setFNuwek(e.target.value)}>
          <option value="Todos">Equipo Nuwek</option>
          {allNuwek.map(m=><option key={m}>{m}</option>)}
        </select>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setCur(new Date(y,m-1,1))} style={{ width:32,height:32,borderRadius:8,border:"1px solid #E5E7EB",background:"#fff",cursor:"pointer",fontSize:16,color:"#374151" }}>‹</button>
          <span style={{ fontWeight:600, color:"#111827", minWidth:160, textAlign:"center" }}>{MONTHS_ES[m]} {y}</span>
          <button onClick={()=>setCur(new Date(y,m+1,1))} style={{ width:32,height:32,borderRadius:8,border:"1px solid #E5E7EB",background:"#fff",cursor:"pointer",fontSize:16,color:"#374151" }}>›</button>
        </div>
        <button onClick={onNewActivity} style={{ padding:"10px 20px",background:"#1B4332",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer" }}>+ Actividad</button>
      </div>
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #F3F4F6", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #F3F4F6" }}>
          {DAYS_ES.map(d=><div key={d} style={{ textAlign:"center", padding:"10px 0", fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((d,i)=>{
            if(!d) return <div key={"p"+i} style={{ minHeight:96, borderRight:"1px solid #F9FAFB", borderBottom:"1px solid #F9FAFB" }} />;
            const da=filt.filter(a=>a.date===ds(d));
            return(
              <div key={d} style={{ minHeight:96, borderRight:"1px solid #F9FAFB", borderBottom:"1px solid #F9FAFB", padding:6, background: isToday(d)?"#F0FDF4":"#fff" }}>
                <div style={{ fontSize:12, fontWeight: isToday(d)?700:400, color: isToday(d)?"#166534":"#9CA3AF", marginBottom:4 }}>{d}</div>
                {da.slice(0,3).map(a=>{
                  const pr=projects.find(p=>p.id===a.projectId);
                  return(
                    <div key={a.id} onClick={()=>onEdit(a)}
                      style={{ fontSize:11, padding:"2px 6px", borderRadius:4, marginBottom:2, cursor:"pointer", background:(pr?.color||"#6B7280")+"18", borderLeft:`3px solid ${pr?.color||"#6B7280"}`, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {a.description}
                    </div>
                  );
                })}
                {da.length>3&&<div onClick={()=>setDayModal({date:ds(d),acts:da})} style={{fontSize:10,color:"#2563EB",textAlign:"center",cursor:"pointer",fontWeight:600,padding:"2px 0"}}>+{da.length-3} más</div>}
              </div>
            );
          })}
        </div>
      </div>

      {dayModal && <DayModal date={dayModal.date} acts={dayModal.acts} projects={projects} onEdit={onEdit} onClose={()=>setDayModal(null)} />}
    </div>
  );
}


export default CalendarView;

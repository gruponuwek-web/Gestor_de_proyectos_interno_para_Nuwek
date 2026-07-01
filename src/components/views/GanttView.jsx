import { useState, useEffect, useRef, useMemo } from "react";
import { STATUSES } from "../../constants";
import { getPhasesForType, getPhaseColor, getStatusColor } from "../../utils/helpers";

function GanttView({ projects, activities, selectedProject, onProjectChange }) {
  const [pid, setPid_]  = useState(selectedProject || projects[0]?.id||"");
  const [fPhase, setFP] = useState("Todas");
  const [fStat, setFS]  = useState("Todos");
  const setPid = (v) => { setPid_(v); onProjectChange(v); };
  useEffect(()=>{ if(selectedProject && selectedProject!==pid) setPid_(selectedProject); },[selectedProject]);
  const proj  = projects.find(p=>p.id===pid);
  const phases= proj?getPhasesForType(proj.type):[];
  const acts  = useMemo(()=>{
    let a=activities.filter(x=>x.projectId===pid);
    if(fPhase!=="Todas")a=a.filter(x=>x.phase===fPhase);
    if(fStat !=="Todos")a=a.filter(x=>x.status===fStat);
    return a.sort((a,b)=>a.date.localeCompare(b.date));
  },[activities,pid,fPhase,fStat]);

  const dates=acts.map(a=>a.date).filter(Boolean);
  const minD=dates.length?new Date(Math.min(...dates.map(d=>new Date(d)))):new Date();
  const maxD=dates.length?new Date(Math.max(...dates.map(d=>new Date(d)))):new Date();
  const start=new Date(minD); start.setDate(start.getDate()-start.getDay());
  const end=new Date(maxD);   end.setDate(end.getDate()+(6-end.getDay()));
  const totalD=Math.max(Math.ceil((end-start)/86400000)+1,84);
  const weeks=[]; for(let i=0;i<totalD;i+=7){const d=new Date(start);d.setDate(d.getDate()+i);weeks.push(d);}
  const off=(ds)=>Math.round((new Date(ds)-start)/86400000);
  const CW=36,RH=40;
  const selStyle={ padding:"8px 12px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:13, color:"#374151", cursor:"pointer" };

  return (
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", flex:1 }}>Gantt</h1>
        <select style={selStyle} value={pid} onChange={e=>setPid(e.target.value)}>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={selStyle} value={fPhase} onChange={e=>setFP(e.target.value)}>
          <option>Todas</option>{phases.map(p=><option key={p.name}>{p.name}</option>)}
        </select>
        <select style={selStyle} value={fStat} onChange={e=>setFS(e.target.value)}>
          <option>Todos</option>{STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      {acts.length===0
        ?<div style={{textAlign:"center",color:"#9CA3AF",padding:80}}>Sin actividades para este proyecto</div>
        :<div style={{overflowX:"auto",background:"#fff",borderRadius:12,border:"1px solid #F3F4F6",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{minWidth:weeks.length*CW*7+280}}>
            <div style={{display:"flex",borderBottom:"1px solid #F3F4F6",background:"#F9FAFB"}}>
              <div style={{width:280,flexShrink:0,padding:"10px 16px",fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",borderRight:"1px solid #F3F4F6"}}>Actividad</div>
              <div style={{display:"flex"}}>
                {weeks.map((w,i)=>(
                  <div key={i} style={{width:CW*7,textAlign:"center",padding:"10px 4px",fontSize:11,color:"#9CA3AF",borderRight:"1px solid #F3F4F6"}}>
                    S{i+1} · {w.getDate()}/{w.getMonth()+1}
                  </div>
                ))}
              </div>
            </div>
            {acts.map(act=>{
              const o=off(act.date), pc=getPhaseColor(proj?.type,act.phase);
              return(
                <div key={act.id} style={{display:"flex",borderBottom:"1px solid #F9FAFB"}}>
                  <div style={{width:280,flexShrink:0,padding:"10px 16px",borderRight:"1px solid #F3F4F6"}}>
                    <p style={{margin:0,fontSize:12,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{act.description}</p>
                    <p style={{margin:0,fontSize:11,color:pc}}>{act.phase} · <span style={{color:getStatusColor(act.status)}}>{act.status}</span></p>
                  </div>
                  <div style={{position:"relative",flex:1,height:RH}}>
                    {weeks.map((_,i)=><div key={i} style={{position:"absolute",left:i*CW*7,top:0,bottom:0,width:CW*7,borderRight:"1px solid #F9FAFB"}}/>)}
                    <div style={{position:"absolute",left:o*CW+2,top:10,height:RH-20,width:Math.max(CW-4,20),background:pc,opacity:act.status==="Completado"?0.4:1,borderRadius:6,display:"flex",alignItems:"center",paddingLeft:4}}>
                      <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>{act.status==="Completado"?"✓":""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

export default GanttView;

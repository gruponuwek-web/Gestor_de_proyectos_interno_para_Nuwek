import { useState } from "react";
import { getPhasesForType } from "../../utils/helpers";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";

function ProjectsView({ projects, activities, onAdd, onEdit, onDelete, onGoGantt, onGoActivities }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const STATUS_COLOR = { "Activo":"#16A34A","En pausa":"#D97706","Completado":"#6B7280" };
  const STATUS_BG    = { "Activo":"#F0FDF4","En pausa":"#FFFBEB","Completado":"#F9FAFB" };

  return (
    <div style={{padding:32,background:"#F9FAFB",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:"#111827"}}>Proyectos</h1>
          <p style={{margin:"4px 0 0",fontSize:13,color:"#9CA3AF"}}>{projects.length} proyectos activos</p>
        </div>
        <button onClick={onAdd} style={{padding:"10px 20px",background:"#1B4332",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Nuevo proyecto</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
        {projects.map(proj=>{
          const totalActs = activities.filter(a=>a.projectId===proj.id).length;
          const doneActs  = activities.filter(a=>a.projectId===proj.id&&a.status==="Completado").length;
          const pct = totalActs>0?Math.round(doneActs/totalActs*100):0;
          const endDate = proj.startDate && proj.durationWeeks
            ? (() => { const d=new Date(proj.startDate); d.setDate(d.getDate()+proj.durationWeeks*7); return d.toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}); })()
            : null;

          return (
            <div key={proj.id} onClick={()=>onGoActivities(proj.id)} style={{background:"#fff",borderRadius:14,border:"1px solid #F3F4F6",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",overflow:"hidden",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.05)"}>
              {/* Color bar */}
              <div style={{height:5,background:proj.color}} />
              <div style={{padding:20}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{width:10,height:10,borderRadius:"50%",background:proj.color,flexShrink:0,marginTop:2}} />
                    <div>
                      <h3 style={{margin:0,fontSize:16,fontWeight:800,color:"#111827"}}>{proj.name}</h3>
                      <span style={{fontSize:11,fontWeight:600,color:"#9CA3AF"}}>{proj.type}</span>
                    </div>
                  </div>
                  <span style={{background:STATUS_BG[proj.status]||"#F9FAFB",color:STATUS_COLOR[proj.status]||"#6B7280",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>
                    {proj.status||"Activo"}
                  </span>
                </div>

                {/* Dates + billing */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {proj.startDate&&(
                    <div style={{background:"#F9FAFB",borderRadius:8,padding:"8px 12px"}}>
                      <p style={{margin:0,fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Inicio</p>
                      <p style={{margin:"2px 0 0",fontSize:12,fontWeight:600,color:"#374151"}}>{new Date(proj.startDate).toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"})}</p>
                    </div>
                  )}
                  {endDate&&(
                    <div style={{background:"#F9FAFB",borderRadius:8,padding:"8px 12px"}}>
                      <p style={{margin:0,fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Fin estimado</p>
                      <p style={{margin:"2px 0 0",fontSize:12,fontWeight:600,color:"#374151"}}>{endDate}</p>
                    </div>
                  )}
                  {proj.billingAmount&&(
                    <div style={{background:"#FFFBEB",borderRadius:8,padding:"8px 12px"}}>
                      <p style={{margin:0,fontSize:10,color:"#92400E",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Facturación</p>
                      <p style={{margin:"2px 0 0",fontSize:12,fontWeight:700,color:"#92400E"}}>${Number(proj.billingAmount).toLocaleString("es-MX")} MXN</p>
                      {proj.billingNotes&&<p style={{margin:"1px 0 0",fontSize:10,color:"#B45309"}}>{proj.billingNotes}</p>}
                    </div>
                  )}
                  {proj.durationWeeks&&(
                    <div style={{background:"#F9FAFB",borderRadius:8,padding:"8px 12px"}}>
                      <p style={{margin:0,fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>Duración</p>
                      <p style={{margin:"2px 0 0",fontSize:12,fontWeight:600,color:"#374151"}}>{proj.durationWeeks} semanas</p>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:"#6B7280"}}>Avance · {totalActs} actividades</span>
                    <span style={{fontSize:12,fontWeight:700,color:proj.color}}>{pct}%</span>
                  </div>
                  <div style={{height:6,background:"#F3F4F6",borderRadius:99}}>
                    <div style={{width:`${pct}%`,height:"100%",background:proj.color,borderRadius:99,transition:"width 0.4s"}} />
                  </div>
                </div>

                {/* Teams */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                  <div>
                    <p style={{margin:"0 0 4px",fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>Cliente</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {(proj.clientMembers||[]).map(m=>(
                        <span key={m} style={{background:"#EFF6FF",color:"#1D4ED8",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:500}}>{m}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{margin:"0 0 4px",fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>Nuwek</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {(proj.nuwekMembers||[]).map(m=>(
                        <span key={m} style={{background:"#F0FDF4",color:"#166534",borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:500}}>{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:8,borderTop:"1px solid #F9FAFB",paddingTop:14}}>
                  <button onClick={()=>onGoGantt(proj.id)} style={{flex:1,padding:"8px 0",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}>Ver Gantt</button>
                  <button onClick={()=>onEdit(proj)} style={{flex:1,padding:"8px 0",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}>✏️ Editar</button>
                  <button onClick={()=>setConfirmDelete({ id: proj.id, name: proj.name })} style={{padding:"8px 12px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,fontWeight:600,color:"#DC2626",cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {confirmDelete && (
        <ConfirmDeleteModal
          activityName={confirmDelete.name}
          isRecurring={false}
          entityLabel="proyecto"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
        />
      )}
    </div>
  );
}

export default ProjectsView;

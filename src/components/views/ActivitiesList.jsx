import { useState, useMemo } from "react";
import { STATUSES } from "../../constants";
import { getPhasesForType, getPhaseColor, expandRecurring, todayStr, tomorrowStr, getStatusColor, getStatusBg, getPriorityColor } from "../../utils/helpers";
import StatusBadge from "../ui/StatusBadge";
import FollowUpModal from "../modals/FollowUpModal";
import ConfirmDeleteModal from "../modals/ConfirmDeleteModal";

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str + "T12:00:00");
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("es-MX", { day:"numeric", month:"short", ...(!sameYear && { year:"2-digit" }) });
}

function fmtTime(str) {
  if (!str) return "";
  // Si es ISO datetime (ej. "1899-12-30T16:06:36.000Z"), extrae solo HH:MM
  if (str.includes("T")) {
    const d = new Date(str);
    return d.toISOString().slice(11, 16);
  }
  // Si ya es "HH:MM" o "HH:MM:SS", toma los primeros 5 chars
  return str.slice(0, 5);
}

function ActivityRow({ act, projects, onEdit, onConfirmDelete, onStatusChange, onCompleteOccurrence, onUncompleteOccurrence, onFollowUp, onDeleteOccurrence, onDeleteSeries }) {
  const pr = projects.find(p=>p.id===act.projectId), pc = getPhaseColor(pr?.type, act.phase);
  const ng = (act.nuwekGuests||[]).length, cg = (act.clientGuests||[]).length;
  return (
    <div style={{ background:"#fff", border:"1px solid #F3F4F6", borderRadius:10, padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:12, boxShadow:"0 1px 2px rgba(0,0,0,0.04)", marginBottom:6 }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="#E5E7EB"} onMouseLeave={e=>e.currentTarget.style.borderColor="#F3F4F6"}>
      <span style={{ width:10,height:10,borderRadius:"50%",background:getPriorityColor(act.priority),flexShrink:0,marginTop:4 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
          <p style={{ margin:0, fontSize:14, fontWeight:600, color:"#111827" }}>{act.description}</p>
          {act.recurrence&&act.recurrence!=="No se repite"&&
            <span style={{ background:"#F5F3FF",color:"#7C3AED",borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:600 }}>↻ {act.recurrence}</span>}
          {act.occurrenceIndex&&
            <span style={{ background:"#EDE9FE",color:"#5B21B6",borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:700 }}>#{act.occurrenceIndex}</span>}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", fontSize:12, color:"#9CA3AF" }}>
          <span style={{color:pr?.color||"#6B7280",fontWeight:600}}>{pr?.name}</span>
          <span style={{color:pc}}>· {act.phase}</span>
          <span>· {fmtDate(act.date)}{act.timeStart?` ${fmtTime(act.timeStart)}${act.timeEnd?`–${fmtTime(act.timeEnd)}`:""}`:""}</span>
          <span>· {act.modality} · {act.interactionType}</span>
          {act.nuwekResponsible&&<span>· 🟡 {act.nuwekResponsible}{ng?` +${ng}`:""}</span>}
          {act.clientResponsible&&<span>· 👤 {act.clientResponsible}{cg?` +${cg}`:""}</span>}
        </div>
        {act.notes&&<p style={{margin:"4px 0 0",fontSize:12,color:"#9CA3AF",fontStyle:"italic"}}>{act.notes}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <StatusBadge status={act.status} onChange={newStatus => {
          const baseId = act.id.includes("_") ? act.id.split("_").slice(0,-1).join("_") : act.id;
          const isRecurring = act.recurrence && act.recurrence !== "No se repite";
          if (act.seriesId) {
            // Nuevo modelo: ocurrencia independiente → actualizar status directo
            onStatusChange(act.id, newStatus);
          } else if (newStatus === "Completado" && isRecurring) {
            onCompleteOccurrence(baseId, act.date);
          } else if (isRecurring && act.status === "Completado" && newStatus !== "Completado") {
            onUncompleteOccurrence(baseId, act.date);
          } else {
            onStatusChange(baseId, newStatus);
          }
          if (newStatus === "Completado") onFollowUp(act);
        }} />
        <button onClick={()=>onEdit(act)} title="Editar" style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#9CA3AF",padding:4 }} onMouseEnter={e=>e.currentTarget.style.color="#374151"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>✏️</button>
        <button onClick={()=>{
          const baseId = act.id.includes("_") ? act.id.split("_").slice(0,-1).join("_") : act.id;
          const isRecurring = act.recurrence && act.recurrence !== "No se repite";
          onConfirmDelete({ id: act.id, baseId, name: act.description, isRecurring, seriesId: act.seriesId || null, count: act.recurrenceCount || 12, occurrenceDate: act.date });
        }} title="Eliminar" style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#9CA3AF",padding:4 }} onMouseEnter={e=>e.currentTarget.style.color="#DC2626"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>🗑</button>
      </div>
    </div>
  );
}

function GroupSection({ title, acts, count, accent, bg, icon, defaultOpen=true, projects, onEdit, onConfirmDelete, onStatusChange, onCompleteOccurrence, onUncompleteOccurrence, onFollowUp, onDeleteOccurrence, onDeleteSeries }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:16 }}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:bg, borderRadius:open?"10px 10px 0 0":10, cursor:"pointer", userSelect:"none", border:`1px solid ${accent}22` }}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{ fontWeight:700, fontSize:13, color:accent, flex:1, textTransform:"uppercase", letterSpacing:"0.05em" }}>{title}</span>
        <span style={{ background:accent, color:"#fff", borderRadius:20, padding:"1px 9px", fontSize:11, fontWeight:700 }}>{count}</span>
        <span style={{ fontSize:12, color:accent, opacity:0.6, transform:open?"rotate(0)":"rotate(-90deg)", transition:"transform 0.2s" }}>▾</span>
      </div>
      {open && (
        <div style={{ border:`1px solid ${accent}22`, borderTop:"none", borderRadius:"0 0 10px 10px", padding:"12px 12px 6px" }}>
          {acts.length===0
            ? <p style={{ margin:0, textAlign:"center", color:"#D1D5DB", fontSize:12, padding:"16px 0" }}>Sin actividades aquí</p>
            : acts.map(a => <ActivityRow key={a.id} act={a} projects={projects} onEdit={onEdit} onConfirmDelete={onConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={onFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />)
          }
        </div>
      )}
    </div>
  );
}

function ActivitiesList({ projects, activities, onNew, onEdit, onDelete, onDeleteOccurrence, onDeleteSeries, onStatusChange, onCompleteOccurrence, onUncompleteOccurrence, onSaveActivity }) {
  const [fp,setFp]=useState("todos"), [fph,setFph]=useState("Todas"), [q,setQ]=useState("");
  const [fNuwek,setFNuwek]=useState("Todos"), [fStatus,setFStatus]=useState("Todos"), [fType,setFType]=useState("Todos");
  const [followUp,setFollowUp]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);

  const today = todayStr();
  const tmrwStr = tomorrowStr();

  const allExpanded = useMemo(()=>activities.flatMap(expandRecurring),[activities]);

  const filtered = useMemo(()=>{
    let a = allExpanded;
    if(fp!=="todos") a=a.filter(x=>x.projectId===fp);
    if(fph!=="Todas") a=a.filter(x=>x.phase===fph);
    if(fNuwek!=="Todos") a=a.filter(x=>x.nuwekResponsible===fNuwek || (x.nuwekGuests||[]).includes(fNuwek));
    if(fStatus!=="Todos") a=a.filter(x=>x.status===fStatus);
    if(fType!=="Todos") a=a.filter(x=>x.interactionType===fType);
    if(q) a=a.filter(x=>x.description.toLowerCase().includes(q.toLowerCase()));
    return a;
  },[allExpanded,fp,fph,fNuwek,fStatus,fType,q]);

  const byDate  = (a, b) => (a.date||"").localeCompare(b.date||"") || (a.timeStart||"").localeCompare(b.timeStart||"");
  const byDateD = (a, b) => -byDate(a, b);

  const groups = {
    overdue:  filtered.filter(a=>a.date<today    && a.status!=="Completado").sort(byDateD),
    today:    filtered.filter(a=>a.date===today   && a.status!=="Completado").sort(byDate),
    tomorrow: filtered.filter(a=>a.date===tmrwStr && a.status!=="Completado").sort(byDate),
    upcoming: filtered.filter(a=>a.date>tmrwStr   && a.status!=="Completado").sort(byDate),
    done:     filtered.filter(a=>a.status==="Completado").sort(byDateD),
  };

  const sp=projects.find(p=>p.id===fp);
  const phases=sp?getPhasesForType(sp.type).map(p=>p.name):[];
  const allNuwek=[...new Set(projects.flatMap(p=>p.nuwekMembers))].sort();
  const selStyle={ padding:"8px 12px", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", fontSize:13, color:"#374151", cursor:"pointer" };

  return(
    <div style={{ padding:32, background:"#F9FAFB", minHeight:"100vh" }}>
      {/* Toolbar row 1 */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", flex:1 }}>Actividades</h1>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{ ...selStyle, width:150 }} />
        <button onClick={()=>onNew({})} style={{ padding:"10px 20px",background:"#1B4332",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer" }}>+ Actividad</button>
      </div>
      {/* Toolbar row 2 - filters */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        <span style={{fontSize:12,color:"#9CA3AF",fontWeight:600,marginRight:4}}>Filtros:</span>
        <select style={selStyle} value={fp} onChange={e=>{setFp(e.target.value);setFph("Todas");}}>
          <option value="todos">Todos los proyectos</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {sp&&<select style={selStyle} value={fph} onChange={e=>setFph(e.target.value)}>
          <option>Todas las fases</option>{phases.map(ph=><option key={ph}>{ph}</option>)}
        </select>}
        <select style={selStyle} value={fNuwek} onChange={e=>setFNuwek(e.target.value)}>
          <option value="Todos">Equipo Nuwek</option>
          {allNuwek.map(m=><option key={m}>{m}</option>)}
        </select>
        <select style={{...selStyle, background:fStatus!=="Todos"?getStatusBg(fStatus):"#fff", color:fStatus!=="Todos"?getStatusColor(fStatus):"#374151", fontWeight:fStatus!=="Todos"?700:400, borderColor:fStatus!=="Todos"?getStatusColor(fStatus)+"44":"#E5E7EB"}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="Todos">Todos los estados</option>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={selStyle} value={fType} onChange={e=>setFType(e.target.value)}>
          <option value="Todos">Interna + Con cliente</option>
          <option value="Interna">Solo internas</option>
          <option value="Con cliente">Solo con cliente</option>
        </select>
        {(fp!=="todos"||fph!=="Todas"||fNuwek!=="Todos"||fStatus!=="Todos"||fType!=="Todos"||q)&&(
          <button onClick={()=>{setFp("todos");setFph("Todas");setFNuwek("Todos");setFStatus("Todos");setFType("Todos");setQ("");}}
            style={{padding:"8px 12px",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Groups */}
      <GroupSection title="Vencidas" acts={groups.overdue}  count={groups.overdue.length}  accent="#DC2626" bg="#FEF2F2" icon="⚠️" defaultOpen={true}  projects={projects} onEdit={onEdit} onConfirmDelete={setConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={setFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />
      <GroupSection title="Hoy"      acts={groups.today}    count={groups.today.length}    accent="#2563EB" bg="#EFF6FF" icon="📋" defaultOpen={true}  projects={projects} onEdit={onEdit} onConfirmDelete={setConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={setFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />
      <GroupSection title="Mañana"   acts={groups.tomorrow} count={groups.tomorrow.length} accent="#7C3AED" bg="#F5F3FF" icon="📅" defaultOpen={true}  projects={projects} onEdit={onEdit} onConfirmDelete={setConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={setFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />
      <GroupSection title="Próximas" acts={groups.upcoming} count={groups.upcoming.length} accent="#D97706" bg="#FFFBEB" icon="🗓" defaultOpen={false} projects={projects} onEdit={onEdit} onConfirmDelete={setConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={setFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />
      <GroupSection title="Realizadas" acts={groups.done}   count={groups.done.length}    accent="#16A34A" bg="#F0FDF4" icon="✅" defaultOpen={false} projects={projects} onEdit={onEdit} onConfirmDelete={setConfirmDelete} onStatusChange={onStatusChange} onCompleteOccurrence={onCompleteOccurrence} onUncompleteOccurrence={onUncompleteOccurrence} onFollowUp={setFollowUp} onDeleteOccurrence={onDeleteOccurrence} onDeleteSeries={onDeleteSeries} />

      {confirmDelete && (
        <ConfirmDeleteModal
          activityName={confirmDelete.name}
          isRecurring={confirmDelete.isRecurring}
          recurrenceCount={confirmDelete.count}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.seriesId && onDeleteSeries) {
              // Serie nueva: eliminar todas las ocurrencias por seriesId
              onDeleteSeries(confirmDelete.seriesId);
            } else {
              onDelete(confirmDelete.baseId || confirmDelete.id);
            }
            setConfirmDelete(null);
          }}
          onConfirmOne={confirmDelete.isRecurring
            ? () => {
                if (confirmDelete.seriesId) {
                  // Serie nueva: eliminar solo esta ocurrencia individual
                  onDelete(confirmDelete.id);
                } else {
                  // Actividad antigua: excluir fecha
                  onDeleteOccurrence(confirmDelete.baseId, confirmDelete.occurrenceDate);
                }
                setConfirmDelete(null);
              }
            : undefined}
        />
      )}
      {followUp && (
        <FollowUpModal
          completedAct={followUp}
          onSkip={() => setFollowUp(null)}
          onSchedule={(nextAct) => { onNew({ fullAct: nextAct }); setFollowUp(null); }}
          onSaveDirect={async (act, excludeDate) => {
            const baseId = followUp.id.includes("_") ? followUp.id.split("_").slice(0,-1).join("_") : followUp.id;
            if (excludeDate) await onDeleteOccurrence(baseId, excludeDate);
            await onSaveActivity(act);
            setFollowUp(null);
          }}
        />
      )}

    </div>
  );
}

// ─── APP
// ─── MEMBER INPUT ─────────────────────────────────────────────────────────────

export default ActivitiesList;
import { useState, useEffect, useRef, useMemo } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PROJECTS_INIT = [
  { id: "hulux",    name: "HULUX",     type: "SBOS", clientMembers: ["Erick"],                           nuwekMembers: ["Carlos","Jaime","Daniel","Yun","Estrella"], color: "#7C3AED" },
  { id: "jaleso",   name: "JALESO",    type: "EVA+", clientMembers: ["Víctor","Alejandro"],               nuwekMembers: ["Carlos","Yun","Estrella"],                  color: "#D97706" },
  { id: "adnmedia", name: "ADN Media", type: "SBOS", clientMembers: ["Salvador"],                        nuwekMembers: ["Carlos","Jaime","Daniel","Yun","Estrella"], color: "#059669" },
  { id: "faw",      name: "FAW",       type: "EVA+", clientMembers: ["Abby","Julio","Sergio","Ernesto"],  nuwekMembers: ["Carlos","Yun","Estrella"],                  color: "#DC2626" },
  { id: "srm",      name: "SRM",       type: "EVA+", clientMembers: ["Javier","Tania"],                  nuwekMembers: ["Carlos","Estrella"],                        color: "#0EA5E9" },
];

const EVA_PHASES  = ["ADN Comercial","Capacitación","Coaching y WBR"];
const SBOS_PHASES = [
  { name: "Estratégico",               color: "#EAB308" },
  { name: "Comercial",                 color: "#16A34A" },
  { name: "Estructura Organizacional", color: "#DC2626" },
  { name: "Operativo",                 color: "#9333EA" },
  { name: "Analítico",                 color: "#2563EB" },
];
const PRIORITIES         = ["Alta","Media","Baja"];
const STATUSES           = ["Pendiente","En progreso","Completado","Reagendado"];
const MODALITIES         = ["Presencial","En línea","Híbrida"];
const INTERACTION_TYPES  = ["Interna","Con cliente"];
const RECURRENCE_OPTIONS = ["No se repite","Semanal","Quincenal","Mensual"];
const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPhasesForType(type) {
  return type === "EVA+" ? EVA_PHASES.map(n => ({ name: n, color: "#D97706" })) : SBOS_PHASES;
}
function getPhaseColor(type, name) {
  if (type === "EVA+") return "#D97706";
  return SBOS_PHASES.find(s => s.name === name)?.color || "#6B7280";
}
function generateId() { return Math.random().toString(36).slice(2, 10); }
function expandRecurring(act) {
  if (!act.recurrence || act.recurrence === "No se repite") return [act];
  const gap = { Semanal:7, Quincenal:14, Mensual:30 }[act.recurrence] || 7;
  const count = parseInt(act.recurrenceCount) || 12;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(act.date); d.setDate(d.getDate() + i * gap);
    return { ...act, id: `${act.id}_${i}`, date: d.toISOString().split("T")[0], isChild: i > 0 };
  });
}
function todayStr() { return new Date().toISOString().split("T")[0]; }
function getStatusColor(s) {
  return { "Completado":"#16A34A","En progreso":"#2563EB","Pendiente":"#D97706","Reagendado":"#DC2626" }[s] || "#6B7280";
}
function getStatusBg(s) {
  return { "Completado":"#DCFCE7","En progreso":"#DBEAFE","Pendiente":"#FEF9C3","Reagendado":"#FEE2E2" }[s] || "#F3F4F6";
}
function getPriorityColor(p) {
  return { "Alta":"#DC2626","Media":"#D97706","Baja":"#16A34A" }[p] || "#6B7280";
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
async function loadData() {
  try { const r = await window.storage.get("nuwek_v2"); return r ? JSON.parse(r.value) : []; } catch { return []; }
}
async function saveData(acts) {
  try { await window.storage.set("nuwek_v2", JSON.stringify(acts)); } catch {}
}
async function loadProjects() {
  try { const r = await window.storage.get("nuwek_projects"); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function saveProjects(projects) {
  try { await window.storage.set("nuwek_projects", JSON.stringify(projects)); } catch {}
}

const COLOR_OPTIONS = ["#7C3AED","#D97706","#059669","#DC2626","#0EA5E9","#EC4899","#F59E0B","#6366F1","#14B8A6","#84CC16"];
const NUWEK_TEAM_DEFAULT = ["Carlos","Jaime","Daniel","Yun","Estrella"];

// ─── MULTI SELECT ─────────────────────────────────────────────────────────────
function MultiSelect({ options, selected, onChange, placeholder = "Agregar..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (m) => onChange(selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => options.length > 0 && setOpen(o => !o)}
        style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:8, padding:"8px 12px", cursor: options.length ? "pointer":"default", minHeight:38, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, flex:1 }}>
          {selected.length === 0
            ? <span style={{ color:"#9CA3AF", fontSize:13 }}>{options.length === 0 ? "Sin opciones" : placeholder}</span>
            : selected.map(m => (
                <span key={m} style={{ background:"#F0FDF4", color:"#166534", border:"1px solid #BBF7D0", borderRadius:20, padding:"2px 10px", fontSize:12, display:"flex", alignItems:"center", gap:4 }}>
                  {m}
                  <button onClick={e => { e.stopPropagation(); toggle(m); }} style={{ background:"none", border:"none", cursor:"pointer", color:"#166534", lineHeight:1, fontSize:14 }}>×</button>
                </span>
              ))
          }
        </div>
        {options.length > 0 && <span style={{ color:"#9CA3AF", fontSize:11 }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && (
        <div style={{ position:"absolute", zIndex:100, width:"100%", marginTop:4, background:"#fff", border:"1px solid #E5E7EB", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.1)", overflow:"hidden" }}>
          {options.map(m => (
            <div key={m} onClick={() => toggle(m)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background: selected.includes(m) ? "#F0FDF4" : "#fff", color: selected.includes(m) ? "#166534" : "#374151", fontSize:13 }}
              onMouseEnter={e => e.currentTarget.style.background = selected.includes(m) ? "#DCFCE7" : "#F9FAFB"}
              onMouseLeave={e => e.currentTarget.style.background = selected.includes(m) ? "#F0FDF4" : "#fff"}>
              <span style={{ width:16, height:16, borderRadius:4, border: selected.includes(m) ? "none" : "1.5px solid #D1D5DB", background: selected.includes(m) ? "#16A34A" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", flexShrink:0 }}>
                {selected.includes(m) ? "✓" : ""}
              </span>
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY FORM ────────────────────────────────────────────────────────────
function ActivityForm({ projects, editActivity, onSave, onCancel }) {
  const blank = {
    id:"", projectId: projects[0]?.id||"", phase:"", description:"",
    clientResponsible:"", nuwekResponsible:"", clientGuests:[], nuwekGuests:[],
    priority:"Media", date: todayStr(), timeStart:"", timeEnd:"",
    interactionType:"Con cliente", modality:"En línea",
    recurrence:"No se repite", recurrenceCount:12,
    status:"Pendiente", notes:"", originalDate:""
  };
  const [form, setForm] = useState(editActivity || blank);
  const project = projects.find(p => p.id === form.projectId);
  const phases = project ? getPhasesForType(project.type) : [];
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  useEffect(() => {
    if (project && phases.length && !phases.find(p => p.name === form.phase))
      set("phase", phases[0].name);
  }, [form.projectId]);
  useEffect(() => { set("clientGuests", (form.clientGuests||[]).filter(x => x !== form.clientResponsible)); }, [form.clientResponsible]);
  useEffect(() => { set("nuwekGuests", (form.nuwekGuests||[]).filter(x => x !== form.nuwekResponsible)); }, [form.nuwekResponsible]);

  const inp = { width:"100%", background:"#fff", border:"1px solid #E5E7EB", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box" };
  const lbl = { display:"block", fontSize:11, fontWeight:600, color:"#6B7280", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.04em" };
  const sel = { ...inp, cursor:"pointer" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:680, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#111827" }}>{editActivity ? "Editar actividad" : "Nueva actividad"}</h2>
          <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#9CA3AF", lineHeight:1 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding:24, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Proyecto</label>
            <select style={sel} value={form.projectId} onChange={e => set("projectId", e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} · {p.type}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Fase</label>
            <select style={sel} value={form.phase} onChange={e => set("phase", e.target.value)}>
              {phases.map(ph => <option key={ph.name}>{ph.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Prioridad</label>
            <select style={sel} value={form.priority} onChange={e => set("priority", e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Descripción *</label>
            <input style={inp} value={form.description} onChange={e => set("description", e.target.value)} placeholder="¿Qué se va a hacer?" />
          </div>

          <div>
            <label style={lbl}>Responsable cliente</label>
            <select style={sel} value={form.clientResponsible} onChange={e => set("clientResponsible", e.target.value)}>
              <option value="">-- Selecciona --</option>
              {project?.clientMembers.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Invitados cliente <span style={{ fontWeight:400, textTransform:"none" }}>(opcional)</span></label>
            <MultiSelect
              options={(project?.clientMembers||[]).filter(m => m !== form.clientResponsible)}
              selected={form.clientGuests||[]} onChange={v => set("clientGuests",v)} />
          </div>

          <div>
            <label style={lbl}>Responsable Nuwek</label>
            <select style={sel} value={form.nuwekResponsible} onChange={e => set("nuwekResponsible", e.target.value)}>
              <option value="">-- Selecciona --</option>
              {project?.nuwekMembers.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Invitados Nuwek <span style={{ fontWeight:400, textTransform:"none" }}>(opcional)</span></label>
            <MultiSelect
              options={(project?.nuwekMembers||[]).filter(m => m !== form.nuwekResponsible)}
              selected={form.nuwekGuests||[]} onChange={v => set("nuwekGuests",v)} />
          </div>

          <div>
            <label style={lbl}>Fecha *</label>
            <input type="date" style={inp} value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>Inicio</label>
              <input type="time" style={inp} value={form.timeStart} onChange={e => set("timeStart", e.target.value)} />
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>Fin</label>
              <input type="time" style={inp} value={form.timeEnd} onChange={e => set("timeEnd", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Tipo</label>
            <select style={sel} value={form.interactionType} onChange={e => set("interactionType", e.target.value)}>
              {INTERACTION_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Modalidad</label>
            <select style={sel} value={form.modality} onChange={e => set("modality", e.target.value)}>
              {MODALITIES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Se repite</label>
            <select style={sel} value={form.recurrence} onChange={e => set("recurrence", e.target.value)}>
              {RECURRENCE_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          {form.recurrence !== "No se repite" && (
            <div>
              <label style={lbl}>Repeticiones</label>
              <input type="number" min={2} max={52} style={inp} value={form.recurrenceCount} onChange={e => set("recurrenceCount", e.target.value)} />
            </div>
          )}

          <div>
            <label style={lbl}>Estado</label>
            <select
              style={{ ...sel, background:getStatusBg(form.status), color:getStatusColor(form.status), fontWeight:700, borderColor:getStatusColor(form.status)+"44" }}
              value={form.status} onChange={e => set("status", e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s} style={{background:"#fff",color:getStatusColor(s),fontWeight:700}}>{s}</option>)}
            </select>
          </div>
          {form.status === "Reagendado" && (
            <div>
              <label style={lbl}>Fecha original</label>
              <input type="date" style={inp} value={form.originalDate} onChange={e => set("originalDate", e.target.value)} />
            </div>
          )}

          <div style={{ gridColumn:"1/-1" }}>
            <label style={lbl}>Notas</label>
            <textarea style={{ ...inp, height:80, resize:"none" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Contexto adicional..." />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid #F3F4F6", display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onCancel} style={{ padding:"9px 18px", borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", color:"#374151", fontSize:13, cursor:"pointer", fontWeight:500 }}>Cancelar</button>
          <button onClick={() => { if(!form.description||!form.date) return; onSave({...form, id:form.id||generateId()}); }}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#1B4332", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:600 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return <span style={{ background: bg||"#F3F4F6", color: color||"#374151", borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{label}</span>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ projects, activities, onNewActivity, onEdit }) {
  const today = todayStr();
  const tmrw = new Date(); tmrw.setDate(tmrw.getDate()+1);
  const tmrwStr = tmrw.toISOString().split("T")[0];
  const all = useMemo(() => activities.flatMap(expandRecurring), [activities]);
  const todayActs  = all.filter(a => a.date===today    && a.status!=="Completado");
  const tmrwActs   = all.filter(a => a.date===tmrwStr  && a.status!=="Completado");
  const overdueActs= all.filter(a => a.date<today      && a.status!=="Completado");

  function getPhaseProgress(proj) {
    const pa = activities.filter(a => a.projectId===proj.id);
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
          const total = activities.filter(a=>a.projectId===proj.id).length;
          const done  = activities.filter(a=>a.projectId===proj.id&&a.status==="Completado").length;
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
function CalendarView({ projects, activities, onNewActivity, onEdit }) {
  const [cur, setCur]     = useState(new Date());
  const [fp, setFp]       = useState("todos");
  const [fNuwek, setFNuwek] = useState("Todos");
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
                {da.length>3&&<div style={{fontSize:10,color:"#9CA3AF",textAlign:"center"}}>+{da.length-3} más</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ─── FOLLOW-UP MODAL ─────────────────────────────────────────────────────────
function FollowUpModal({ completedAct, onSchedule, onSkip }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.35)",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:16,padding:32,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.15)",textAlign:"center" }}>
        <div style={{ fontSize:36,marginBottom:12 }}>✅</div>
        <h3 style={{ margin:"0 0 8px",fontSize:17,fontWeight:800,color:"#111827" }}>¡Actividad completada!</h3>
        <p style={{ margin:"0 0 24px",fontSize:13,color:"#6B7280",lineHeight:1.5 }}>
          <strong style={{color:"#111827"}}>{completedAct.description}</strong><br/>
          ¿Quieres agendar una siguiente actividad para este proyecto?
        </p>
        <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
          <button onClick={onSkip}
            style={{ padding:"10px 20px",borderRadius:8,border:"1px solid #E5E7EB",background:"#fff",color:"#374151",fontSize:13,fontWeight:500,cursor:"pointer" }}>
            No por ahora
          </button>
          <button onClick={onSchedule}
            style={{ padding:"10px 20px",borderRadius:8,border:"none",background:"#1B4332",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer" }}>
            Sí, agendar siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CLICKABLE STATUS BADGE (dropdown) ───────────────────────────────────────
function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative" }} onClick={e=>e.stopPropagation()}>
      <span onClick={()=>setOpen(o=>!o)}
        style={{ background:getStatusBg(status),color:getStatusColor(status),borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",border:`1px solid ${getStatusColor(status)}33`,display:"inline-flex",alignItems:"center",gap:4 }}>
        {status} <span style={{fontSize:9,opacity:0.6}}>▾</span>
      </span>
      {open && (
        <div style={{ position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",border:"1px solid #E5E7EB",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200,overflow:"hidden",minWidth:150 }}>
          {["Pendiente","En progreso","Completado","Reagendado"].map(s => (
            <div key={s} onClick={()=>{ onChange(s); setOpen(false); }}
              style={{ padding:"9px 14px",fontSize:12,fontWeight:600,color:getStatusColor(s),background:status===s?getStatusBg(s):"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid #F9FAFB" }}
              onMouseEnter={e=>e.currentTarget.style.background=getStatusBg(s)} onMouseLeave={e=>e.currentTarget.style.background=status===s?getStatusBg(s):"#fff"}>
              <span style={{width:7,height:7,borderRadius:"50%",background:getStatusColor(s),flexShrink:0}}/>
              {s}
              {status===s && <span style={{marginLeft:"auto",fontSize:10}}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITIES LIST ──────────────────────────────────────────────────────────
function ActivityRow({ act, projects, onEdit, onDelete, onStatusChange, onFollowUp }) {
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
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 12px", fontSize:12, color:"#9CA3AF" }}>
          <span style={{color:pr?.color||"#6B7280",fontWeight:600}}>{pr?.name}</span>
          <span style={{color:pc}}>· {act.phase}</span>
          <span>· {act.date}{act.timeStart?` ${act.timeStart}${act.timeEnd?`–${act.timeEnd}`:""}`:""}</span>
          <span>· {act.modality} · {act.interactionType}</span>
          {act.nuwekResponsible&&<span>· 🟡 {act.nuwekResponsible}{ng?` +${ng}`:""}</span>}
          {act.clientResponsible&&<span>· 👤 {act.clientResponsible}{cg?` +${cg}`:""}</span>}
        </div>
        {act.notes&&<p style={{margin:"4px 0 0",fontSize:12,color:"#9CA3AF",fontStyle:"italic"}}>{act.notes}</p>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <StatusBadge status={act.status} onChange={newStatus => {
          onStatusChange(act.id, newStatus);
          if(newStatus==="Completado") onFollowUp(act);
        }} />
        <button onClick={()=>onEdit(act)} title="Editar" style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#9CA3AF",padding:4 }} onMouseEnter={e=>e.currentTarget.style.color="#374151"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>✏️</button>
        <button onClick={()=>onDelete(act.id)} title="Eliminar" style={{ background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#9CA3AF",padding:4 }} onMouseEnter={e=>e.currentTarget.style.color="#DC2626"} onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>🗑</button>
      </div>
    </div>
  );
}

function GroupSection({ title, acts, count, accent, bg, icon, defaultOpen=true, projects, onEdit, onDelete, onStatusChange, onFollowUp }) {
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
            : acts.map(a => <ActivityRow key={a.id} act={a} projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={onFollowUp} />)
          }
        </div>
      )}
    </div>
  );
}

function ActivitiesList({ projects, activities, onNew, onEdit, onDelete, onStatusChange }) {
  const [fp,setFp]=useState("todos"), [fph,setFph]=useState("Todas"), [q,setQ]=useState("");
  const [fNuwek,setFNuwek]=useState("Todos"), [fStatus,setFStatus]=useState("Todos"), [fType,setFType]=useState("Todos");
  const [followUp,setFollowUp]=useState(null);

  const today = todayStr();
  const tmrw = new Date(); tmrw.setDate(tmrw.getDate()+1);
  const tmrwStr = tmrw.toISOString().split("T")[0];

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

  const groups = {
    overdue:  filtered.filter(a=>a.date<today    && a.status!=="Completado"),
    today:    filtered.filter(a=>a.date===today   && a.status!=="Completado"),
    tomorrow: filtered.filter(a=>a.date===tmrwStr && a.status!=="Completado"),
    upcoming: filtered.filter(a=>a.date>tmrwStr   && a.status!=="Completado"),
    done:     filtered.filter(a=>a.status==="Completado"),
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
      <GroupSection title="Vencidas" acts={groups.overdue}  count={groups.overdue.length}  accent="#DC2626" bg="#FEF2F2" icon="⚠️" defaultOpen={true}  projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={setFollowUp} />
      <GroupSection title="Hoy"      acts={groups.today}    count={groups.today.length}    accent="#2563EB" bg="#EFF6FF" icon="📋" defaultOpen={true}  projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={setFollowUp} />
      <GroupSection title="Mañana"   acts={groups.tomorrow} count={groups.tomorrow.length} accent="#7C3AED" bg="#F5F3FF" icon="📅" defaultOpen={true}  projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={setFollowUp} />
      <GroupSection title="Próximas" acts={groups.upcoming} count={groups.upcoming.length} accent="#D97706" bg="#FFFBEB" icon="🗓" defaultOpen={false} projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={setFollowUp} />
      <GroupSection title="Realizadas" acts={groups.done}   count={groups.done.length}    accent="#16A34A" bg="#F0FDF4" icon="✅" defaultOpen={false} projects={projects} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} onFollowUp={setFollowUp} />

      {followUp && (
        <FollowUpModal
          completedAct={followUp}
          onSkip={() => setFollowUp(null)}
          onSchedule={() => { onNew({ prefill: followUp }); setFollowUp(null); }}
        />
      )}
    </div>
  );
}

// ─── APP
// ─── MEMBER INPUT ─────────────────────────────────────────────────────────────
function MemberInput({ label, members, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if(v && !members.includes(v)) { onChange([...members, v]); setInput(""); }
  };
  return (
    <div>
      <label style={{display:"block",fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
        {members.map(m=>(
          <span key={m} style={{background:"#F0FDF4",color:"#166534",border:"1px solid #BBF7D0",borderRadius:20,padding:"3px 10px",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
            {m}
            <button onClick={()=>onChange(members.filter(x=>x!==m))} style={{background:"none",border:"none",cursor:"pointer",color:"#166534",fontSize:14,lineHeight:1,padding:0}}>×</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add();}}}
          placeholder="Nombre + Enter"
          style={{flex:1,padding:"8px 12px",border:"1px solid #E5E7EB",borderRadius:8,fontSize:13,color:"#111827",outline:"none"}} />
        <button onClick={add} style={{padding:"8px 14px",background:"#1B4332",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>+</button>
      </div>
    </div>
  );
}

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
function ProjectForm({ editProject, onSave, onCancel }) {
  const blank = {
    id:"", name:"", type:"EVA+", color:"#7C3AED",
    clientMembers:[], nuwekMembers:[...NUWEK_TEAM_DEFAULT],
    startDate:"", durationWeeks:12,
    billingAmount:"", billingDate:"", billingNotes:"",
    status:"Activo"
  };
  const [form, setForm] = useState(editProject || blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = {width:"100%",background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"};

  const handleSave = () => {
    if(!form.name.trim()) return;
    onSave({...form, id: form.id || generateId()});
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#111827"}}>{editProject?"Editar proyecto":"Nuevo proyecto"}</h2>
          <button onClick={onCancel} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#9CA3AF"}}>✕</button>
        </div>
        <div style={{padding:24,display:"flex",flexDirection:"column",gap:18}}>

          {/* Nombre + Tipo */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={lbl}>Nombre del proyecto *</label>
              <input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej. HULUX" />
            </div>
            <div>
              <label style={lbl}>Metodología</label>
              <select style={{...inp,cursor:"pointer"}} value={form.type} onChange={e=>set("type",e.target.value)}>
                <option>EVA+</option>
                <option>SBOS</option>
              </select>
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={lbl}>Color del proyecto</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLOR_OPTIONS.map(col=>(
                <div key={col} onClick={()=>set("color",col)}
                  style={{width:32,height:32,borderRadius:"50%",background:col,cursor:"pointer",border:form.color===col?"3px solid #111827":"3px solid transparent",boxSizing:"border-box",transition:"transform 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
              ))}
            </div>
          </div>

          {/* Estado + Duración */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={lbl}>Estado</label>
              <select style={{...inp,cursor:"pointer"}} value={form.status} onChange={e=>set("status",e.target.value)}>
                <option>Activo</option>
                <option>En pausa</option>
                <option>Completado</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Duración (semanas)</label>
              <input type="number" min={1} max={52} style={inp} value={form.durationWeeks} onChange={e=>set("durationWeeks",parseInt(e.target.value)||12)} />
            </div>
          </div>

          {/* Fechas */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={lbl}>Fecha de inicio</label>
              <input type="date" style={inp} value={form.startDate} onChange={e=>set("startDate",e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Fecha de facturación</label>
              <input type="date" style={inp} value={form.billingDate} onChange={e=>set("billingDate",e.target.value)} />
            </div>
          </div>

          {/* Facturación */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={lbl}>Monto a facturar (MXN)</label>
              <input type="number" style={inp} value={form.billingAmount} onChange={e=>set("billingAmount",e.target.value)} placeholder="Ej. 75000" />
            </div>
            <div>
              <label style={lbl}>Notas de facturación</label>
              <input style={inp} value={form.billingNotes} onChange={e=>set("billingNotes",e.target.value)} placeholder="Ej. 3 pagos de $25,000" />
            </div>
          </div>

          {/* Equipos */}
          <MemberInput label="Equipo cliente" members={form.clientMembers} onChange={v=>set("clientMembers",v)} />
          <MemberInput label="Equipo Nuwek" members={form.nuwekMembers} onChange={v=>set("nuwekMembers",v)} />

        </div>
        <div style={{padding:"16px 24px",borderTop:"1px solid #F3F4F6",display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onCancel} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #E5E7EB",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer",fontWeight:500}}>Cancelar</button>
          <button onClick={handleSave} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#1B4332",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:700}}>Guardar proyecto</button>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECTS VIEW ────────────────────────────────────────────────────────────
function ProjectsView({ projects, activities, onAdd, onEdit, onDelete, onGoGantt }) {
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
            <div key={proj.id} style={{background:"#fff",borderRadius:14,border:"1px solid #F3F4F6",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",overflow:"hidden"}}>
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
                <div style={{display:"flex",gap:8,borderTop:"1px solid #F9FAFB",paddingTop:14}}>
                  <button onClick={()=>onGoGantt(proj.id)} style={{flex:1,padding:"8px 0",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}>Ver Gantt</button>
                  <button onClick={()=>onEdit(proj)} style={{flex:1,padding:"8px 0",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:8,fontSize:12,fontWeight:600,color:"#374151",cursor:"pointer"}}>✏️ Editar</button>
                  <button onClick={()=>{ if(window.confirm(`¿Eliminar ${proj.name}?`)) onDelete(proj.id); }} style={{padding:"8px 12px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,fontSize:12,fontWeight:600,color:"#DC2626",cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState("dashboard");
  const [acts,setActs]=useState([]);
  const [projects,setProjects]=useState(PROJECTS_INIT);
  const [showForm,setShowForm]=useState(false);
  const [showProjectForm,setShowProjectForm]=useState(false);
  const [editAct,setEditAct]=useState(null);
  const [editProj,setEditProj]=useState(null);
  const [loading,setLoading]=useState(true);
  const [selectedProject,setSelectedProject]=useState(PROJECTS_INIT[0]?.id||"");

  useEffect(()=>{
    Promise.all([loadData(), loadProjects()]).then(([acts, projs])=>{
      setActs(acts);
      if(projs) setProjects(projs);
      setLoading(false);
    });
  },[]);

  const handleSaveProject=async(proj)=>{
    const updated=projects.find(p=>p.id===proj.id)?projects.map(p=>p.id===proj.id?proj:p):[...projects,proj];
    setProjects(updated); await saveProjects(updated); setShowProjectForm(false); setEditProj(null);
  };
  const handleDeleteProject=async(id)=>{
    const updated=projects.filter(p=>p.id!==id);
    setProjects(updated); await saveProjects(updated);
  };

  const handleSave=async(act)=>{
    const updated=acts.find(a=>a.id===act.id)?acts.map(a=>a.id===act.id?act:a):[...acts,act];
    setActs(updated); await saveData(updated); setShowForm(false); setEditAct(null);
  };
  const handleDelete=async(id)=>{ const u=acts.filter(a=>a.id!==id); setActs(u); await saveData(u); };
  const handleEdit=(act)=>{ const b=acts.find(a=>a.id===act.id||act.id.startsWith(a.id+"_")); if(b){setEditAct(b);setShowForm(true);} };
  const handleStatusChange=async(id,newStatus)=>{
    const updated=acts.map(a=>a.id===id?{...a,status:newStatus}:a);
    setActs(updated); await saveData(updated);
  };
  const handleNewWithPrefill=(prefillData)=>{
    if(prefillData?.prefill){
      const src=prefillData.prefill;
      setEditAct({ id:"", projectId:src.projectId, phase:src.phase, description:"", clientResponsible:"", nuwekResponsible:"", clientGuests:[], nuwekGuests:[], priority:src.priority||"Media", date:todayStr(), timeStart:"", timeEnd:"", interactionType:src.interactionType||"Con cliente", modality:src.modality||"En línea", recurrence:"No se repite", recurrenceCount:12, status:"Pendiente", notes:"", originalDate:"" });
    } else { setEditAct(null); }
    setShowForm(true);
  };

  const nav=[{id:"proyectos",label:"Proyectos",icon:"◈"},{id:"dashboard",label:"Dashboard",icon:"◎"},{id:"calendar",label:"Calendario",icon:"▦"},{id:"gantt",label:"Gantt",icon:"≡"},{id:"activities",label:"Actividades",icon:"☰"}];

  if(loading) return <div style={{minHeight:"100vh",background:"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B4332",fontWeight:600}}>Cargando Nuwek PM...</div>;

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width:220, flexShrink:0, background:"#1B4332", display:"flex", flexDirection:"column" }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#D4A853,#7C3AED)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff" }}>N</div>
            <div>
              <p style={{ margin:0,color:"#fff",fontWeight:800,fontSize:14,lineHeight:1 }}>Nuwek</p>
              <p style={{ margin:0,color:"rgba(255,255,255,0.45)",fontSize:11 }}>Project Manager</p>
            </div>
          </div>
        </div>
        {/* Projects */}
        <div style={{ padding:"16px 12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ margin:"0 0 10px 8px",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Proyectos</p>
          {projects.map(p=>(
            <div key={p.id} onClick={()=>{ setSelectedProject(p.id); setView("gantt"); }}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:2 }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0 }} />
              <span style={{ color:"rgba(255,255,255,0.8)",fontSize:13,flex:1 }}>{p.name}</span>
              <span style={{ color:"rgba(255,255,255,0.3)",fontSize:11 }}>{p.type}</span>
            </div>
          ))}
        </div>
        {/* Nav */}
        <nav style={{ flex:1, padding:"16px 12px" }}>
          <p style={{ margin:"0 0 10px 8px",fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.08em" }}>Vistas</p>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setView(item.id)}
              style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,marginBottom:2,background:view===item.id?"rgba(255,255,255,0.12)":"transparent",color:view===item.id?"#fff":"rgba(255,255,255,0.55)",fontWeight:view===item.id?600:400,textAlign:"left" }}
              onMouseEnter={e=>{if(view!==item.id)e.currentTarget.style.background="rgba(255,255,255,0.06)"}} onMouseLeave={e=>{if(view!==item.id)e.currentTarget.style.background="transparent"}}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        {/* CTA */}
        <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={()=>{setEditAct(null);setShowForm(true);}}
            style={{ width:"100%",padding:"10px 0",background:"#D4A853",color:"#1B4332",border:"none",borderRadius:9,fontWeight:800,fontSize:13,cursor:"pointer" }}>
            + Nueva actividad
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflowY:"auto" }}>
        {view==="proyectos"  && <ProjectsView  projects={projects} activities={acts} onAdd={()=>{setEditProj(null);setShowProjectForm(true);}} onEdit={(p)=>{setEditProj(p);setShowProjectForm(true);}} onDelete={handleDeleteProject} onGoGantt={(id)=>{setSelectedProject(id);setView("gantt");}} />}
        {view==="dashboard"  && <Dashboard     projects={projects} activities={acts} onNewActivity={()=>{setEditAct(null);setShowForm(true);}} onEdit={handleEdit} />}
        {view==="calendar"   && <CalendarView  projects={projects} activities={acts} onNewActivity={()=>{setEditAct(null);setShowForm(true);}} onEdit={handleEdit} />}
        {view==="gantt"      && <GanttView     projects={projects} activities={acts} selectedProject={selectedProject} onProjectChange={setSelectedProject} />}
        {view==="activities" && <ActivitiesList projects={projects} activities={acts} onNew={handleNewWithPrefill} onEdit={handleEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} />}
      </div>

      {showForm && <ActivityForm projects={projects} editActivity={editAct} onSave={handleSave} onCancel={()=>{setShowForm(false);setEditAct(null);}} />}
      {showProjectForm && <ProjectForm editProject={editProj} onSave={handleSaveProject} onCancel={()=>{setShowProjectForm(false);setEditProj(null);}} />}
    </div>
  );
}

import { useState, useEffect } from "react";
import { PRIORITIES, STATUSES, MODALITIES, INTERACTION_TYPES, RECURRENCE_OPTIONS } from "../../constants";
import { getPhasesForType, getStatusColor, getStatusBg, todayStr, generateId } from "../../utils/helpers";
import MultiSelect from "../ui/MultiSelect";

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
          <button onClick={() => { if(!form.description||!form.date||!form.projectId||!form.phase) return; onSave({...form, id:form.id||generateId()}); }}
            style={{ padding:"9px 20px", borderRadius:8, border:"none", background:"#1B4332", color:"#fff", fontSize:13, cursor:"pointer", fontWeight:600 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

export default ActivityForm;

import { useState, useRef } from "react";
import { COLOR_OPTIONS, NUWEK_TEAM_DEFAULT } from "../../constants";
import { generateId } from "../../utils/helpers";
import MemberInput from "../ui/MemberInput";

function ProjectForm({ editProject, onSave, onCancel }) {
  const blank = {
    id:"", name:"", type:"EVA+", color:"#7C3AED",
    clientMembers:[], nuwekMembers:[...NUWEK_TEAM_DEFAULT],
    startDate:"", durationWeeks:12,
    billingAmount:"", billingDate:"", billingNotes:"",
    status:"Activo"
  };
  const initial = useRef(editProject || blank);
  const [form, setForm] = useState(editProject || blank);
  const [submitted, setSubmitted] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = {width:"100%",background:"#fff",border:"1px solid #E5E7EB",borderRadius:8,padding:"9px 12px",fontSize:13,color:"#111827",outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:11,fontWeight:600,color:"#6B7280",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.04em"};

  const nameError = submitted && !form.name.trim();

  const handleCancel = () => {
    const dirty = JSON.stringify(form) !== JSON.stringify(initial.current);
    if (dirty && !window.confirm("¿Descartar cambios sin guardar?")) return;
    onCancel();
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!form.name.trim()) return;
    onSave({...form, id: form.id || generateId()});
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.4)",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:640,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #F3F4F6",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h2 style={{margin:0,fontSize:17,fontWeight:700,color:"#111827"}}>{editProject?"Editar proyecto":"Nuevo proyecto"}</h2>
          <button onClick={handleCancel} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#9CA3AF"}}>✕</button>
        </div>
        <div style={{padding:24,display:"flex",flexDirection:"column",gap:18}}>

          {/* Nombre + Tipo */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={lbl}>Nombre del proyecto *</label>
              <input style={{...inp, borderColor: nameError ? "#DC2626" : "#E5E7EB"}} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Ej. HULUX" />
              {nameError && <p style={{margin:"4px 0 0",fontSize:11,color:"#DC2626"}}>Campo requerido</p>}
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
          <button onClick={handleCancel} style={{padding:"9px 18px",borderRadius:8,border:"1px solid #E5E7EB",background:"#fff",color:"#374151",fontSize:13,cursor:"pointer",fontWeight:500}}>Cancelar</button>
          <button onClick={handleSave} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#1B4332",color:"#fff",fontSize:13,cursor:"pointer",fontWeight:700}}>Guardar proyecto</button>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECTS VIEW ────────────────────────────────────────────────────────────

export default ProjectForm;

export default function ConfirmDeleteModal({ activityName, isRecurring, recurrenceCount, onConfirm, onConfirmOne, onCancel, entityLabel = "actividad" }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.45)", padding:16, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:14, width:"100%", maxWidth:400, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>

        <div style={{ height:4, background:"#DC2626" }} />

        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"#FEE2E2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
            <span style={{ fontSize:20 }}>🗑</span>
          </div>
          <p style={{ fontSize:15, fontWeight:700, color:"#111827", margin:"0 0 6px" }}>Eliminar {entityLabel}</p>
          <p style={{ fontSize:13, color:"#6B7280", margin:"0 0 16px", lineHeight:1.6 }}>
            ¿Eliminar <span style={{ color:"#111827", fontWeight:600 }}>"{activityName}"</span>?<br/>
            Esta acción no se puede deshacer.
          </p>
        </div>

        {isRecurring && (
          <div style={{ padding:"0 20px 16px" }}>
            <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 12px", display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ fontSize:14, color:"#D97706", flexShrink:0 }}>⚠️</span>
              <p style={{ fontSize:12, color:"#92400E", margin:0, lineHeight:1.5 }}>
                Esta actividad se repite <strong>{recurrenceCount} veces</strong>. Puedes eliminar solo esta fecha o todas las ocurrencias.
              </p>
            </div>
          </div>
        )}

        <div style={{ padding:"12px 20px 20px", display:"flex", gap:8, justifyContent:"flex-end", flexWrap:"wrap", borderTop:"1px solid #F3F4F6" }}>
          <button onClick={onCancel}
            style={{ padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff", border:"1px solid #E5E7EB", color:"#374151", fontWeight:500, fontFamily:"inherit" }}>
            Cancelar
          </button>
          {isRecurring && onConfirmOne && (
            <button onClick={onConfirmOne}
              style={{ padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer", background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", fontWeight:600, fontFamily:"inherit" }}>
              Solo esta fecha
            </button>
          )}
          <button onClick={onConfirm}
            style={{ padding:"9px 18px", borderRadius:8, fontSize:13, cursor:"pointer", background:"#DC2626", color:"#fff", border:"none", fontWeight:700, fontFamily:"inherit" }}>
            {isRecurring ? "Todas las ocurrencias" : "Sí, eliminar"}
          </button>
        </div>

      </div>
    </div>
  );
}

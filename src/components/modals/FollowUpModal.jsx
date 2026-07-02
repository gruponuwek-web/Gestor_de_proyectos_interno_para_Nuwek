import { useState } from "react";
import { generateId } from "../../utils/helpers";

const GAPS = { Semanal: 7, Quincenal: 14, Mensual: 30 };

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function fmtDateLabel(str) {
  if (!str) return "Sin fecha";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

function Avatar({ name, variant }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = variant === "nuwek" ? "#D1FAE5" : "#DBEAFE";
  const color = variant === "nuwek" ? "#065F46" : "#1E40AF";
  return (
    <span style={{ width: 22, height: 22, borderRadius: "50%", background: bg, color, fontSize: 9, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials}
    </span>
  );
}

export default function FollowUpModal({ completedAct, onSchedule, onSaveDirect, onSkip }) {
  const isRecurring = completedAct.recurrence && completedAct.recurrence !== "No se repite";
  const gap = GAPS[completedAct.recurrence] || 7;
  const suggestedDate = completedAct.date ? addDays(completedAct.date, gap) : "";

  const [useCustom, setUseCustom] = useState(false);
  const [customDate, setCustomDate] = useState(suggestedDate);
  const [timeStart, setTimeStart] = useState(completedAct.timeStart || "");
  const [timeEnd, setTimeEnd]     = useState(completedAct.timeEnd   || "");
  const [notes, setNotes]         = useState("");

  const selectedDate = useCustom ? customDate : suggestedDate;

  const nuwekGuests  = completedAct.nuwekGuests  || [];
  const clientGuests = completedAct.clientGuests || [];

  // Para recurrentes solo cerramos — la siguiente ocurrencia ya existe en la serie
  if (isRecurring) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, maxWidth: 400, width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
          {/* Header */}
          <div style={{ background: "#1B4332", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div>
              <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 600 }}>Actividad completada</p>
              <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.55)", fontSize: 11 }}>Siguiente actividad ya agendada · {completedAct.recurrence}</p>
            </div>
          </div>
          {/* Body */}
          <div style={{ padding: "16px 20px" }}>
            {/* Nombre */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 8, padding: "9px 12px", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#7C3AED" }}>↻</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 }}>{completedAct.description}</span>
              <span style={{ background: "#F5F3FF", color: "#7C3AED", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{completedAct.recurrence}</span>
            </div>
            {/* Próxima fecha */}
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Próxima sesión</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>📅</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#065F46" }}>{fmtDateLabel(suggestedDate)}</p>
                {(completedAct.timeStart) && (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#16A34A" }}>{completedAct.timeStart}{completedAct.timeEnd ? ` – ${completedAct.timeEnd}` : ""}</p>
                )}
              </div>
            </div>
            {/* Integrantes */}
            {(completedAct.nuwekResponsible || nuwekGuests.length > 0 || completedAct.clientResponsible || clientGuests.length > 0) && (
              <>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Integrantes</p>
                <div style={{ border: "1px solid #F3F4F6", borderRadius: 8, background: "#F9FAFB", overflow: "hidden" }}>
                  {completedAct.nuwekResponsible && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: (nuwekGuests.length > 0 || completedAct.clientResponsible || clientGuests.length > 0) ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>Nuwek</span>
                      <Avatar name={completedAct.nuwekResponsible} variant="nuwek" />
                      <span style={{ fontSize: 12, color: "#111827" }}>{completedAct.nuwekResponsible}</span>
                    </div>
                  )}
                  {nuwekGuests.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: (completedAct.clientResponsible || clientGuests.length > 0) ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>+ equipo</span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {nuwekGuests.map(g => <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#ECFDF5", color: "#065F46", border: "1px solid #D1FAE5" }}>{g}</span>)}
                      </div>
                    </div>
                  )}
                  {completedAct.clientResponsible && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: clientGuests.length > 0 ? "1px solid #F3F4F6" : "none" }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>Cliente</span>
                      <Avatar name={completedAct.clientResponsible} variant="client" />
                      <span style={{ fontSize: 12, color: "#111827" }}>{completedAct.clientResponsible}</span>
                    </div>
                  )}
                  {clientGuests.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>+ cliente</span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {clientGuests.map(g => <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#EFF6FF", color: "#1E40AF", border: "1px solid #DBEAFE" }}>{g}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {/* Footer */}
          <div style={{ borderTop: "1px solid #F3F4F6", padding: "12px 20px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={onSkip}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1B4332", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  const buildNextAct = () => ({
    id:                generateId(),
    projectId:         completedAct.projectId,
    phase:             completedAct.phase,
    description:       completedAct.description,
    clientResponsible: completedAct.clientResponsible || "",
    nuwekResponsible:  completedAct.nuwekResponsible  || "",
    clientGuests,
    nuwekGuests,
    priority:          completedAct.priority      || "Media",
    date:              selectedDate,
    timeStart,
    timeEnd,
    interactionType:   completedAct.interactionType || "Con cliente",
    modality:          completedAct.modality         || "En línea",
    recurrence:        "No se repite",
    recurrenceCount:   12,
    status:            "Pendiente",
    notes,
    originalDate:      "",
  });

  const inp = { width: "100%", padding: "7px 9px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", background: "#fff", boxSizing: "border-box" };
  const sec = { margin: "0 0 7px", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, maxWidth: 420, width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>

        {/* Header */}
        <div style={{ background: "#1B4332", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
          <div>
            <p style={{ margin: 0, color: "#fff", fontSize: 14, fontWeight: 600 }}>Actividad completada</p>
            <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              {isRecurring ? `Siguiente ocurrencia ya agendada · ${completedAct.recurrence}` : "¿Quieres agendar un seguimiento?"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", maxHeight: "70vh", overflowY: "auto" }}>

          {/* Nombre */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", border: "1px solid #F3F4F6", borderRadius: 8, padding: "9px 12px", marginBottom: 14 }}>
            {isRecurring && <span style={{ fontSize: 12, color: "#7C3AED" }}>↻</span>}
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flex: 1 }}>{completedAct.description}</span>
            {isRecurring && <span style={{ background: "#F5F3FF", color: "#7C3AED", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{completedAct.recurrence}</span>}
          </div>

          {/* Fecha */}
          <p style={sec}>{isRecurring ? "Confirma la siguiente fecha" : "Fecha de seguimiento"}</p>
          <div style={{ display: "flex", gap: 7, marginBottom: 4 }}>
            <button onClick={() => setUseCustom(false)}
              style={{ flex: 1, padding: "9px 11px", borderRadius: 8, border: `2px solid ${!useCustom ? "#1B4332" : "#E5E7EB"}`, background: !useCustom ? "#F0FDF4" : "#fff", color: !useCustom ? "#065F46" : "#9CA3AF", fontSize: 12, fontWeight: !useCustom ? 600 : 400, cursor: "pointer", textAlign: "left" }}>
              📅 {fmtDateLabel(suggestedDate)}
            </button>
            <button onClick={() => setUseCustom(true)}
              style={{ padding: "9px 12px", borderRadius: 8, border: `2px solid ${useCustom ? "#1B4332" : "#E5E7EB"}`, background: useCustom ? "#F0FDF4" : "#fff", color: useCustom ? "#065F46" : "#9CA3AF", fontSize: 12, cursor: "pointer" }}>
              ✏️ Otra
            </button>
          </div>
          {useCustom && <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ ...inp, marginBottom: 4 }} />}
          {isRecurring && <p style={{ margin: "0 0 14px", fontSize: 10, color: "#9CA3AF" }}>+{gap} días desde {completedAct.date}</p>}
          {!isRecurring && <div style={{ marginBottom: 14 }} />}

          {/* Hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 10, color: "#6B7280" }}>Hora inicio</p>
              <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} style={inp} />
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 10, color: "#6B7280" }}>Hora fin</p>
              <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} style={inp} />
            </div>
          </div>

          {/* Integrantes */}
          {(completedAct.nuwekResponsible || nuwekGuests.length > 0 || completedAct.clientResponsible || clientGuests.length > 0) && (
            <>
              <p style={sec}>Integrantes</p>
              <div style={{ border: "1px solid #F3F4F6", borderRadius: 8, background: "#F9FAFB", overflow: "hidden", marginBottom: 14 }}>
                {completedAct.nuwekResponsible && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: nuwekGuests.length > 0 || completedAct.clientResponsible || clientGuests.length > 0 ? "1px solid #F3F4F6" : "none" }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>Nuwek</span>
                    <Avatar name={completedAct.nuwekResponsible} variant="nuwek" />
                    <span style={{ fontSize: 12, color: "#111827", flex: 1 }}>{completedAct.nuwekResponsible}</span>
                  </div>
                )}
                {nuwekGuests.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: completedAct.clientResponsible || clientGuests.length > 0 ? "1px solid #F3F4F6" : "none" }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>+ equipo</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {nuwekGuests.map(g => (
                        <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#ECFDF5", color: "#065F46", border: "1px solid #D1FAE5" }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {completedAct.clientResponsible && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: clientGuests.length > 0 ? "1px solid #F3F4F6" : "none" }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>Cliente</span>
                    <Avatar name={completedAct.clientResponsible} variant="client" />
                    <span style={{ fontSize: 12, color: "#111827", flex: 1 }}>{completedAct.clientResponsible}</span>
                  </div>
                )}
                {clientGuests.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 52 }}>+ cliente</span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {clientGuests.map(g => (
                        <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#EFF6FF", color: "#1E40AF", border: "1px solid #DBEAFE" }}>{g}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notas */}
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 10, color: "#6B7280" }}>Notas (opcional)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Comentarios para la próxima sesión..."
              rows={2}
              style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #F3F4F6", padding: "12px 20px", display: "flex", gap: 7, justifyContent: "flex-end" }}>
          <button onClick={onSkip}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>
            Omitir
          </button>
          <button onClick={() => onSchedule(buildNextAct())}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            Personalizar todo
          </button>
          <button onClick={() => onSaveDirect(buildNextAct(), suggestedDate)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1B4332", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Confirmar y agendar
          </button>
        </div>
      </div>
    </div>
  );
}

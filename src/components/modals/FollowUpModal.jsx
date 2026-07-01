export default function FollowUpModal({ completedAct, onSchedule, onSkip }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#111827" }}>¡Actividad completada!</h3>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          <strong style={{ color: "#111827" }}>{completedAct.description}</strong><br />
          ¿Quieres agendar una siguiente actividad para este proyecto?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onSkip}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            No por ahora
          </button>
          <button onClick={onSchedule}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#1B4332", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Sí, agendar siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

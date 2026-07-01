import { useState } from "react";

export default function MemberInput({ label, members, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !members.includes(v)) { onChange([...members, v]); setInput(""); }
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {members.map(m => (
          <span key={m} style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 20, padding: "3px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            {m}
            <button onClick={() => onChange(members.filter(x => x !== m))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#166534", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Nombre + Enter"
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#111827", outline: "none" }} />
        <button onClick={add}
          style={{ padding: "8px 14px", background: "#1B4332", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

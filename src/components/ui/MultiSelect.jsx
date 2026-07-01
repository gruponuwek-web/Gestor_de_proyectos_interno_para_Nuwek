import { useState, useEffect, useRef } from "react";

export default function MultiSelect({ options, selected, onChange, placeholder = "Agregar..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (m) => onChange(selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => options.length > 0 && setOpen(o => !o)}
        style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", cursor: options.length ? "pointer" : "default", minHeight: 38, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
          {selected.length === 0
            ? <span style={{ color: "#9CA3AF", fontSize: 13 }}>{options.length === 0 ? "Sin opciones" : placeholder}</span>
            : selected.map(m => (
              <span key={m} style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 20, padding: "2px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                {m}
                <button onClick={e => { e.stopPropagation(); toggle(m); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#166534", lineHeight: 1, fontSize: 14 }}>×</button>
              </span>
            ))
          }
        </div>
        {options.length > 0 && <span style={{ color: "#9CA3AF", fontSize: 11 }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && (
        <div style={{ position: "absolute", zIndex: 100, width: "100%", marginTop: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", overflow: "hidden" }}>
          {options.map(m => (
            <div key={m} onClick={() => toggle(m)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: selected.includes(m) ? "#F0FDF4" : "#fff", color: selected.includes(m) ? "#166534" : "#374151", fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = selected.includes(m) ? "#DCFCE7" : "#F9FAFB"}
              onMouseLeave={e => e.currentTarget.style.background = selected.includes(m) ? "#F0FDF4" : "#fff"}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: selected.includes(m) ? "none" : "1.5px solid #D1D5DB", background: selected.includes(m) ? "#16A34A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>
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

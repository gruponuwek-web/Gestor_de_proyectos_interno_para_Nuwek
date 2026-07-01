import { useState, useEffect, useRef } from "react";
import { STATUSES } from "../../constants";
import { getStatusColor, getStatusBg } from "../../utils/helpers";

export default function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <span onClick={() => setOpen(o => !o)}
        style={{ background: getStatusBg(status), color: getStatusColor(status), borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", border: `1px solid ${getStatusColor(status)}33`, display: "inline-flex", alignItems: "center", gap: 4 }}>
        {status} <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </span>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden", minWidth: 150 }}>
          {STATUSES.map(s => (
            <div key={s} onClick={() => { onChange(s); setOpen(false); }}
              style={{ padding: "9px 14px", fontSize: 12, fontWeight: 600, color: getStatusColor(s), background: status === s ? getStatusBg(s) : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #F9FAFB" }}
              onMouseEnter={e => e.currentTarget.style.background = getStatusBg(s)}
              onMouseLeave={e => e.currentTarget.style.background = status === s ? getStatusBg(s) : "#fff"}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: getStatusColor(s), flexShrink: 0 }} />
              {s}
              {status === s && <span style={{ marginLeft: "auto", fontSize: 10 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

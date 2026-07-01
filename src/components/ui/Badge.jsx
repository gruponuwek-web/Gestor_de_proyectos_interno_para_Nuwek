export default function Badge({ label, color, bg }) {
  return (
    <span style={{
      background: bg || "#F3F4F6",
      color: color || "#374151",
      borderRadius: 20,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export default function InfoCard({ title, value, hint, children }) {
    return (
      <div className="card">
        {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
        {value !== undefined && (
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
        )}
        {hint && <div className="small" style={{ marginTop: 4 }}>{hint}</div>}
        {children}
      </div>
    );
  }
  
export default function ErrorBlock({ error }) {
    return (
      <div className="card" style={{ borderColor: "#f44336" }}>
        <div style={{ color: "#ffb3ad", fontWeight: 600 }}>Error</div>
        <div className="small">{String(error)}</div>
      </div>
    );
  }
  
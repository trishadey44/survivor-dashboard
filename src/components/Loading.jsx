export default function Loading({ label = "Loading..." }) {
    return (
      <div className="card">
        <div className="small">{label}</div>
      </div>
    );
  }
  
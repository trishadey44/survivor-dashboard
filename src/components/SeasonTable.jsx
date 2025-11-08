import { Link } from "react-router-dom";

export default function SeasonTable({ seasons, query }) {
  const q = (query || "").toLowerCase();

  const filtered = seasons.filter(s => {
    const hay = [
      s.title,
      String(s.season_number),
      s.location,
      s.winner,
      (s.tribes || []).join(" "),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Seasons</h2>
      <div className="small" style={{ marginBottom: 8 }}>
        Showing {filtered.length} of {seasons.length}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Location</th>
              <th>Run</th>
              <th className="small">Episodes</th>
              <th className="small">Days</th>
              <th className="small">Castaways</th>
              <th>Winner</th>
              <th>Tribes</th>
              <th className="small">Viewers (M)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.season_number}>
                <td><span className="badge">{s.season_number}</span></td>
                <td>
                  <Link to={`/season/${s.season_number}`}>{s.title}</Link>
                </td>
                <td>{s.location || "-"}</td>
                <td className="small">
                  {s.airing_dates?.start || "?"} → {s.airing_dates?.end || "?"}
                </td>
                <td className="small">{s.num_episodes ?? "-"}</td>
                <td className="small">{s.num_days ?? "-"}</td>
                <td className="small">{s.num_castaways ?? "-"}</td>
                <td>{s.winner || "-"}</td>
                <td className="small">{(s.tribes || []).join(", ") || "-"}</td>
                <td className="small">{s.viewership_millions ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { loadSeasons, loadEpisodes } from "../api";
import Loading from "../components/Loading";
import ErrorBlock from "../components/ErrorBlock";

export default function SeasonDetail() {
  const { seasonNumber } = useParams();
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    async function go() {
      try {
        const s = await loadSeasons();
        const e = await loadEpisodes();
        if (!alive) return;
        setSeasons(s.seasons || s);
        setEpisodesBySeason(e.episodes_by_season || e);
        setLoading(false);
      } catch (error) {
        if (!alive) return;
        setErr(error);
        setLoading(false);
      }
    }
    go();
    return () => { alive = false; };
  }, []);

  const season = useMemo(() =>
    (seasons || []).find(s => String(s.season_number) === String(seasonNumber)), [seasons, seasonNumber]
  );

  const eps = useMemo(() =>
    episodesBySeason?.[String(seasonNumber)] || [], [episodesBySeason, seasonNumber]
  );

  if (loading) return <Loading label="Loading season..." />;
  if (err) return <ErrorBlock error={err.message || err} />;
  if (!season) return (
    <div className="card">
      <div style={{ marginBottom: 8 }}>
        <Link to="..">← Back</Link>
      </div>
      <div>Season not found.</div>
    </div>
  );

  return (
    <>
      <div className="card">
        <div style={{ marginBottom: 8 }}>
          <Link to="/">← Back to Dashboard</Link>
        </div>
        <h2 style={{ marginTop: 0 }}>
          Season {season.season_number}: {season.title}
        </h2>
        <div className="small">
          Location: {season.location || "?"} · Run: {season.airing_dates?.start || "?"} → {season.airing_dates?.end || "?"}
        </div>
        <div className="small" style={{ marginTop: 6 }}>
          Episodes: {season.num_episodes ?? eps.length} · Days: {season.num_days ?? "?"} · Castaways: {season.num_castaways ?? "?"} · Winner: {season.winner || "?"}
        </div>
        <div className="small" style={{ marginTop: 6 }}>
          Tribes: {(season.tribes || []).join(", ") || "-"}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Episodes</h3>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Air Date</th>
                <th className="small">Overall #</th>
                <th className="small">Type</th>
                <th className="small">US Viewers (M)</th>
              </tr>
            </thead>
            <tbody>
              {eps.map(ep => (
                <tr key={`${seasonNumber}-${ep.episode_in_season}-${ep.title}`}>
                  <td><span className="badge">{ep.episode_in_season ?? "-"}</span></td>
                  <td>{ep.title || "-"}</td>
                  <td className="small">{ep.air_date || "-"}</td>
                  <td className="small">{ep.overall_episode_number ?? "-"}</td>
                  <td className="small">{ep.episode_type ?? "-"}</td>
                  <td className="small">{ep.us_viewers_millions ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

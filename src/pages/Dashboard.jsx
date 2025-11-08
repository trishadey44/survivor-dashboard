import { useEffect, useMemo, useState } from "react";
import { loadSeasons, loadEpisodes } from "../api";
import Loading from "../components/Loading";
import ErrorBlock from "../components/ErrorBlock";
import SeasonTable from "../components/SeasonTable";

export default function Dashboard() {
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    async function go() {
      try {
        const s = await loadSeasons();
        const e = await loadEpisodes();
        if (!alive) return;
        setSeasons(s.seasons || s); // supports either array or { seasons: [...] }
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

  const totalSeasons = seasons.length;
  const totalEpisodes = useMemo(() => {
    return Object.values(episodesBySeason).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  }, [episodesBySeason]);

  const newestSeason = seasons[seasons.length - 1];

  if (loading) return <Loading label="Loading Survivor data..." />;
  if (err) return <ErrorBlock error={err.message || err} />;

  return (
    <>
      <div className="card">
        <div className="controls">
          <input
            type="text"
            placeholder="Search (title, #, location, winner, tribe)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
          />
          <div className="small">Tip: try typing a tribe, a location, or a winner’s name</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Quick stats</h2>
          <div className="small">
            <div><strong>Total seasons:</strong> {totalSeasons}</div>
            <div><strong>Total episodes:</strong> {totalEpisodes}</div>
            {newestSeason && (
              <>
                <div><strong>Latest season:</strong> {newestSeason.season_number} — {newestSeason.title}</div>
                <div className="small">
                  Run: {newestSeason.airing_dates?.start || "?"} → {newestSeason.airing_dates?.end || "?"}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>About</h2>
          <div className="small">
            This dashboard reads the latest <em>Survivor</em> data (seasons & episodes) from your API once per day,
            and lets you search and browse details. Click a season title to view its episode list.
          </div>
        </div>
      </div>

      <SeasonTable seasons={seasons} query={query} />
    </>
  );
}

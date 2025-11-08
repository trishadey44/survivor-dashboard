import { useEffect, useMemo, useState } from "react";
import { loadSeasons, loadEpisodes } from "../api";
import Loading from "../components/Loading";
import ErrorBlock from "../components/ErrorBlock";
import SeasonTable from "../components/SeasonTable";
import ViewershipChart from "../components/ViewershipChart";
import BarChartCard from "../components/BarChartCard";

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
        setSeasons(s.seasons || s); // your seasons.json might be array or { seasons: [...] }
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

  const episodesPerSeason = useMemo(() => {
    return seasons.map(s => ({
      season: s.season_number,
      episodes: Array.isArray(episodesBySeason?.[String(s.season_number)])
        ? episodesBySeason[String(s.season_number)].length
        : s.num_episodes ?? 0
    }));
  }, [seasons, episodesBySeason]);

  const daysPerSeason = useMemo(() => {
    return seasons.map(s => ({
      season: s.season_number,
      days: s.num_days ?? 0
    }));
  }, [seasons]);

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
          <div className="small">Tip: try typing a tribe name or a location</div>
        </div>
      </div>

      <div className="grid grid-2">
        <ViewershipChart seasons={seasons} />

        <BarChartCard
          title="Episodes per Season"
          data={episodesPerSeason}
          xKey="season"
          yKey="episodes"
        />

        <BarChartCard
          title="Days per Season"
          data={daysPerSeason}
          xKey="season"
          yKey="days"
        />
      </div>

      <SeasonTable seasons={seasons} query={query} />
    </>
  );
}

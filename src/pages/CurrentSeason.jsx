// src/pages/CurrentSeason.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./currentSeason.css";

/**
 * Data sources – pull straight from your survivor-api repo
 * (RAW GitHub URLs so the app always reads the newest JSON your scraper writes.)
 */
const RAW_BASE =
  "https://raw.githubusercontent.com/trishadey44/survivor-api/main/data";
const SEASONS_URL = `${RAW_BASE}/seasons.json`;
const EPISODES_URL = `${RAW_BASE}/episodes.json`;
const EP_DETAILS_URL = `${RAW_BASE}/episode_details.json`;

// Treat these strings as US dates like "September 29, 2021"
function parseUSDate(s) {
  if (!s || typeof s !== "string") return null;
  const good = /^\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\s*$/i.test(
    s
  );
  if (!good) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function todayPacific() {
  return new Date();
}

function formatDateShort(d) {
  try {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function displayEpisode(ep) {
  const t = ep?.title || "Episode";
  const d = ep?.air_date ? parseUSDate(ep.air_date) : null;
  return `${t}${d ? ` • ${formatDateShort(d)}` : ""}`;
}

/** last aired episode (air_date <= today) */
function findLastAiredEpisode(episodesForSeason) {
  const now = todayPacific();
  const aired = (episodesForSeason || [])
    .map((e) => ({ e, d: parseUSDate(e.air_date) }))
    .filter((x) => x.d && x.d.getTime() <= now.getTime())
    .sort((a, b) => a.d - b.d);
  return aired.length ? aired[aired.length - 1].e : null;
}

/** next scheduled episode (air_date > today) */
function findNextEpisode(episodesForSeason) {
  const now = todayPacific();
  const upcoming = (episodesForSeason || [])
    .map((e) => ({ e, d: parseUSDate(e.air_date) }))
    .filter((x) => x.d && x.d.getTime() > now.getTime())
    .sort((a, b) => a.d - b.d);
  return upcoming.length ? upcoming[0].e : null;
}

export default function CurrentSeason() {
  // “Current season” = currently airing. Adjust here if needed.
  const CURRENT_SEASON_NUMBER = 49;

  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState([]);
  const [episodesBySeason, setEpisodesBySeason] = useState({});
  const [detailsBySeason, setDetailsBySeason] = useState({});
  const [error, setError] = useState(null);
  const [showSpoilers, setShowSpoilers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchJson(url) {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const err = new Error(`${url} -> HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return res.json();
    }

    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        // Load seasons + episodes (required), episode_details (optional).
        const [seasonsRes, episodesRes, detailsRes] = await Promise.allSettled([
          fetchJson(SEASONS_URL),
          fetchJson(EPISODES_URL),
          fetchJson(EP_DETAILS_URL),
        ]);

        if (cancelled) return;

        // Required files
        if (seasonsRes.status !== "fulfilled") {
          throw new Error(
            `Failed to load seasons.json (${seasonsRes.reason?.status || seasonsRes.reason || "unknown"})`
          );
        }
        if (episodesRes.status !== "fulfilled") {
          throw new Error(
            `Failed to load episodes.json (${episodesRes.reason?.status || episodesRes.reason || "unknown"})`
          );
        }

        const seasonsJson = seasonsRes.value;
        const episodesJson = episodesRes.value;

        setSeasons(seasonsJson?.seasons || []);
        setEpisodesBySeason(episodesJson?.episodes_by_season || {});

        // Optional file: if 404, continue with empty details (prevents hard failure)
        if (detailsRes.status === "fulfilled") {
          setDetailsBySeason(detailsRes.value?.episode_details_by_season || {});
        } else {
          // If it’s a 404, silently fallback; for other errors, log and fallback.
          console.warn(
            "episode_details.json unavailable:",
            detailsRes.reason?.message || detailsRes.reason
          );
          setDetailsBySeason({});
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const season = useMemo(() => {
    return (seasons || []).find(
      (s) => Number(s.season_number) === Number(CURRENT_SEASON_NUMBER)
    );
  }, [seasons]);

  const episodesForSeason = useMemo(() => {
    const key = String(CURRENT_SEASON_NUMBER);
    const list = episodesBySeason?.[key] || [];
    return [...list].sort(
      (a, b) => (a.episode_in_season || 0) - (b.episode_in_season || 0)
    );
  }, [episodesBySeason]);

  const detailsIndex = useMemo(() => {
    const key = String(CURRENT_SEASON_NUMBER);
    const list = detailsBySeason?.[key] || [];
    const idx = {};
    for (const d of list) {
      if (typeof d.episode_in_season === "number") {
        idx[d.episode_in_season] = d;
      }
    }
    return idx;
  }, [detailsBySeason]);

  const lastAired = useMemo(
    () => findLastAiredEpisode(episodesForSeason),
    [episodesForSeason]
  );
  const nextEp = useMemo(
    () => findNextEpisode(episodesForSeason),
    [episodesForSeason]
  );

  const airedCount = useMemo(() => {
    const now = todayPacific().getTime();
    return (episodesForSeason || []).filter((e) => {
      const d = parseUSDate(e.air_date);
      return d && d.getTime() <= now;
    }).length;
  }, [episodesForSeason]);

  const totalPlanned = season?.num_episodes || null;
  const episodesRemaining = useMemo(() => {
    if (typeof totalPlanned === "number" && totalPlanned > 0) {
      const rem = totalPlanned - airedCount;
      return rem >= 0 ? rem : 0;
    }
    return null;
  }, [totalPlanned, airedCount]);

  // Build recap from episode_details for last aired (details optional)
  const lastRecap = useMemo(() => {
    if (!lastAired) return null;
    const epn = lastAired.episode_in_season;
    const d = detailsIndex[epn] || {};
    const immunity = Array.isArray(d.immunity_winners) ? d.immunity_winners : [];
    const eliminated = Array.isArray(d.eliminated) ? d.eliminated : [];
    const advantageEvents = Array.isArray(d.advantage_events) ? d.advantage_events : [];

    const advText = advantageEvents
      .map((e) => (typeof e === "string" ? e : e?.text))
      .filter(Boolean)
      .slice(0, 2);

    return {
      ep: lastAired,
      immunityWinners: immunity,
      eliminated,
      advantageCallouts: advText,
    };
  }, [lastAired, detailsIndex]);

  // Live Game Board derived info (details optional)
  const eliminatedToDate = useMemo(() => {
    const out = [];
    for (const ep of episodesForSeason) {
      const d = detailsIndex[ep.episode_in_season] || {};
      const elim = Array.isArray(d.eliminated) ? d.eliminated : [];
      if (elim.length) {
        out.push({
          episode_in_season: ep.episode_in_season,
          title: ep.title || `Episode ${ep.episode_in_season}`,
          names: elim,
        });
      }
    }
    return out;
  }, [episodesForSeason, detailsIndex]);

  const medEvacOrQuitCount = useMemo(() => {
    const kw = /medic|evac|quit/i;
    let count = 0;
    for (const x of eliminatedToDate) {
      for (const n of x.names) {
        if (kw.test(String(n))) count += 1;
      }
    }
    return count;
  }, [eliminatedToDate]);

  const advantageFeed = useMemo(() => {
    const seen = new Set();
    const rows = [];
    for (const ep of episodesForSeason) {
      const d = detailsIndex[ep.episode_in_season] || {};
      const events = Array.isArray(d.advantage_events) ? d.advantage_events : [];
      for (const e of events) {
        const text = typeof e === "string" ? e : e?.text;
        const tag = typeof e === "string" ? "event" : e?.tag || "event";
        if (!text) continue;
        const key = `${ep.episode_in_season}|${text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          ep: ep.episode_in_season,
          title: ep.title || `Episode ${ep.episode_in_season}`,
          tag,
          text,
        });
      }
    }
    return rows;
  }, [episodesForSeason, detailsIndex]);

  const remainingEstimate = useMemo(() => {
    const start = season?.num_castaways || null;
    const outCount = eliminatedToDate.reduce((acc, row) => acc + row.names.length, 0);
    if (!start) return null;
    const candidates = start - outCount;
    return candidates >= 0 ? candidates : null;
  }, [season, eliminatedToDate]);

  if (loading) {
    return (
      <div className="cs-wrap">
        <h1 className="cs-title">Current Season</h1>
        <div className="cs-card">Loading current season…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="cs-wrap">
        <h1 className="cs-title">Current Season</h1>
        <div className="cs-card cs-error">Error: {error}</div>
      </div>
    );
  }
  if (!season) {
    return (
      <div className="cs-wrap">
        <h1 className="cs-title">Current Season</h1>
        <div className="cs-card">No season {CURRENT_SEASON_NUMBER} found.</div>
      </div>
    );
  }

  // Header fields
  const seasonName = season?.title || `Survivor ${CURRENT_SEASON_NUMBER}`;
  const loc = season?.location || "—";
  const twists = Array.isArray(season?.twists)
    ? season.twists.join(", ")
    : season?.theme || "—";
  const days = season?.num_days || null;
  const epCountSoFar = airedCount;

  return (
    <div className="cs-wrap">
      {/* Header */}
      <header className="cs-header">
        <div className="cs-header-left">
          <h1 className="cs-season-name">
            S{CURRENT_SEASON_NUMBER}: {seasonName}
          </h1>
          <div className="cs-meta">
            <span>
              <strong>Location:</strong> {loc}
            </span>
            <span>
              <strong>Theme/Twists:</strong> {twists || "—"}
            </span>
            <span>
              <strong>Episodes so far:</strong> {epCountSoFar}
            </span>
            {typeof days === "number" ? (
              <span>
                <strong>Days (season total):</strong> {days}
              </span>
            ) : null}
          </div>
        </div>

        <div className="cs-header-right">
          <label className="cs-toggle">
            <input
              type="checkbox"
              checked={showSpoilers}
              onChange={(e) => setShowSpoilers(e.target.checked)}
            />
            <span>Show spoilers</span>
          </label>
        </div>
      </header>

      {/* Next Air Date */}
      <section className="cs-grid">
        <div className="cs-card">
          <h2 className="cs-card-title">Next Episode</h2>
          {nextEp ? (
            <>
              <div className="cs-kv">
                <div className="cs-k">Episode</div>
                <div className="cs-v">
                  {nextEp.episode_in_season}. {nextEp.title || "TBA"}
                </div>
              </div>
              {nextEp.air_date && parseUSDate(nextEp.air_date) ? (
                <div className="cs-kv">
                  <div className="cs-k">Air Date</div>
                  <div className="cs-v">
                    {formatDateShort(parseUSDate(nextEp.air_date))} (CBS/Paramount+)
                  </div>
                </div>
              ) : null}
              {episodesRemaining !== null ? (
                <div className="cs-kv">
                  <div className="cs-k">Episodes Remaining</div>
                  <div className="cs-v">{episodesRemaining}</div>
                </div>
              ) : (
                <div className="cs-note">Total episode count not known yet.</div>
              )}
            </>
          ) : (
            <div className="cs-note">
              No upcoming episode found (season may have ended or dates not posted).
            </div>
          )}
        </div>

        {/* Last Episode Recap */}
        <div className="cs-card">
          <h2 className="cs-card-title">Last Episode Recap</h2>
          {lastRecap && lastRecap.ep ? (
            <>
              <div className="cs-subtitle">{displayEpisode(lastRecap.ep)}</div>
              <ul className="cs-list">
                <li>
                  <strong>Immunity:</strong>{" "}
                  {!showSpoilers
                    ? "Hidden"
                    : lastRecap.immunityWinners?.length
                    ? lastRecap.immunityWinners.join(", ")
                    : "—"}
                </li>
                <li>
                  <strong>Who Left:</strong>{" "}
                  {!showSpoilers
                    ? "Hidden"
                    : lastRecap.eliminated?.length
                    ? lastRecap.eliminated.join(", ")
                    : "—"}
                </li>
                <li>
                  <strong>Notable Advantage Event:</strong>{" "}
                  {lastRecap.advantageCallouts?.length
                    ? lastRecap.advantageCallouts[0]
                    : "—"}
                </li>
              </ul>
              {Object.keys(detailsIndex).length === 0 && (
                <div className="cs-note">
                  Episode details aren’t available yet (episode_details.json not found). The
                  recap will auto-fill once that file is published.
                </div>
              )}
            </>
          ) : (
            <div className="cs-note">
              We don’t have a completed last-episode record yet.
            </div>
          )}
        </div>
      </section>

      {/* Live Game Board */}
      <section className="cs-block">
        <h2 className="cs-section-title">Live Game Board</h2>

        {/* Tribe status – placeholder until roster/timeline data exists */}
        <div className="cs-card">
          <h3 className="cs-card-title">Tribe Status</h3>
          <div className="cs-kv">
            <div className="cs-k">Tribes</div>
            <div className="cs-v">
              {Array.isArray(season.tribes) && season.tribes.length
                ? season.tribes.join(" • ")
                : "—"}
            </div>
          </div>
          <div className="cs-kv">
            <div className="cs-k">Estimated Remaining Players</div>
            <div className="cs-v">
              {(() => {
                const start = season?.num_castaways || null;
                const outCount = (eliminatedToDate || []).reduce(
                  (acc, row) => acc + row.names.length,
                  0
                );
                if (!start) return "—";
                const remain = start - outCount;
                return remain >= 0 ? remain : "—";
              })()}
            </div>
          </div>
          {medEvacOrQuitCount > 0 ? (
            <div className="cs-kv">
              <div className="cs-k">Med-evacs / Quits</div>
              <div className="cs-v">{medEvacOrQuitCount}</div>
            </div>
          ) : null}
          <div className="cs-note">
            Per-tribe counts and swaps/merge timeline will appear once the API
            includes cast rosters and tribe timelines.
          </div>
        </div>

        {/* Advantage tracker – optional if details missing */}
        <div className="cs-card">
          <h3 className="cs-card-title">Advantage Tracker (to date)</h3>
          {Object.keys(detailsIndex).length === 0 ? (
            <div className="cs-note">
              Advantage events will appear once episode_details.json is available.
            </div>
          ) : (() => {
              const seen = new Set();
              const rows = [];
              for (const ep of episodesForSeason) {
                const d = detailsIndex[ep.episode_in_season] || {};
                const events = Array.isArray(d.advantage_events)
                  ? d.advantage_events
                  : [];
                for (const e of events) {
                  const text = typeof e === "string" ? e : e?.text;
                  const tag = typeof e === "string" ? "event" : e?.tag || "event";
                  if (!text) continue;
                  const key = `${ep.episode_in_season}|${text}`;
                  if (seen.has(key)) continue;
                  seen.add(key);
                  rows.push({
                    ep: ep.episode_in_season,
                    title: ep.title || `Episode ${ep.episode_in_season}`,
                    tag,
                    text,
                  });
                }
              }
              return rows.length ? (
                <ul className="cs-feed">
                  {rows.map((row) => (
                    <li key={`${row.ep}-${row.text.slice(0, 40)}`}>
                      <span className="cs-chip">{row.tag}</span>{" "}
                      <span className="cs-ep">Ep {row.ep}:</span>{" "}
                      <span>{row.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="cs-note">No parsed advantage events yet.</div>
              );
            })()}
        </div>

        {/* Vote history to date (spoiler-safe names) */}
        <div className="cs-card">
          <h3 className="cs-card-title">Vote-Outs to Date</h3>
          {Object.keys(detailsIndex).length === 0 ? (
            <div className="cs-note">
              Vote-outs will appear once episode_details.json is available.
            </div>
          ) : eliminatedToDate.length ? (
            <ul className="cs-elims">
              {eliminatedToDate.map((row) => (
                <li key={`elim-${row.episode_in_season}`}>
                  <span className="cs-ep">Ep {row.episode_in_season}:</span>{" "}
                  {showSpoilers ? row.names.join(", ") : "Hidden"}
                  <span className="cs-muted"> — {row.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cs-note">No eliminations parsed yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

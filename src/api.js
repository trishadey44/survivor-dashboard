// src/api.js
// Pull Survivor data straight from your survivor-api repo (RAW GitHub URLs).
// Cache results in localStorage for 24 hours so we only re-download once a day.

const RAW_SEASONS =
  "https://raw.githubusercontent.com/trishadey44/survivor-api/main/data/seasons.json";
const RAW_EPISODES =
  "https://raw.githubusercontent.com/trishadey44/survivor-api/main/data/episodes.json";

// If you ever change repo/branch/path, just update the two constants above.

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (HTTP ${res.status})`);
  }
  return res.json();
}

function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCached(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // If storage is full or disabled, just ignore caching.
  }
}

/**
 * Fetch with a 24h cache:
 * - If cache is fresh (<24h), return it.
 * - Else try network, cache, return.
 * - If network fails but we have any cache, return that as a fallback.
 */
async function fetchDaily(url, cacheKey) {
  const now = Date.now();
  const cached = getCached(cacheKey);

  // 1) Fresh cache? Use it.
  if (cached && typeof cached.timestamp === "number" && now - cached.timestamp < ONE_DAY_MS) {
    return cached.data;
  }

  // 2) Try network
  try {
    const data = await fetchJSON(url);
    setCached(cacheKey, { timestamp: now, data });
    return data;
  } catch (err) {
    // 3) Network failed → if we have any cache, use it; else bubble error.
    if (cached && cached.data) {
      return cached.data;
    }
    throw err;
  }
}

export async function loadSeasons() {
  return fetchDaily(RAW_SEASONS, "survivor_cache_seasons");
}

export async function loadEpisodes() {
  return fetchDaily(RAW_EPISODES, "survivor_cache_episodes");
}

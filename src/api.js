// src/api.js

const DATA_BASE =
  import.meta.env.VITE_DATA_BASE?.replace(/\/+$/, "") || ""; // remove trailing slash if present

function remoteUrl(name) {
  if (!DATA_BASE) return null;
  const ts = Date.now();
  return `${DATA_BASE}/${name}?t=${ts}`;
}

function localUrl(name) {
  const ts = Date.now();
  return `/${name}?t=${ts}`;
}

async function fetchJsonWithFallback(primaryUrl, fallbackUrl, label) {
  if (primaryUrl) {
    try {
      const res = await fetch(primaryUrl, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch {
      /* fall through to local */
    }
  }
  const res2 = await fetch(fallbackUrl, { cache: "no-store" });
  if (!res2.ok) {
    throw new Error(`Failed to load ${label} (tried remote and local)`);
  }
  return await res2.json();
}

export async function loadSeasons() {
  const primary = remoteUrl("seasons.json");
  const fallback = localUrl("seasons.json");
  return fetchJsonWithFallback(primary, fallback, "seasons.json");
}

export async function loadEpisodes() {
  const primary = remoteUrl("episodes.json");
  const fallback = localUrl("episodes.json");
  return fetchJsonWithFallback(primary, fallback, "episodes.json");
}

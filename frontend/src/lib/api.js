const base = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "";

async function api(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

export async function getStatus() {
  return api("/api/status");
}

export async function getSuggestedMarkets() {
  return api("/api/suggested-markets");
}

export async function getWatchlist() {
  return api("/api/watchlist");
}

export async function addWatchlistSymbol({ symbol, type = "stock", exchange }) {
  return api("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ symbol: symbol?.trim(), type, exchange: exchange?.trim() || undefined }),
  });
}

export async function getNotes() {
  return api("/api/notes");
}

export async function addNote({ content, noteDate }) {
  return api("/api/notes", {
    method: "POST",
    body: JSON.stringify({ content: content?.trim(), noteDate: noteDate || null }),
  });
}

export async function getLatestRecommendation() {
  return api("/api/recommendations/latest");
}

export async function getRecommendationByRunId(runId) {
  return api(`/api/recommendations?runId=${encodeURIComponent(runId)}`);
}

export async function getRuns() {
  return api("/api/runs");
}

export async function deleteRun(runId) {
  const res = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}`, { method: "DELETE" });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || data.message || res.statusText);
}

export async function runDailyJob() {
  return api("/api/jobs/daily", { method: "POST" });
}

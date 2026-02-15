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

export async function searchWatchlistSymbols(q) {
  const data = await api(`/api/watchlist/search?q=${encodeURIComponent(q)}`);
  return data;
}

export async function addWatchlistSymbol({ symbol, type = "stock", exchange }) {
  const res = await fetch(`${base}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: symbol?.trim(), type, exchange: exchange?.trim() || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data;
  const err = new Error(data.error || data.message || res.statusText);
  if (res.status === 400 && Array.isArray(data.suggestions)) err.suggestions = data.suggestions;
  throw err;
}

export async function deleteWatchlistItem(id) {
  const res = await fetch(`${base}/api/watchlist/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || data.message || res.statusText);
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

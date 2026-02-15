const STORAGE_KEY = "stonksgpt-risk";
const DEFAULT_RISK = 3;

export function getRiskFromStorage() {
  if (typeof localStorage === "undefined") return DEFAULT_RISK;
  const v = localStorage.getItem(STORAGE_KEY);
  const n = parseInt(v, 10);
  return n >= 1 && n <= 5 ? n : DEFAULT_RISK;
}

export function setRiskInStorage(level) {
  if (typeof localStorage === "undefined") return;
  const n = Math.min(5, Math.max(1, Number(level)));
  localStorage.setItem(STORAGE_KEY, String(n));
}

export const RISK_LEVELS = [1, 2, 3, 4, 5];

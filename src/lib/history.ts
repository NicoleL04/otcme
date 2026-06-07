export type HistoryEntry = {
  id: string;
  profile_id: string;
  type: "symptom" | "safety";
  query: string;
  summary: string; // short one-liner outcome
  status?: string; // e.g. "Safe", "Caution"
  created_at: number;
};

const KEY = "otcandme_history";

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function getHistoryForProfile(profileId: string): HistoryEntry[] {
  return getHistory()
    .filter((h) => h.profile_id === profileId)
    .sort((a, b) => b.created_at - a.created_at);
}

export function addHistory(entry: Omit<HistoryEntry, "id" | "created_at">) {
  const all = getHistory();
  all.unshift({
    ...entry,
    id: crypto.randomUUID(),
    created_at: Date.now(),
  });
  // Cap at 100 entries
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
}

export function clearHistoryForProfile(profileId: string) {
  const remaining = getHistory().filter((h) => h.profile_id !== profileId);
  localStorage.setItem(KEY, JSON.stringify(remaining));
}

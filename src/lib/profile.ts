export type Profile = {
  id: string;
  profile_name: string;
  is_self: boolean;
  age: string;
  weight: string;
  height: string;
  gender: string;
  conditions: string[];
  other_condition?: string;
  prescriptions: string;
  allergies: string;
  home_meds: string;
  created_at: number;
};

const KEY = "otcandme_profiles";
const ACTIVE_KEY = "otcandme_active_profile";

export function getProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(KEY, JSON.stringify(profiles));
}

export function addProfile(profile: Profile) {
  const all = getProfiles();
  all.push(profile);
  saveProfiles(all);
  setActiveProfileId(profile.id);
}

export function updateProfile(id: string, patch: Partial<Profile>) {
  const all = getProfiles();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], ...patch, id: all[idx].id };
  saveProfiles(all);
}

export function deleteProfile(id: string) {
  const all = getProfiles().filter((p) => p.id !== id);
  saveProfiles(all);
  if (getActiveProfileId() === id) {
    if (all[0]) setActiveProfileId(all[0].id);
    else localStorage.removeItem(ACTIVE_KEY);
  }
}

export function hasSelfProfile(): boolean {
  return getProfiles().some((p) => p.is_self);
}



export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProfileId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveProfile(): Profile | null {
  const profiles = getProfiles();
  if (profiles.length === 0) return null;
  const id = getActiveProfileId();
  return profiles.find((p) => p.id === id) || profiles[0];
}

export function profileSummary(p: Profile): string {
  const parts = [
    `Name: ${p.profile_name}`,
    `Age: ${p.age}`,
    `Gender: ${p.gender}`,
    `Weight: ${p.weight}`,
    `Height: ${p.height}`,
    `Chronic conditions: ${[...p.conditions, p.other_condition].filter(Boolean).join(", ") || "None"}`,
    `Prescription medications: ${p.prescriptions || "None"}`,
    `Allergies: ${p.allergies || "None"}`,
    `Home medicines: ${p.home_meds || "None"}`,
  ];
  return parts.join("\n");
}

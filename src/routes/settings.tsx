import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  deleteProfile,
  getActiveProfile,
  getProfiles,
  setActiveProfileId,
  updateProfile,
  type Profile,
} from "@/lib/profile";
import { ArrowLeft, Check, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — OTC&Me" },
      { name: "description", content: "Manage your health profiles, conditions, prescriptions, and language preferences for OTC&Me." },
      { property: "og:title", content: "Settings — OTC&Me" },
      { property: "og:description", content: "Manage profiles and preferences for OTC&Me." },
      { property: "og:url", content: "https://me-otc-trade.lovable.app/settings" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://me-otc-trade.lovable.app/settings" }],
  }),
  component: SettingsPage,
});

const CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Heart Disease",
  "Kidney Disease",
  "Liver Disease",
  "Thyroid Disorder",
  "GERD/Acid Reflux",
];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

function SettingsPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Profile | null>(null);

  const refresh = () => {
    const all = getProfiles();
    setProfiles(all);
    const active = getActiveProfile();
    const next = (editingId && all.find((p) => p.id === editingId)) || active || all[0] || null;
    setEditingId(next?.id ?? null);
    setForm(next ? { ...next } : null);
  };

  useEffect(() => {
    const active = getActiveProfile();
    if (!active) {
      navigate({ to: "/onboarding" });
      return;
    }
    setProfiles(getProfiles());
    setEditingId(active.id);
    setForm({ ...active });
  }, [navigate]);

  if (!form) return null;

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const toggleCondition = (c: string) => {
    if (!form) return;
    const has = form.conditions.includes(c);
    update("conditions", has ? form.conditions.filter((x) => x !== c) : [...form.conditions, c]);
  };

  const pickProfile = (id: string) => {
    const p = getProfiles().find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setForm({ ...p });
  };

  const save = () => {
    if (!form) return;
    updateProfile(form.id, form);
    toast.success("Profile updated");
    refresh();
  };

  const remove = () => {
    if (!form) return;
    if (!confirm(`Delete profile "${form.profile_name}"? This cannot be undone.`)) return;
    deleteProfile(form.id);
    toast.success("Profile deleted");
    const remaining = getProfiles();
    if (remaining.length === 0) {
      navigate({ to: "/onboarding" });
    } else {
      setActiveProfileId(remaining[0].id);
      setEditingId(remaining[0].id);
      setForm({ ...remaining[0] });
      setProfiles(remaining);
    }
  };

  const hasOther = !!form.other_condition;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/onboarding" })}>
            <UserPlus className="h-4 w-4" /> Add profile
          </Button>
        </div>

        {profiles.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => pickProfile(p.id)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  p.id === editingId
                    ? "border-primary bg-primary/10 text-navy"
                    : "hover:bg-accent"
                }`}
              >
                {p.profile_name}
                {p.is_self && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Profile name</Label>
              <Input
                id="name"
                value={form.profile_name}
                onChange={(e) => update("profile_name", e.target.value)}
                disabled={form.is_self}
                className="mt-1"
              />
              {form.is_self && (
                <p className="mt-1 text-xs text-muted-foreground">Your personal profile.</p>
              )}
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {GENDERS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-6">
            <Label className="text-sm font-medium">Chronic conditions</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CONDITIONS.map((c) => (
                <label
                  key={c}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={form.conditions.includes(c)}
                    onCheckedChange={() => toggleCondition(c)}
                  />
                  {c}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Label htmlFor="other">Other condition</Label>
              <Input
                id="other"
                placeholder="Optional"
                value={form.other_condition ?? ""}
                onChange={(e) => update("other_condition", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="rx">Prescription medications</Label>
            <Textarea
              id="rx"
              value={form.prescriptions}
              onChange={(e) => update("prescriptions", e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="allergies">Known allergies</Label>
            <Textarea
              id="allergies"
              value={form.allergies}
              onChange={(e) => update("allergies", e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="home">Medicines at home</Label>
            <Textarea
              id="home"
              value={form.home_meds}
              onChange={(e) => update("home_meds", e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Lifestyle</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="smoking" className="text-xs">Smoking / tobacco</Label>
                <select
                  id="smoking"
                  value={form.lifestyle?.smoking ?? "Never"}
                  onChange={(e) =>
                    update("lifestyle", {
                      smoking: e.target.value,
                      alcohol: form.lifestyle?.alcohol ?? "None",
                      drugs: form.lifestyle?.drugs ?? "None",
                    })
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {["Never", "Former", "Occasional", "Daily"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alcohol" className="text-xs">Alcohol</Label>
                <select
                  id="alcohol"
                  value={form.lifestyle?.alcohol ?? "None"}
                  onChange={(e) =>
                    update("lifestyle", {
                      smoking: form.lifestyle?.smoking ?? "Never",
                      alcohol: e.target.value,
                      drugs: form.lifestyle?.drugs ?? "None",
                    })
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {["None", "Occasional (≤2/week)", "Moderate (3-7/week)", "Heavy (8+/week)"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="drugs" className="text-xs">Recreational drugs</Label>
                <Input
                  id="drugs"
                  placeholder="e.g. None, cannabis"
                  value={form.lifestyle?.drugs ?? ""}
                  onChange={(e) =>
                    update("lifestyle", {
                      smoking: form.lifestyle?.smoking ?? "Never",
                      alcohol: form.lifestyle?.alcohol ?? "None",
                      drugs: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={remove} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete profile
            </Button>
            <Button onClick={save}>
              <Check className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

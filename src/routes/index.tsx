import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { getActiveProfile, type Profile } from "@/lib/profile";
import { getHistoryForProfile, type HistoryEntry } from "@/lib/history";
import { Clock, Pill, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTC&Me — Your AI OTC aisle assistant" },
      {
        name: "description",
        content:
          "Pharmacist-built guidance for safer over-the-counter medicine choices based on your personal health profile.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) {
      navigate({ to: "/onboarding" });
    } else {
      setProfile(p);
      setHistory(getHistoryForProfile(p.id).slice(0, 5));
      setReady(true);
    }
  }, [navigate]);

  if (!ready || !profile) return null;

  const conditions = [...profile.conditions, profile.other_condition].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-accent text-navy">
              <Pill className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Active profile</p>
              <h1 className="text-2xl font-semibold">{profile.profile_name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Age {profile.age} • {profile.gender}
                {profile.height && profile.weight ? ` • ${profile.height} / ${profile.weight}` : ""}
              </p>

              {profile.lifestyle && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Smoking: {profile.lifestyle.smoking || "—"} • Alcohol: {profile.lifestyle.alcohol || "—"} • Drugs: {profile.lifestyle.drugs || "—"}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {conditions.length === 0 && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    No chronic conditions
                  </span>
                )}
                {conditions.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-navy"
                  >
                    {c}
                  </span>
                ))}
                {profile.prescriptions && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Rx: {profile.prescriptions}
                  </span>
                )}
                {profile.allergies && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    Allergies: {profile.allergies}
                  </span>
                )}
                {profile.home_meds && (
                  <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                    Home: {profile.home_meds}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="mt-8 text-lg font-semibold">How can we help today?</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate({ to: "/symptom" })}
            className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                I have a symptom — what should I get?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us what's going on and we'll suggest safer OTC options.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate({ to: "/safety" })}
            className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Is this medicine safe for me?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Snap a photo of the box or type the name to check fit with your profile.
              </p>
            </div>
          </button>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </div>
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-sm text-muted-foreground">
              No past consultations yet. Your symptom checks and safety lookups will appear here for {profile.profile_name}.
              {profile.home_meds && (
                <p className="mt-2 text-xs">
                  <span className="font-medium text-navy">Medicines you have at home:</span>{" "}
                  {profile.home_meds}
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() =>
                      navigate({ to: "/history/$id", params: { id: h.id } })
                    }
                    className="block w-full rounded-xl border bg-card p-3 text-left shadow-sm transition hover:border-primary hover:shadow-md"
                  >
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {h.type === "symptom" ? "Symptom check" : "Safety check"} ·{" "}
                      {new Date(h.created_at).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-navy">{h.query}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {h.summary}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {profile.home_meds && history.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-navy">At home:</span> {profile.home_meds}
            </p>
          )}
        </section>

        <p className="mt-8 rounded-lg border border-dashed bg-muted/50 p-4 text-xs text-muted-foreground">
          OTC&Me provides informational guidance only and is not a substitute for advice from your
          pharmacist or physician.
        </p>
      </main>
    </div>
  );
}

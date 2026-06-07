import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { getActiveProfile, type Profile } from "@/lib/profile";
import { Pill, Search, ShieldCheck } from "lucide-react";

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

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) {
      navigate({ to: "/onboarding" });
    } else {
      setProfile(p);
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
              </p>
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

        <p className="mt-8 rounded-lg border border-dashed bg-muted/50 p-4 text-xs text-muted-foreground">
          OTC&Me provides informational guidance only and is not a substitute for advice from your
          pharmacist or physician.
        </p>
      </main>
    </div>
  );
}

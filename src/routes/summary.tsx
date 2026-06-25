import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { getActiveProfile, type Profile } from "@/lib/profile";
import type { Recommendation, SafetyResult } from "@/lib/ai.functions";
import { ArrowLeft, Camera, Pill } from "lucide-react";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Pharmacist summary — OTC&Me" },
      { name: "description", content: "Shareable pharmacist-ready summary of your OTC consultation, including profile, query, and safety reasoning." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SummaryPage,
});

type SymptomData = {
  type: "symptom";
  query: string;
  clarification: string;
  recommendation: Recommendation;
};
type SafetyData = { type: "safety"; query: string; safety: SafetyResult };
type SummaryData = SymptomData | SafetyData;

function SummaryPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setProfile(p);
    try {
      const raw = sessionStorage.getItem("otcandme_summary");
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [navigate]);

  if (!profile || !data) return null;

  const conditions =
    [...profile.conditions, profile.other_condition].filter(Boolean).join(", ") || "None";

  let statusLabel = "";
  let explanation = "";
  if (data.type === "safety") {
    statusLabel = data.safety.safety_status;
    explanation = data.safety.explanation;
  } else {
    const topGreen = data.recommendation.categories.find((c) => c.status === "green");
    const top = topGreen ?? data.recommendation.categories[0];
    statusLabel = top
      ? top.status === "green"
        ? "Safe"
        : top.status === "yellow"
          ? "Caution"
          : "Not Recommended"
      : "—";
    explanation = data.recommendation.categories
      .map((c) => `• ${c.category_name} (${c.status}): ${c.reason}`)
      .join("\n");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-2xl px-4 py-8 print:py-0">
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Camera className="h-3.5 w-3.5" /> Save this card (screenshot or print)
          </div>
        </div>

        <article
          id="summary-card"
          className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm"
        >
          <header className="flex items-center gap-3 border-b bg-accent/50 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                OTC&amp;Me Pharmacist Summary
              </p>
              <h1 className="text-lg font-semibold text-navy">
                {new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h1>
            </div>
          </header>

          <Section title="Patient Profile">
            <Row label="Name" value={profile.profile_name} />
            <Row label="Age" value={profile.age || "—"} />
            <Row label="Chronic conditions" value={conditions} />
            <Row label="Allergies" value={profile.allergies || "None reported"} />
            <Row
              label="Current prescriptions"
              value={profile.prescriptions || "None reported"}
            />
          </Section>

          <Section title="Today's Query">
            <p className="text-sm">{data.query}</p>
            {data.type === "symptom" && data.clarification && (
              <p className="mt-2 text-xs text-muted-foreground">
                Clarification: {data.clarification}
              </p>
            )}
          </Section>

          <Section title="AI Recommendation / Safety Result">
            <p className="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-navy">
              {statusLabel}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{explanation}</p>
          </Section>

          <Section title="Questions to Ask Your Pharmacist">
            <p className="text-sm italic text-navy">
              "Please review this OTC selection considering my history of{" "}
              <strong>{conditions}</strong> and my current use of{" "}
              <strong>{profile.prescriptions || "no prescription medications"}</strong>. Are
              there any interactions or dosage adjustments I should be aware of?"
            </p>
          </Section>

          <footer className="border-t bg-muted/40 p-5">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              This summary was generated by OTC&amp;Me for informational purposes only and does
              not constitute medical advice. Always consult your pharmacist or physician before
              taking any medication.
            </p>
          </footer>
        </article>

        <div className="mt-4 flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()} className="flex-1">
            Print / Save as PDF
          </Button>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b p-5 last:border-0">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

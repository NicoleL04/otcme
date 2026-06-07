import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveProfile, profileSummary, type Profile } from "@/lib/profile";
import {
  getClarifyingQuestions,
  getProductDetails,
  getRecommendation,
  type ProductList,
  type Recommendation,
} from "@/lib/ai.functions";
import { addHistory } from "@/lib/history";
import { ArrowLeft, ChevronDown, Send, FileText, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/symptom")({
  head: () => ({
    meta: [{ title: "Symptom check — OTC&Me" }],
  }),
  component: SymptomPage,
});

type Stage = "input" | "clarify" | "loading-q" | "loading-r" | "result";

function SymptomPage() {
  const navigate = useNavigate();
  const askClarify = useServerFn(getClarifyingQuestions);
  const askRec = useServerFn(getRecommendation);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stage, setStage] = useState<Stage>("input");
  const [symptom, setSymptom] = useState("");
  const [questions, setQuestions] = useState("");
  const [answers, setAnswers] = useState("");
  const [result, setResult] = useState<Recommendation | null>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) navigate({ to: "/onboarding" });
    else setProfile(p);
  }, [navigate]);

  if (!profile) return null;

  const submitSymptom = async () => {
    if (!symptom.trim()) return;
    setStage("loading-q");
    try {
      const r = await askClarify({
        data: { profile: profileSummary(profile), symptom },
      });
      setQuestions(r.questions);
      setStage("clarify");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setStage("input");
    }
  };

  const submitAnswers = async () => {
    setStage("loading-r");
    try {
      const r = await askRec({
        data: {
          profile: profileSummary(profile),
          symptom,
          clarification: answers || "(no further detail)",
        },
      });
      setResult(r);
      setStage("result");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setStage("clarify");
    }
  };

  const goSummary = () => {
    if (!result) return;
    sessionStorage.setItem(
      "otcandme_summary",
      JSON.stringify({
        type: "symptom",
        query: symptom,
        clarification: answers,
        recommendation: result,
      }),
    );
    const top = result.categories.find((c) => c.status === "green") ?? result.categories[0];
    addHistory({
      profile_id: profile.id,
      type: "symptom",
      query: symptom,
      summary: top
        ? `${top.category_name} — ${top.status === "green" ? "Safe" : top.status === "yellow" ? "Consult pharmacist" : "Not recommended"}`
        : "No recommendation",
      status: top?.status,
    });
    navigate({ to: "/summary" });
  };

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

        <h1 className="text-2xl font-semibold">What's the symptom?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile: {profile.profile_name}
        </p>

        {stage === "input" && (
          <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
            <label className="text-sm font-medium">Describe your symptom or illness</label>
            <Textarea
              autoFocus
              placeholder="e.g. runny nose and sore throat for 2 days"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={submitSymptom} disabled={!symptom.trim()}>
                Continue <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {stage === "loading-q" && <LoaderCard label="Thinking of clarifying questions…" />}

        {(stage === "clarify" || stage === "loading-r") && (
          <div className="mt-6 space-y-3">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {symptom}
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-card px-4 py-3 text-sm shadow-sm">
              <p className="mb-1 text-xs font-semibold text-primary">OTC&amp;Me Assistant</p>
              <p className="whitespace-pre-wrap">{questions}</p>
            </div>
            {stage === "clarify" ? (
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <Textarea
                  autoFocus
                  placeholder="Type your answer…"
                  value={answers}
                  onChange={(e) => setAnswers(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={submitAnswers}>
                    Get recommendation <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <LoaderCard label="Finding the safest options for you…" />
            )}
          </div>
        )}

        {stage === "result" && result && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">Recommended categories</h2>
            {result.categories.map((c, i) => (
              <CategoryCard key={i} category={c} />
            ))}
            <Button onClick={goSummary} variant="outline" className="mt-4 w-full">
              <FileText className="h-4 w-4" /> Generate Pharmacist Summary Card
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function LoaderCard({ label }: { label: string }) {
  return (
    <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
      <p className="mb-3 text-sm text-muted-foreground">{label}</p>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: Recommendation["categories"][number] }) {
  const [open, setOpen] = useState(false);
  const styles = {
    green: {
      border: "border-l-success",
      badge: "bg-success text-success-foreground",
      label: "Safe",
      muted: false,
    },
    yellow: {
      border: "border-l-warning",
      badge: "bg-warning text-warning-foreground",
      label: "Consult Pharmacist",
      muted: false,
    },
    grey: {
      border: "border-l-neutral",
      badge: "bg-neutral text-neutral-foreground",
      label: "Not Recommended",
      muted: true,
    },
  }[category.status];

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className={`block w-full rounded-xl border border-l-4 bg-card p-4 text-left shadow-sm transition hover:shadow-md ${styles.border} ${
        styles.muted ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-navy">{category.category_name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{category.reason.split(". ")[0]}.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>
            {styles.label}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t pt-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why
            </p>
            <p className="mt-1">{category.reason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Dosage guidance
            </p>
            <p className="mt-1">{category.dosage_guidance}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Examples
            </p>
            <p className="mt-1">{category.examples.join(", ")}</p>
          </div>
        </div>
      )}
    </button>
  );
}

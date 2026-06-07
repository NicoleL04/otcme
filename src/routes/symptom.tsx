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
import {
  ArrowLeft,
  ChevronDown,
  Send,
  FileText,
  Tag,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceAssistant, isVoiceSupported } from "@/hooks/useVoiceAssistant";

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
  const [voiceActive, setVoiceActive] = useState(false);
  const voice = useVoiceAssistant();
  const voiceSupported = isVoiceSupported();

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) navigate({ to: "/onboarding" });
    else setProfile(p);
  }, [navigate]);

  if (!profile) return null;

  const runVoiceFlow = async () => {
    if (!profile) return;
    setVoiceActive(true);
    try {
      // Greeting + ask symptom
      await voice.speak(
        "Hi! I'm your O T C and Me assistant. In a few words, what symptom or illness can I help you with today?",
      );
      let symptomText = "";
      for (let attempt = 0; attempt < 3 && !symptomText; attempt++) {
        try {
          symptomText = await voice.listen();
        } catch {
          // ignore
        }
        if (!symptomText && attempt < 2) {
          await voice.speak("Sorry, I didn't catch that. Could you say it again?");
        }
      }
      if (!symptomText) {
        await voice.speak("I'm having trouble hearing you. Let's try typing instead.");
        setVoiceActive(false);
        return;
      }
      setSymptom(symptomText);
      await voice.speak(`Got it. You said: ${symptomText}. Let me ask you a quick follow-up.`);

      // Clarifying questions
      setStage("loading-q");
      const qRes = await askClarify({
        data: { profile: profileSummary(profile), symptom: symptomText },
      });
      setQuestions(qRes.questions);
      setStage("clarify");
      await voice.speak(qRes.questions);

      let answerText = "";
      for (let attempt = 0; attempt < 2 && !answerText; attempt++) {
        try {
          answerText = await voice.listen();
        } catch {
          // ignore
        }
        if (!answerText && attempt < 1) {
          await voice.speak("Could you repeat that for me?");
        }
      }
      setAnswers(answerText);
      await voice.speak(
        answerText
          ? `Thanks. Finding the safest options for you now.`
          : "No problem. Let me find some options based on what you told me.",
      );

      // Recommendation
      setStage("loading-r");
      const r = await askRec({
        data: {
          profile: profileSummary(profile),
          symptom: symptomText,
          clarification: answerText || "(no further detail)",
        },
      });
      const rank: Record<string, number> = { green: 0, yellow: 1, grey: 2 };
      const sorted = {
        ...r,
        categories: [...r.categories].sort(
          (a, b) => (rank[a.status] ?? 99) - (rank[b.status] ?? 99),
        ),
      };
      setResult(sorted);
      setStage("result");

      const top = sorted.categories[0];
      if (top) {
        const label =
          top.status === "green"
            ? "is generally safe for you"
            : top.status === "yellow"
              ? "may be okay, but please check with a pharmacist first"
              : "is not recommended for you";
        await voice.speak(
          `Your top option is ${top.category_name}. It ${label}. ${top.reason} You can see all options on screen, or tap any card to learn more.`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Voice flow failed";
      toast.error(msg);
      await voice.speak("Sorry, something went wrong. You can continue by typing.");
    } finally {
      setVoiceActive(false);
    }
  };

  const stopVoice = () => {
    voice.stopListening();
    voice.stopSpeaking();
    setVoiceActive(false);
  };

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
      const rank: Record<string, number> = { green: 0, yellow: 1, grey: 2 };
      const sorted = {
        ...r,
        categories: [...r.categories].sort(
          (a, b) => (rank[a.status] ?? 99) - (rank[b.status] ?? 99),
        ),
      };
      setResult(sorted);
      setStage("result");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setStage("clarify");
    }
  };

  const goSummary = () => {
    if (!result) return;
    // Rank: green → yellow → grey
    const rank: Record<string, number> = { green: 0, yellow: 1, grey: 2 };
    const sorted = {
      ...result,
      categories: [...result.categories].sort(
        (a, b) => (rank[a.status] ?? 99) - (rank[b.status] ?? 99),
      ),
    };
    setResult(sorted);
    sessionStorage.setItem(
      "otcandme_summary",
      JSON.stringify({
        type: "symptom",
        query: symptom,
        clarification: answers,
        recommendation: sorted,
      }),
    );
    const top = sorted.categories[0];
    addHistory({
      profile_id: profile.id,
      type: "symptom",
      query: symptom,
      summary: top
        ? `${top.category_name} — ${top.status === "green" ? "Safe" : top.status === "yellow" ? "Consult pharmacist" : "Not recommended"}`
        : "No recommendation",
      status: top?.status,
      payload: sorted,
      clarification: answers,
      profile_snapshot: profile,
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
            {voiceSupported && (
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">
                      Talk to OTC&amp;Me instead
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Hands-free voice conversation — one question at a time, no typing needed.
                    </p>
                  </div>
                  {voiceActive ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={stopVoice}
                    >
                      <Square className="h-4 w-4" /> Stop
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={runVoiceFlow}
                      disabled={voiceActive}
                    >
                      <Mic className="h-4 w-4" /> Start voice
                    </Button>
                  )}
                </div>
                {voiceActive && (
                  <VoiceStatus
                    speaking={voice.speaking}
                    listening={voice.listening}
                    interim={voice.interim}
                  />
                )}
              </div>
            )}
            <label className="text-sm font-medium">Describe your symptom or illness</label>
            <Textarea
              autoFocus
              placeholder="e.g. runny nose and sore throat for 2 days"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="mt-2 min-h-[100px]"
              disabled={voiceActive}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={submitSymptom} disabled={!symptom.trim() || voiceActive}>
                Continue <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {voiceActive && stage !== "input" && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <VoiceStatus
                speaking={voice.speaking}
                listening={voice.listening}
                interim={voice.interim}
              />
              <Button type="button" variant="destructive" size="sm" onClick={stopVoice}>
                <Square className="h-4 w-4" /> Stop voice
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

  const showLearnMore = category.status === "green" || category.status === "yellow";

  return (
    <div
      className={`block w-full rounded-xl border border-l-4 bg-card p-4 text-left shadow-sm transition hover:shadow-md ${styles.border} ${
        styles.muted ? "opacity-70" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
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
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t pt-3 text-sm">
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
          {showLearnMore && (
            <ProductExplorer
              activeIngredient={category.category_name}
              examples={category.examples}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ProductExplorer({
  activeIngredient,
  examples,
}: {
  activeIngredient: string;
  examples: string[];
}) {
  const fetchProducts = useServerFn(getProductDetails);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductList | null>(null);

  const load = async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const r = await fetchProducts({
        data: { active_ingredient: activeIngredient, examples },
      });
      setData(r);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Couldn't load products");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading products…
          </>
        ) : (
          <>
            <Tag className="h-3.5 w-3.5" /> Learn more — products &amp; prices
          </>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Products containing {data.active_ingredient}
      </p>
      <ul className="mt-2 divide-y">
        {data.products.map((p, i) => (
          <li key={i} className="flex items-start justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-navy">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                {p.type} · {p.form} · {p.strength} · {p.typical_pack}
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-navy">
              {p.reference_price_usd}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] italic text-muted-foreground">{data.price_note}</p>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getActiveProfile,
  profileSummary,
  updateProfile,
  type Profile,
} from "@/lib/profile";
import {
  getClarifyingQuestions,
  getProductDetails,
  getRecommendation,
  getSymptomProbes,
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
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceAssistant, isVoiceSupported } from "@/hooks/useVoiceAssistant";
import { NearbyPharmaciesDialog } from "@/components/NearbyPharmaciesDialog";

export const Route = createFileRoute("/symptom")({
  head: () => ({
    meta: [{ title: "Symptom check — OTC&Me" }],
  }),
  component: SymptomPage,
});

type Stage = "input" | "clarify" | "loading-q" | "loading-r" | "result";

type ChatMsg = { role: "assistant" | "user"; text: string };
type Probe = {
  key: string;
  q: string;
  // Optional handler that can transform the answer or push a follow-up probe.
  // Return value is stored under `key` in probeAnswers. May also mutate patches.
  handle?: (
    answer: string,
    ctx: {
      profilePatch: Record<string, string>;
      lifestylePatch: Record<string, string>;
      pushFollowup: (p: Probe) => void;
    },
  ) => string;
};

function SymptomPage() {
  const navigate = useNavigate();
  const askClarify = useServerFn(getClarifyingQuestions);
  const askRec = useServerFn(getRecommendation);
  const askProbes = useServerFn(getSymptomProbes);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stage, setStage] = useState<Stage>("input");
  const [symptom, setSymptom] = useState("");
  const [questions, setQuestions] = useState("");
  const [answers, setAnswers] = useState("");
  const [result, setResult] = useState<Recommendation | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  // Text-chat probing state
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [probeQueue, setProbeQueue] = useState<Probe[]>([]);
  const [probeAnswers, setProbeAnswers] = useState<Record<string, string>>({});
  const [patches, setPatches] = useState<{
    profile: Record<string, string>;
    lifestyle: Record<string, string>;
  }>({ profile: {}, lifestyle: {} });
  const [textInput, setTextInput] = useState("");

  const voice = useVoiceAssistant();
  const voiceSupported = isVoiceSupported();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) navigate({ to: "/onboarding" });
    else setProfile(p);
  }, [navigate]);

  // Auto-scroll the inner chat panel to the latest message (without scrolling the page).
  useEffect(() => {
    const el = messagesEndRef.current;
    const scroller = el?.parentElement;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [chat.length, stage, voice.interim]);


  if (!profile) return null;




  // Minimal fallback probes if the AI probe call fails.
  const fallbackProbes = (): Probe[] => [
    { key: "duration", q: "How long has this been going on?" },
    { key: "taken_last_24h", q: "Taken anything for it in the last 24 hours?" },
  ];

  const fetchProbes = async (p: Profile, symptomText: string): Promise<Probe[]> => {
    try {
      const res = await askProbes({
        data: { profile: profileSummary(p), symptom: symptomText },
      });
      return res.probes.map((pr) => ({ key: pr.key, q: pr.q }));
    } catch {
      return fallbackProbes();
    }
  };



  const runVoiceFlow = async () => {
    if (!profile) return;
    voice.resetCancel();
    setVoiceActive(true);
    setChat([]);



    // Wrappers that mirror the spoken conversation into the on-screen chat.
    const say = async (text: string) => {
      if (voice.isCancelled()) throw new Error("__voice_cancelled__");
      setChat((c) => [...c, { role: "assistant", text }]);
      await voice.speak(text);
      if (voice.isCancelled()) throw new Error("__voice_cancelled__");
    };
    const askOneShown = async (
      prompt: string,
      opts: { retries?: number; rephrase?: string } = {},
    ): Promise<string> => {
      const retries = opts.retries ?? 1;
      if (voice.isCancelled()) throw new Error("__voice_cancelled__");
      setChat((c) => [...c, { role: "assistant", text: prompt }]);
      await voice.speak(prompt);
      if (voice.isCancelled()) throw new Error("__voice_cancelled__");
      let answer = "";
      for (let attempt = 0; attempt <= retries && !answer; attempt++) {
        if (voice.isCancelled()) throw new Error("__voice_cancelled__");
        try {
          answer = (await voice.listen()).trim();
        } catch {
          // ignore
        }
        if (voice.isCancelled()) throw new Error("__voice_cancelled__");
        if (!answer && attempt < retries) {
          const r =
            opts.rephrase ||
            "Sorry, I didn't quite catch that. Could you say it once more?";
          setChat((c) => [...c, { role: "assistant", text: r }]);
          await voice.speak(r);
          if (voice.isCancelled()) throw new Error("__voice_cancelled__");
        }
      }
      if (answer) setChat((c) => [...c, { role: "user", text: answer }]);
      return answer;
    };

    try {
      // 1. Greeting + main symptom
      const symptomText = await askOneShown("Hello, how can I help you today?", {
        retries: 2,
        rephrase: "No worries — in your own words, what's bothering you today?",
      });
      if (!symptomText) {
        await say("I'm having trouble hearing you. Let's try typing instead.");
        setVoiceActive(false);
        return;
      }
      setSymptom(symptomText);
      await say(
        "Thanks for sharing. I'd like to ask a few quick questions so I can point you to the safest option.",
      );


      // 2. Dynamic, profile-aware probes — short, varied, skip what's known.
      const probes = await fetchProbes(profile, symptomText);
      if (voice.isCancelled()) throw new Error("__voice_cancelled__");
      const probeAnswers: Record<string, string> = {};
      for (const p of probes) {
        const a = await askOneShown(p.q);
        if (a) probeAnswers[p.key] = a;
      }

      const updatedProfile: Profile = profile;


      // 5. Confirm before searching
      await say(
        "Great, I have what I need. Give me a moment to find the safest options for you.",
      );



      // Build a rich clarification string
      const clarificationParts: string[] = [];
      for (const p of probes) {
        if (probeAnswers[p.key]) clarificationParts.push(`${p.key}: ${probeAnswers[p.key]}`);
      }
      if (probeAnswers.alcohol_recent)
        clarificationParts.push(`alcohol_last_24h: ${probeAnswers.alcohol_recent}`);
      if (probeAnswers.smoking_recent)
        clarificationParts.push(`smoking_last_24h: ${probeAnswers.smoking_recent}`);
      if (probeAnswers.drugs_recent)
        clarificationParts.push(`drugs_last_24h: ${probeAnswers.drugs_recent}`);
      const clarificationText = clarificationParts.join("\n");
      setAnswers(clarificationText);

      // Also fetch the model's own clarifying questions for the on-screen log
      setStage("loading-q");
      try {
        const qRes = await askClarify({
          data: { profile: profileSummary(updatedProfile), symptom: symptomText },
        });
        setQuestions(qRes.questions);
      } catch {
        setQuestions("Voice intake completed.");
      }

      // 6. Recommendation
      setStage("loading-r");
      const r = await askRec({
        data: {
          profile: profileSummary(updatedProfile),
          symptom: symptomText,
          clarification: clarificationText || "(no further detail)",
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
        await say(
          `Your top option is ${top.category_name}. It ${label}. ${top.reason} You can see all options on screen, or tap any card to learn more.`,
        );
      }
    } catch (e) {
      const isCancel =
        voice.isCancelled() ||
        (e instanceof Error && e.message === "__voice_cancelled__");
      if (!isCancel) {
        const msg = e instanceof Error ? e.message : "Voice flow failed";
        toast.error(msg);
        try {
          await say("Sorry, something went wrong. You can continue by typing.");
        } catch {
          // ignore
        }
      }
    } finally {
      setVoiceActive(false);
    }
  };


  const stopVoice = () => {
    voice.cancelAll();
    setVoiceActive(false);
  };

  const submitSymptom = async () => {
    if (!symptom.trim()) return;
    setProbeAnswers({});
    setPatches({ profile: {}, lifestyle: {} });
    setChat([
      { role: "user", text: symptom },
      {
        role: "assistant",
        text: "Thanks. Thinking of a few quick questions…",
      },
    ]);
    setAnswers("");
    setTextInput("");
    setStage("loading-q");
    const probes = await fetchProbes(profile, symptom);
    setProbeQueue(probes);
    setChat((c) => [
      ...c.filter((m) => m.text !== "Thanks. Thinking of a few quick questions…"),
      {
        role: "assistant",
        text: "Thanks for sharing. A few quick questions so I can point you to the safest option.",
      },
      { role: "assistant", text: probes[0].q },
    ]);
    setStage("clarify");
  };

  const finalizeTextFlow = async (
    finalAnswers: Record<string, string>,
    finalPatches: { profile: Record<string, string>; lifestyle: Record<string, string> },
  ) => {
    // Apply profile patches
    let updatedProfile: Profile = profile;
    const hasProfilePatch = Object.keys(finalPatches.profile).length > 0;
    const hasLifestylePatch = Object.keys(finalPatches.lifestyle).length > 0;
    if (hasProfilePatch || hasLifestylePatch) {
      updatedProfile = {
        ...profile,
        ...finalPatches.profile,
        lifestyle: {
          smoking: profile.lifestyle?.smoking || "",
          alcohol: profile.lifestyle?.alcohol || "",
          drugs: profile.lifestyle?.drugs || "",
          ...profile.lifestyle,
          ...finalPatches.lifestyle,
        },
      };
      updateProfile(profile.id, {
        ...finalPatches.profile,
        lifestyle: updatedProfile.lifestyle,
      });
      setProfile(updatedProfile);
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: "Thanks — I've saved that to your profile so you don't have to repeat it next time.",
        },
      ]);
    }

    // Build clarification text
    const clarificationText = Object.entries(finalAnswers)
      .filter(([k]) => !k.startsWith("_profile_"))
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    setAnswers(clarificationText);

    setStage("loading-q");
    try {
      const qRes = await askClarify({
        data: { profile: profileSummary(updatedProfile), symptom },
      });
      setQuestions(qRes.questions);
    } catch {
      setQuestions("Intake completed.");
    }

    setStage("loading-r");
    try {
      const r = await askRec({
        data: {
          profile: profileSummary(updatedProfile),
          symptom,
          clarification: clarificationText || "(no further detail)",
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

  const submitTextAnswer = () => {
    const ans = textInput.trim();
    if (!ans || probeQueue.length === 0) return;
    const [current, ...rest] = probeQueue;
    const followups: Probe[] = [];
    const localProfilePatch = { ...patches.profile };
    const localLifestylePatch = { ...patches.lifestyle };
    const stored = current.handle
      ? current.handle(ans, {
          profilePatch: localProfilePatch,
          lifestylePatch: localLifestylePatch,
          pushFollowup: (p) => followups.push(p),
        })
      : ans;

    const newAnswers = { ...probeAnswers, [current.key]: stored };
    const newPatches = { profile: localProfilePatch, lifestyle: localLifestylePatch };
    const newQueue = [...followups, ...rest];

    setProbeAnswers(newAnswers);
    setPatches(newPatches);
    setProbeQueue(newQueue);
    setChat((c) => [...c, { role: "user", text: ans }]);
    setTextInput("");

    if (newQueue.length > 0) {
      setChat((c) => [...c, { role: "assistant", text: newQueue[0].q }]);
    } else {
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: "Great, I have what I need. Finding the safest options for you now.",
        },
      ]);
      void finalizeTextFlow(newAnswers, newPatches);
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

        {(voiceActive ||
          stage === "clarify" ||
          stage === "loading-q" ||
          stage === "loading-r" ||
          (stage === "result" && chat.length > 0)) && (
          <div className="mt-6 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
            {voiceActive && (
              <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2">
                <VoiceStatus
                  speaking={voice.speaking}
                  listening={voice.listening}
                  interim={voice.interim}
                />
                <Button type="button" variant="destructive" size="sm" onClick={stopVoice}>
                  <Square className="h-4 w-4" /> Stop voice
                </Button>
              </div>
            )}

            <div className="max-h-[55vh] min-h-[280px] flex-1 space-y-3 overflow-y-auto p-4">
              {stage === "loading-q" && chat.length === 0 && (
                <LoaderCard label="Thinking of clarifying questions…" />
              )}
              {chat.map((m, i) =>
                m.role === "user" ? (
                  <div
                    key={i}
                    className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                  >
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={i}
                    className="max-w-[85%] rounded-2xl rounded-tl-sm border bg-background px-4 py-3 text-sm shadow-sm"
                  >
                    <p className="mb-1 text-xs font-semibold text-primary">OTC&amp;Me Assistant</p>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                ),
              )}
              {stage === "loading-q" && chat.length > 0 && (
                <LoaderCard label="Reviewing your answers…" />
              )}
              {stage === "loading-r" && (
                <LoaderCard label="Finding the safest options for you…" />
              )}
              <div ref={messagesEndRef} />
            </div>

            {stage === "clarify" && probeQueue.length > 0 && (
              <div className="border-t bg-background p-3">
                <Textarea
                  autoFocus
                  placeholder="Type your answer…"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitTextAnswer();
                    }
                  }}
                  className="min-h-[60px]"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Question {Object.keys(probeAnswers).length + 1}
                  </p>
                  <Button onClick={submitTextAnswer} disabled={!textInput.trim()}>
                    Send <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
  const [nearbyOpen, setNearbyOpen] = useState(false);
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
            <div className="flex flex-wrap items-center gap-2">
              <ProductExplorer
                activeIngredient={category.category_name}
                examples={category.examples}
              />
              <button
                type="button"
                onClick={() => setNearbyOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/10"
              >
                <MapPin className="h-3.5 w-3.5" />
                Find {category.category_name} nearby
              </button>
            </div>
          )}
        </div>
      )}
      {showLearnMore && (
        <NearbyPharmaciesDialog
          open={nearbyOpen}
          onOpenChange={setNearbyOpen}
          ingredient={category.category_name}
          examples={category.examples}
        />
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

function VoiceStatus({
  speaking,
  listening,
  interim,
}: {
  speaking: boolean;
  listening: boolean;
  interim: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      {speaking ? (
        <>
          <Volume2 className="h-4 w-4 animate-pulse text-primary" />
          <span>Assistant is speaking…</span>
        </>
      ) : listening ? (
        <>
          <Mic className="h-4 w-4 animate-pulse text-primary" />
          <span>Listening{interim ? `: "${interim}"` : "…"}</span>
        </>
      ) : (
        <>
          <MicOff className="h-4 w-4" />
          <span>Thinking…</span>
        </>
      )}
    </div>
  );
}

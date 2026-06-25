import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveProfile, profileSummary, type Profile } from "@/lib/profile";
import { addHistory } from "@/lib/history";
import {
  checkMedicationSafety,
  extractMedicationFromImage,
  type SafetyResult,
} from "@/lib/ai.functions";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useT, useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [{ title: "Medication safety check — OTC&Me" }],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const navigate = useNavigate();
  const t = useT();
  const { language } = useLanguage();
  const check = useServerFn(checkMedicationSafety);
  const extract = useServerFn(extractMedicationFromImage);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [medName, setMedName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) navigate({ to: "/onboarding" });
    else setProfile(p);
  }, [navigate]);

  if (!profile) return null;

  const onFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setExtracting(true);
      try {
        const r = await extract({ data: { image_data_url: dataUrl } });
        if (r.medication_name && r.medication_name.toUpperCase() !== "UNKNOWN") {
          setMedName(r.medication_name);
          toast.success(t("saf_identified", { name: r.medication_name }));
        } else {
          toast.error(t("saf_couldnt_read"));
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Image read failed");
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!medName.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await check({
        data: { profile: profileSummary(profile), medication_name: medName.trim(), language },
      });
      setResult(r);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Safety check failed");
    } finally {
      setLoading(false);
    }
  };

  const goSummary = () => {
    if (!result) return;
    sessionStorage.setItem(
      "otcandme_summary",
      JSON.stringify({
        type: "safety",
        query: medName,
        safety: result,
      }),
    );
    addHistory({
      profile_id: profile.id,
      type: "safety",
      query: medName,
      summary: `${result.safety_status === "Yes" ? "Safe" : result.safety_status === "Caution" ? "Caution" : "Avoid"} — ${result.explanation.split(". ")[0]}.`,
      status: result.safety_status,
      payload: result,
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

        <h1 className="text-2xl font-semibold">Is this medicine safe for me?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile: {profile.profile_name}</p>

        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium">Upload a photo of the label or box</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/30 p-6 transition hover:bg-muted/60"
          >
            {preview ? (
              <img
                src={preview}
                alt="medication"
                className="max-h-40 rounded-md object-contain"
              />
            ) : (
              <>
                <Camera className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Tap to take a photo or upload</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </>
            )}
          </button>
          {extracting && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Reading the label…
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>

          <label className="text-sm font-medium">Type the medication name</label>
          <Input
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            placeholder="e.g. Ibuprofen 200mg"
            className="mt-2"
          />

          <Button
            onClick={submit}
            disabled={loading || extracting || !medName.trim()}
            className="mt-4 w-full"
          >
            <Upload className="h-4 w-4" /> Check safety
          </Button>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
            <p className="mb-3 text-sm text-muted-foreground">Checking against your profile…</p>
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        )}

        {result && <ResultCard result={result} onSummary={goSummary} />}
      </main>
    </div>
  );
}

function ResultCard({
  result,
  onSummary,
}: {
  result: SafetyResult;
  onSummary: () => void;
}) {
  const map = {
    Yes: {
      border: "border-success",
      bg: "bg-success/10",
      icon: <CheckCircle2 className="h-8 w-8 text-success" />,
      title: "Yes — Safe",
      badge: "bg-success text-success-foreground",
    },
    Caution: {
      border: "border-warning",
      bg: "bg-warning/10",
      icon: <AlertTriangle className="h-8 w-8 text-warning" />,
      title: "Use with caution",
      badge: "bg-warning text-warning-foreground",
    },
    No: {
      border: "border-destructive",
      bg: "bg-destructive/10",
      icon: <XCircle className="h-8 w-8 text-destructive" />,
      title: "No — Avoid",
      badge: "bg-destructive text-destructive-foreground",
    },
  }[result.safety_status];

  return (
    <div className="mt-6">
      <div className={`rounded-2xl border-2 p-6 shadow-sm ${map.border} ${map.bg}`}>
        <div className="flex items-start gap-4">
          {map.icon}
          <div className="flex-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map.badge}`}>
              {result.safety_status}
            </span>
            <h2 className="mt-1 text-xl font-semibold">{map.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy">{result.explanation}</p>
          </div>
        </div>
      </div>
      <Button onClick={onSummary} variant="outline" className="mt-4 w-full">
        <FileText className="h-4 w-4" /> Generate Pharmacist Summary Card
      </Button>
    </div>
  );
}

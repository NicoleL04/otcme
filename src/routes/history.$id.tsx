import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/TopNav";
import { getHistoryEntry, type HistoryEntry } from "@/lib/history";
import { getProductDetails, type ProductList, type Recommendation, type SafetyResult } from "@/lib/ai.functions";
import { NearbyPharmaciesDialog } from "@/components/NearbyPharmaciesDialog";
import {
  ArrowLeft,
  ChevronDown,
  Tag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/history/$id")({
  head: () => ({ meta: [{ title: "Past consultation — OTC&Me" }] }),
  component: HistoryDetailPage,
});

function HistoryDetailPage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const e = getHistoryEntry(id);
    setEntry(e ?? null);
    setReady(true);
  }, [id]);

  if (!ready) return null;

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

        {!entry ? (
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              This past consultation is no longer available.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {entry.type === "symptom" ? "Symptom check" : "Safety check"} ·{" "}
              {new Date(entry.created_at).toLocaleString()}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{entry.query}</h1>
            {entry.clarification && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-navy">Your notes:</span> {entry.clarification}
              </p>
            )}

            {entry.profile_snapshot && (
              <PatientSnapshotCard profile={entry.profile_snapshot} />
            )}

            <div className="mt-6 space-y-3">
              {entry.type === "symptom" && entry.payload ? (
                <SymptomDetail rec={entry.payload as Recommendation} />
              ) : entry.type === "safety" && entry.payload ? (
                <SafetyDetail result={entry.payload as SafetyResult} />
              ) : (
                <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                  {entry.summary}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PatientSnapshotCard({ profile }: { profile: import("@/lib/profile").Profile }) {
  const conditions = [...profile.conditions, profile.other_condition].filter(Boolean) as string[];
  return (
    <div className="mt-4 rounded-2xl border bg-card p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Patient profile at the time
      </p>
      <div className="mt-1.5 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal text-sm font-semibold text-white">
          {profile.profile_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{profile.profile_name}</p>
          <p className="text-xs text-muted-foreground">
            Age {profile.age} · {profile.gender}
            {profile.height && profile.weight ? ` · ${profile.height} / ${profile.weight}` : ""}
          </p>
          {profile.lifestyle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Smoking: {profile.lifestyle.smoking || "—"} · Alcohol: {profile.lifestyle.alcohol || "—"} · Drugs: {profile.lifestyle.drugs || "—"}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <span key={c} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-navy">
                {c}
              </span>
            ))}
            {profile.prescriptions && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Rx: {profile.prescriptions}
              </span>
            )}
            {profile.allergies && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                Allergies: {profile.allergies}
              </span>
            )}
            {profile.home_meds && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning-foreground">
                Home: {profile.home_meds}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SymptomDetail({ rec }: { rec: Recommendation }) {
  return (
    <>
      <h2 className="text-lg font-semibold">Recommended categories</h2>
      {rec.categories.map((c, i) => (
        <CategoryCard key={i} category={c} />
      ))}
    </>
  );
}

function CategoryCard({ category }: { category: Recommendation["categories"][number] }) {
  const [open, setOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const styles = {
    green: { border: "border-l-success", badge: "bg-success text-success-foreground", label: "Safe", muted: false },
    yellow: { border: "border-l-warning", badge: "bg-warning text-warning-foreground", label: "Consult Pharmacist", muted: false },
    grey: { border: "border-l-neutral", badge: "bg-neutral text-neutral-foreground", label: "Not Recommended", muted: true },
  }[category.status];

  const showLearnMore = category.status === "green" || category.status === "yellow";

  return (
    <div className={`block w-full rounded-xl border border-l-4 bg-card p-4 text-left shadow-sm transition hover:shadow-md ${styles.border} ${styles.muted ? "opacity-70" : ""}`}>
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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}>{styles.label}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t pt-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why</p>
            <p className="mt-1">{category.reason}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dosage guidance</p>
            <p className="mt-1">{category.dosage_guidance}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examples</p>
            <p className="mt-1">{category.examples.join(", ")}</p>
          </div>
          {showLearnMore && (
            <div className="flex flex-wrap items-center gap-2">
              <ProductExplorer activeIngredient={category.category_name} examples={category.examples} />
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

function ProductExplorer({ activeIngredient, examples }: { activeIngredient: string; examples: string[] }) {
  const fetchProducts = useServerFn(getProductDetails);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductList | null>(null);

  const load = async () => {
    if (data || loading) return;
    setLoading(true);
    try {
      const r = await fetchProducts({ data: { active_ingredient: activeIngredient, examples } });
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
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading products…</>
        ) : (
          <><Tag className="h-3.5 w-3.5" /> Learn more — products &amp; prices</>
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
            <p className="whitespace-nowrap text-sm font-semibold text-navy">{p.reference_price_usd}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] italic text-muted-foreground">{data.price_note}</p>
    </div>
  );
}

function SafetyDetail({ result }: { result: SafetyResult }) {
  const map = {
    Yes: { border: "border-success", bg: "bg-success/10", icon: <CheckCircle2 className="h-8 w-8 text-success" />, title: "Yes — Safe", badge: "bg-success text-success-foreground" },
    Caution: { border: "border-warning", bg: "bg-warning/10", icon: <AlertTriangle className="h-8 w-8 text-warning" />, title: "Use with caution", badge: "bg-warning text-warning-foreground" },
    No: { border: "border-destructive", bg: "bg-destructive/10", icon: <XCircle className="h-8 w-8 text-destructive" />, title: "No — Avoid", badge: "bg-destructive text-destructive-foreground" },
  }[result.safety_status];

  return (
    <div className={`rounded-2xl border-2 p-6 shadow-sm ${map.border} ${map.bg}`}>
      <div className="flex items-start gap-4">
        {map.icon}
        <div className="flex-1">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map.badge}`}>{result.safety_status}</span>
          <h2 className="mt-1 text-xl font-semibold">{map.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy">{result.explanation}</p>
        </div>
      </div>
    </div>
  );
}

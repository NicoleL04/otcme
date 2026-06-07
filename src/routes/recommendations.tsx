import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { getActiveProfile, type Profile } from "@/lib/profile";
import {
  getProductDetails,
  type ProductList,
  type Recommendation,
} from "@/lib/ai.functions";
import { addHistory } from "@/lib/history";
import { NearbyPharmaciesDialog } from "@/components/NearbyPharmaciesDialog";
import { ArrowLeft, ChevronDown, FileText, Loader2, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [{ title: "Recommended categories — OTC&Me" }],
  }),
  component: RecommendationsPage,
});

type StoredRecs = {
  symptom: string;
  clarification: string;
  recommendation: Recommendation;
};

function RecommendationsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [data, setData] = useState<StoredRecs | null>(null);

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setProfile(p);
    try {
      const raw = sessionStorage.getItem("otcandme_recommendations");
      if (raw) setData(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [navigate]);

  if (!profile) return null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <button
            onClick={() => navigate({ to: "/symptom" })}
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back to symptom check
          </button>
          <p className="text-sm text-muted-foreground">
            No recommendations found. Start a new symptom check to see options.
          </p>
        </main>
      </div>
    );
  }

  const goSummary = () => {
    sessionStorage.setItem(
      "otcandme_summary",
      JSON.stringify({
        type: "symptom",
        query: data.symptom,
        clarification: data.clarification,
        recommendation: data.recommendation,
      }),
    );
    const top = data.recommendation.categories[0];
    addHistory({
      profile_id: profile.id,
      type: "symptom",
      query: data.symptom,
      summary: top
        ? `${top.category_name} — ${top.status === "green" ? "Safe" : top.status === "yellow" ? "Consult pharmacist" : "Not recommended"}`
        : "No recommendation",
      status: top?.status,
      payload: data.recommendation,
      clarification: data.clarification,
      profile_snapshot: profile,
    });
    navigate({ to: "/summary" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate({ to: "/symptom" })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to symptom check
        </button>

        <h1 className="text-2xl font-semibold">Recommended categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on: <span className="font-medium text-navy">{data.symptom}</span>
        </p>

        <div className="mt-6 space-y-3">
          {data.recommendation.categories.map((c, i) => (
            <CategoryCard key={i} category={c} />
          ))}
          <Button onClick={goSummary} variant="outline" className="mt-4 w-full">
            <FileText className="h-4 w-4" /> Generate Pharmacist Summary Card
          </Button>
        </div>
      </main>
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

import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Loader2, CheckCircle2, AlertCircle, XCircle, Heart } from "lucide-react";
import { simulateNearbyOptions, type NearbyOption, type StockLevel } from "@/lib/pharmacy-simulator";
import { getActiveProfile } from "@/lib/profile";
import { isInWishlist, toggleWishlist } from "@/lib/wishlist";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: string;
  examples: string[];
};

const STOCK_META: Record<StockLevel, { label: string; cls: string; icon: ReactNode }> = {
  in: {
    label: "In stock",
    cls: "bg-success/15 text-success border-success/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  low: {
    label: "Low stock",
    cls: "bg-warning/15 text-warning-foreground border-warning/40",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  out: {
    label: "Out of stock",
    cls: "bg-neutral/30 text-muted-foreground border-neutral/40",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export function NearbyPharmaciesDialog({ open, onOpenChange, ingredient, examples }: Props) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<NearbyOption[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refreshSaved = (opts: NearbyOption[]) => {
    const p = getActiveProfile();
    if (!p) return;
    setSavedIds(new Set(opts.filter((o) => isInWishlist(p.id, ingredient, o)).map((o) => o.id)));
  };

  const handleToggleSave = (opt: NearbyOption) => {
    const p = getActiveProfile();
    if (!p) return;
    const nowSaved = toggleWishlist(p.id, ingredient, opt);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(opt.id);
      else next.delete(opt.id);
      return next;
    });
    toast.success(nowSaved ? "Saved to wishlist" : "Removed from wishlist");
  };

  useEffect(() => {
    if (!open) return;
    if (options) return;
    setLoading(true);

    const compute = () => {
      const result = simulateNearbyOptions(ingredient, examples);
      setOptions(result);
      setLoading(false);
    };

    // Best-effort geolocation request (assume permission granted). We don't
    // use the coords for the simulation, but request it so the UX matches
    // a real "near you" lookup.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        compute();
      };
      navigator.geolocation.getCurrentPosition(finish, finish, { timeout: 2000, maximumAge: 60_000 });
      // Safety fallback in case the browser never resolves.
      setTimeout(finish, 2200);
    } else {
      compute();
    }
  }, [open, ingredient, examples, options]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Nearby options for {ingredient}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pharmacies near you carrying {ingredient}. Sorted by stock and distance.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          {loading || !options ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding pharmacies near you…
            </div>
          ) : options.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No nearby options found.
            </p>
          ) : (
            <ul className="divide-y">
              {options.map((opt) => {
                const meta = STOCK_META[opt.stock];
                return (
                  <li
                    key={opt.id}
                    className={`flex items-start justify-between gap-3 py-3 ${opt.stock === "out" ? "opacity-60" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-navy">{opt.pharmacy}</p>
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy">
                          {opt.brandType}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-navy">{opt.productName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {opt.address} · {opt.distanceMi.toFixed(1)} mi away
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-semibold text-navy">
                        ${opt.priceUsd.toFixed(2)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.cls}`}
                      >
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t bg-muted/30 px-5 py-2.5">
          <p className="text-[11px] italic text-muted-foreground">
            Simulated availability for demo purposes. Confirm with the pharmacy before visiting.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

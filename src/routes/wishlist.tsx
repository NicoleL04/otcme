import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";
import { getActiveProfile, type Profile } from "@/lib/profile";
import { getWishlist, removeFromWishlist, type WishlistItem } from "@/lib/wishlist";
import { ArrowLeft, Heart, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — OTC&Me" },
      { name: "description", content: "Your saved over-the-counter medications and nearby pharmacy availability, all in one place." },
      { property: "og:title", content: "Wishlist — OTC&Me" },
      { property: "og:description", content: "Saved OTC medications and nearby pharmacy availability." },
      { property: "og:url", content: "https://me-otc-trade.lovable.app/wishlist" },
    ],
    links: [{ rel: "canonical", href: "https://me-otc-trade.lovable.app/wishlist" }],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);

  const refresh = (p: Profile) => setItems(getWishlist(p.id));

  useEffect(() => {
    const p = getActiveProfile();
    if (!p) {
      navigate({ to: "/onboarding" });
      return;
    }
    setProfile(p);
    refresh(p);
    const onChange = () => refresh(p);
    window.addEventListener("otcandme:wishlist-changed", onChange);
    return () => window.removeEventListener("otcandme:wishlist-changed", onChange);
  }, [navigate]);

  if (!profile) return null;

  const handleRemove = (item: WishlistItem) => {
    removeFromWishlist(profile.id, item.ingredient, item);
    refresh(profile);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold">Wishlist</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Medications saved for {profile.profile_name}.
        </p>

        {items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No saved medications yet. Tap the heart on any nearby pharmacy option to save it here.
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {items.map((item) => (
              <li
                key={`${item.ingredient}-${item.id}`}
                className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.ingredient}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-navy">{item.productName}</p>
                  <p className="mt-0.5 text-sm text-navy">{item.pharmacy}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {item.address} · {item.distanceMi.toFixed(1)} mi
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm font-semibold text-navy">
                    ${item.priceUsd.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

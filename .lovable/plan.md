## Goal
Add a "Find [medicine] nearby" link on each recommended medication category card (green/yellow). Clicking it opens a popup dialog showing simulated nearby pharmacies with the product in stock, including pharmacy name, address, distance, price, and stock status.

## Scope
- Applies wherever recommendation category cards render: `src/routes/symptom.tsx` and `src/routes/history.$id.tsx` (the shared `CategoryCard` UI).
- Assume location services are enabled — request geolocation once via `navigator.geolocation.getCurrentPosition`. If the user denies or it fails, fall back silently to a default coordinate so the simulation still works.

## UX
1. Inside each green/yellow `CategoryCard` (next to the existing "Learn more — products & prices" button), add a secondary link-style button: **"Find [active ingredient] nearby"**.
2. Click → opens a shadcn `Dialog` (modal popup) titled e.g. "Nearby options for Acetaminophen".
3. Dialog body shows a scrollable list (6–10 entries) of simulated pharmacy results. Each row:
   - Pharmacy name + brand chip (e.g. "Walgreens — Tylenol Extra Strength" or "CVS — CVS Health Acetaminophen")
   - Address (simulated street near user)
   - Distance (e.g. "0.4 mi")
   - Price (e.g. "$9.49")
   - Stock badge: **In stock** (green), **Low stock** (yellow), or **Out of stock** (grey, sorted to bottom)
4. Sort: in-stock first, then by distance ascending.
5. Small disclaimer at bottom: "Simulated availability for demo purposes. Confirm with the pharmacy before visiting."

## Simulation logic (new file)
Create `src/lib/pharmacy-simulator.ts` exporting:
- `type NearbyOption { pharmacy, productName, brandType, address, distanceMi, priceUsd, stock }`
- `simulateNearbyOptions(ingredient: string, examples: string[], coords?: {lat,lng}): NearbyOption[]`

Implementation:
- Static list of chain pharmacies: Walgreens, CVS, Walmart Pharmacy, Rite Aid, Target Pharmacy, Costco Pharmacy, plus 1–2 independents.
- For each, pick a product variant from `examples` (brand) plus a store-brand generic for that ingredient (e.g. "CVS Health <ingredient>", "Walgreens <ingredient>", "Equate <ingredient>").
- Deterministic pseudo-random based on hash of `ingredient + pharmacy name` so results are stable across reopens:
  - distance: 0.2–4.8 mi
  - price: reasonable range per ingredient (brand higher than generic)
  - stock: weighted (~70% in stock, 20% low, 10% out)
  - address: pick from a small pool of plausible street names + numbers
- Returns ~8 entries, sorted (in-stock → distance).

No server function needed — pure client utility. Keeps it fast and free.

## Component changes

### New: `src/components/NearbyPharmaciesDialog.tsx`
- Props: `open`, `onOpenChange`, `ingredient`, `examples`.
- On open: call `navigator.geolocation.getCurrentPosition` once (best-effort), then call `simulateNearbyOptions`.
- Renders shadcn `Dialog` with `DialogContent` (max-h with overflow-y-auto), list of rows styled with the existing token system (`bg-card`, `border`, `text-navy`, badge styles consistent with success/warning/neutral used in CategoryCard).

### Modified: `CategoryCard` in `src/routes/symptom.tsx` and `src/routes/history.$id.tsx`
- Add `useState` for dialog open.
- For `green`/`yellow` cards, render a new `<button>` styled as a subtle link with `MapPin` icon: "Find {category_name} nearby" — placed next to or below the existing "Learn more — products & prices" button inside the expanded section.
- Render `<NearbyPharmaciesDialog>` controlled by that state.

(Both files duplicate `CategoryCard` today; update both. Optionally refactor into a shared component, but to keep the change minimal we'll just update both in-place.)

## Design tokens
Reuse existing tokens — no new colors:
- In-stock badge → `bg-success text-success-foreground`
- Low stock → `bg-warning text-warning-foreground`
- Out of stock → `bg-neutral text-neutral-foreground` + reduced opacity row
- Distance/price text → `text-muted-foreground` / `text-navy`

## Files
- **Create** `src/lib/pharmacy-simulator.ts`
- **Create** `src/components/NearbyPharmaciesDialog.tsx`
- **Edit** `src/routes/symptom.tsx` — add link + dialog inside `CategoryCard`
- **Edit** `src/routes/history.$id.tsx` — same change in its `CategoryCard`

## Out of scope
- Real pharmacy/inventory APIs
- Map view
- Reservations or "reserve at store" actions
- Persisting selected pharmacy to history
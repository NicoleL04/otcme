import type { NearbyOption } from "./pharmacy-simulator";

export type WishlistItem = NearbyOption & {
  ingredient: string;
  added_at: number;
};

const KEY = "otcandme_wishlist";

type Store = Record<string, WishlistItem[]>; // profile_id -> items

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("otcandme:wishlist-changed"));
  }
}

export function itemKey(ingredient: string, opt: NearbyOption): string {
  return `${ingredient}::${opt.id}::${opt.productName}`;
}

export function getWishlist(profileId: string): WishlistItem[] {
  return read()[profileId] || [];
}

export function isInWishlist(profileId: string, ingredient: string, opt: NearbyOption): boolean {
  const key = itemKey(ingredient, opt);
  return getWishlist(profileId).some((i) => itemKey(i.ingredient, i) === key);
}

export function addToWishlist(profileId: string, ingredient: string, opt: NearbyOption) {
  const store = read();
  const items = store[profileId] || [];
  const key = itemKey(ingredient, opt);
  if (items.some((i) => itemKey(i.ingredient, i) === key)) return;
  items.unshift({ ...opt, ingredient, added_at: Date.now() });
  store[profileId] = items;
  write(store);
}

export function removeFromWishlist(profileId: string, ingredient: string, opt: NearbyOption) {
  const store = read();
  const items = store[profileId] || [];
  const key = itemKey(ingredient, opt);
  store[profileId] = items.filter((i) => itemKey(i.ingredient, i) !== key);
  write(store);
}

export function toggleWishlist(profileId: string, ingredient: string, opt: NearbyOption): boolean {
  if (isInWishlist(profileId, ingredient, opt)) {
    removeFromWishlist(profileId, ingredient, opt);
    return false;
  }
  addToWishlist(profileId, ingredient, opt);
  return true;
}

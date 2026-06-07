export type StockLevel = "in" | "low" | "out";

export type NearbyOption = {
  id: string;
  pharmacy: string;
  productName: string;
  brandType: "brand" | "store-brand" | "generic";
  address: string;
  distanceMi: number;
  priceUsd: number;
  stock: StockLevel;
};

const CHAINS: Array<{ name: string; storeBrand: string }> = [
  { name: "Walgreens", storeBrand: "Walgreens" },
  { name: "CVS Pharmacy", storeBrand: "CVS Health" },
  { name: "Walmart Pharmacy", storeBrand: "Equate" },
  { name: "Rite Aid", storeBrand: "Rite Aid" },
  { name: "Target Pharmacy", storeBrand: "Up & Up" },
  { name: "Costco Pharmacy", storeBrand: "Kirkland Signature" },
  { name: "Safeway Pharmacy", storeBrand: "Signature Care" },
  { name: "Hartman's Family Pharmacy", storeBrand: "generic" },
];

const STREETS = [
  "Main St",
  "Oak Ave",
  "Maple Rd",
  "Cedar Blvd",
  "Elm St",
  "Park Ave",
  "Washington St",
  "Lincoln Way",
  "Sunset Blvd",
  "Market St",
  "Broadway",
  "Pine St",
];

// Deterministic hash → [0, 1)
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function rand(seed: string, min: number, max: number): number {
  return min + hash(seed) * (max - min);
}

function pick<T>(seed: string, arr: T[]): T {
  return arr[Math.floor(hash(seed) * arr.length) % arr.length];
}

function pickStock(seed: string): StockLevel {
  const r = hash(seed);
  if (r < 0.65) return "in";
  if (r < 0.88) return "low";
  return "out";
}

function priceFor(ingredient: string, isBrand: boolean): [number, number] {
  // Rough brand vs generic price band per common ingredient.
  const key = ingredient.toLowerCase();
  if (key.includes("ibuprofen")) return isBrand ? [8, 14] : [4, 8];
  if (key.includes("acetaminophen") || key.includes("paracetamol")) return isBrand ? [9, 15] : [4, 8];
  if (key.includes("naproxen")) return isBrand ? [10, 16] : [6, 10];
  if (key.includes("loratadine")) return isBrand ? [15, 25] : [7, 13];
  if (key.includes("cetirizine")) return isBrand ? [14, 22] : [6, 12];
  if (key.includes("diphenhydramine")) return isBrand ? [8, 13] : [4, 7];
  if (key.includes("pseudoephedrine") || key.includes("phenylephrine")) return isBrand ? [10, 16] : [5, 10];
  if (key.includes("famotidine") || key.includes("ranitidine")) return isBrand ? [12, 18] : [6, 11];
  if (key.includes("omeprazole")) return isBrand ? [18, 28] : [10, 16];
  if (key.includes("loperamide")) return isBrand ? [9, 14] : [4, 8];
  if (key.includes("guaifenesin") || key.includes("dextromethorphan")) return isBrand ? [10, 16] : [5, 10];
  if (key.includes("melatonin")) return isBrand ? [10, 16] : [5, 9];
  return isBrand ? [10, 18] : [5, 11];
}

function pickBrand(examples: string[], seed: string, ingredient: string): string | null {
  const candidates = examples
    .map((e) => e.trim())
    .filter((e) => e && !/^generic\b/i.test(e));
  if (!candidates.length) return null;
  return pick(seed, candidates) ?? null;
}

function storeBrandName(storeBrand: string, ingredient: string): string {
  if (storeBrand === "generic") return `Generic ${ingredient}`;
  return `${storeBrand} ${ingredient}`;
}

export function simulateNearbyOptions(
  ingredient: string,
  examples: string[] = [],
): NearbyOption[] {
  const options: NearbyOption[] = [];

  CHAINS.forEach((chain, idx) => {
    const seedBase = `${ingredient}::${chain.name}`;

    // 60% chance of carrying the brand variant
    const carriesBrand = hash(seedBase + "::brand-toggle") < 0.6;
    const brandPick = carriesBrand ? pickBrand(examples, seedBase + "::brand-pick", ingredient) : null;

    const variants: Array<{ name: string; type: NearbyOption["brandType"] }> = [];
    if (brandPick) variants.push({ name: brandPick, type: "brand" });
    variants.push({
      name: storeBrandName(chain.storeBrand, ingredient),
      type: chain.storeBrand === "generic" ? "generic" : "store-brand",
    });

    variants.forEach((v, vi) => {
      const seed = `${seedBase}::${v.name}::${vi}`;
      const [pmin, pmax] = priceFor(ingredient, v.type === "brand");
      const price = Math.round(rand(seed + "::price", pmin, pmax) * 100) / 100;
      const distance = Math.round(rand(seed + "::dist", 0.2, 4.8) * 10) / 10;
      const houseNum = 100 + Math.floor(hash(seed + "::num") * 8900);
      const street = pick(seed + "::street", STREETS);
      const stock = pickStock(seed + "::stock");

      options.push({
        id: `${chain.name}-${vi}-${idx}`,
        pharmacy: chain.name,
        productName: v.name,
        brandType: v.type,
        address: `${houseNum} ${street}`,
        distanceMi: distance,
        priceUsd: price,
        stock,
      });
    });
  });

  // Sort: in-stock and low-stock first (treat 'in' before 'low' before 'out'),
  // then by distance ascending.
  const stockRank: Record<StockLevel, number> = { in: 0, low: 1, out: 2 };
  options.sort((a, b) => {
    if (stockRank[a.stock] !== stockRank[b.stock]) return stockRank[a.stock] - stockRank[b.stock];
    return a.distanceMi - b.distanceMi;
  });

  return options;
}

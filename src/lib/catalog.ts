export type GiftTab = "crush" | "friends" | "food" | "premium";

export type GiftDef = {
  key: string;
  name: string;
  emoji: string;
  gems: number;
  tabs: GiftTab[];
  minAge: number;
  section: "romantic" | "treats" | "gestures";
  blurb: string;
};

export const GIFTS: GiftDef[] = [
  { key: "red-rose", name: "Red Rose", emoji: "🌹", gems: 75, tabs: ["crush"], minAge: 16, section: "romantic", blurb: "A classic hello" },
  { key: "love-letter", name: "Love Letter", emoji: "💌", gems: 50, tabs: ["crush"], minAge: 16, section: "romantic", blurb: "Say it sweetly" },
  { key: "heart-box", name: "Heart Box", emoji: "💝", gems: 120, tabs: ["crush", "premium"], minAge: 16, section: "romantic", blurb: "A little box of hearts" },
  { key: "teddy", name: "Teddy Bear", emoji: "🧸", gems: 150, tabs: ["crush", "premium"], minAge: 16, section: "romantic", blurb: "Soft and sincere" },
  { key: "chocolates", name: "Chocolates", emoji: "🍫", gems: 80, tabs: ["food", "friends"], minAge: 0, section: "treats", blurb: "Share a treat" },
  { key: "cupcake", name: "Cupcake", emoji: "🧁", gems: 45, tabs: ["food", "friends"], minAge: 0, section: "treats", blurb: "Sprinkles included" },
  { key: "strawberry", name: "Strawberry", emoji: "🍓", gems: 35, tabs: ["food"], minAge: 0, section: "treats", blurb: "Fresh and sweet" },
  { key: "ice-cream", name: "Ice Cream", emoji: "🍦", gems: 40, tabs: ["food"], minAge: 0, section: "treats", blurb: "A sunny-day scoop" },
  { key: "kiss", name: "Kiss", emoji: "💋", gems: 100, tabs: ["premium", "crush"], minAge: 16, section: "gestures", blurb: "A bold gesture for 16+" },
  { key: "high-five", name: "High Five", emoji: "🙌", gems: 30, tabs: ["friends"], minAge: 0, section: "gestures", blurb: "A cheerful high five" },
  { key: "hug", name: "Hug", emoji: "🤗", gems: 60, tabs: ["friends"], minAge: 0, section: "gestures", blurb: "Warm and simple" },
  { key: "wink", name: "Wink", emoji: "😉", gems: 25, tabs: ["friends"], minAge: 0, section: "gestures", blurb: "Playful and light" },
  { key: "crown", name: "Crown", emoji: "👑", gems: 200, tabs: ["premium"], minAge: 0, section: "gestures", blurb: "Main character energy" },
];

export function giftByKey(key: string): GiftDef | undefined {
  return GIFTS.find((gift) => gift.key === key);
}

export function giftsForAge(age: number, tab?: GiftTab): GiftDef[] {
  return GIFTS.filter((gift) => age >= gift.minAge && (!tab || gift.tabs.includes(tab)));
}

export const BOOSTS = [
  { tier: "basic", name: "Basic Boost", stars: 50, hours: 24, blurb: "24 hours of increased visibility", popular: false },
  { tier: "premium", name: "Premium Boost", stars: 100, hours: 24, blurb: "24 hours, a featured badge, and priority placement", popular: true },
  { tier: "super", name: "Super Boost", stars: 150, hours: 48, blurb: "48 hours plus the premium extras", popular: false },
] as const;

export type BoostTier = (typeof BOOSTS)[number]["tier"];

export function boostByTier(tier: string) {
  return BOOSTS.find((boost) => boost.tier === tier);
}

export const STORE_SKUS = [
  { sku: "gems-100", name: "100 gems", detail: "A small pouch of gems", gems: 100, stars: 0, amountCents: 99 },
  { sku: "gems-500", name: "500 gems", detail: "A bigger pouch of gems", gems: 500, stars: 0, amountCents: 399 },
  { sku: "stars-50", name: "50 stars", detail: "Enough for a Basic boost", gems: 0, stars: 50, amountCents: 99 },
  { sku: "stars-200", name: "200 stars", detail: "Enough for a Super boost", gems: 0, stars: 200, amountCents: 299 },
] as const;

export function skuById(sku: string) {
  return STORE_SKUS.find((item) => item.sku === sku);
}

export const AVATARS = ["🍋", "😊", "😎", "🌟", "🎧", "📚", "🎨", "⚽", "🌸", "🐻"];

export const LIVE_SCHOOL_COUNT = 5;

export function levelFor(points: number): number {
  return Math.max(1, Math.floor(points / 100) + 1);
}

export function formatGrade(grade: number): string {
  if (grade === 1) return "1st";
  if (grade === 2) return "2nd";
  if (grade === 3) return "3rd";
  return `${grade}th`;
}

export function lastFirst(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return `${last}, ${first}`;
}

import snacksImg from "@/assets/cat-snacks.jpg";
import beveragesImg from "@/assets/cat-beverages.jpg";
import iceCreamsImg from "@/assets/cat-ice-creams.jpg";
import mealsImg from "@/assets/cat-meals.jpg";
import essentialsImg from "@/assets/cat-essentials.jpg";

export const CATEGORIES = ["Snacks", "Cold Drinks", "Ice Creams"] as const;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUSES = [
  "Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

const categoryImages: Record<string, string> = {
  Snacks: snacksImg,
  "Cold Drinks": beveragesImg,
  "Ice Creams": iceCreamsImg,
  Beverages: beveragesImg,
  Meals: mealsImg,
  Essentials: essentialsImg,
};

export function itemImage(item: { image_url: string | null; category: string }) {
  return item.image_url && item.image_url.trim().length > 0
    ? item.image_url
    : (categoryImages[item.category] ?? snacksImg);
}

export function formatPrice(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `₹${n.toFixed(0)}`;
}

export function statusIndex(status: string) {
  const i = ORDER_STATUSES.indexOf(status as OrderStatus);
  return i < 0 ? 0 : i;
}

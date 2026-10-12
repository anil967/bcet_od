import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatPrice, itemImage } from "@/lib/quickbite";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

export function MenuCard({ item }: { item: MenuItem }) {
  const { add } = useCart();

  return (
    <article className="group voyage-panel overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/60">
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={itemImage(item)}
          alt={item.name}
          loading="lazy"
          width={944}
          height={704}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!item.is_available ? (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/70 text-xs font-bold uppercase tracking-wider text-background">
            Out of stock
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 border-t border-border p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-bold leading-snug sm:text-lg">{item.name}</h3>
          <span className="shrink-0 text-sm font-extrabold text-primary sm:text-base">{formatPrice(item.price)}</span>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{item.description}</p>
        <Button
          size="sm"
          className="mt-2 w-full font-semibold"
          disabled={!item.is_available}
          onClick={() => {
            add({ id: item.id, name: item.name, price: Number(item.price) });
            toast.success(`${item.name} added to cart`);
          }}
        >
          <Plus className="size-4" /> Add to cart
        </Button>
      </div>
    </article>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Clock } from "lucide-react";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/quickbite/SiteHeader";
import { MenuCard, type MenuItem } from "@/components/quickbite/MenuCard";
import { CartPanel } from "@/components/quickbite/CartPanel";
import { CATEGORIES } from "@/lib/quickbite";
import heroImage from "@/assets/odyssey-hero.jpg";
import logoImg from "@/assets/odyssey-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OdysseyBite — Order food to your table" },
      {
        name: "description",
        content:
          "Browse meals, snacks, beverages and late-night essentials and get them delivered to your hackathon table. No sign-up needed.",
      },
      { property: "og:title", content: "OdysseyBite — Order food to your table" },
      {
        property: "og:description",
        content: "Meals, snacks and coffee delivered to your seat at the hackathon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Menu,
});

function Menu() {
  const [cartOpen, setCartOpen] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const list = await api.menu.list();
      return list as MenuItem[];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader onOpenCart={() => setCartOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <img
          src={heroImage || "/food/hero.jpg"}
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          className="absolute inset-0 size-full object-cover object-[64%_center]"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes("/images/odyssey-hero.jpg")) {
              target.src = "/images/odyssey-hero.jpg";
            } else {
              target.style.display = "none";
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

        <div className="relative mx-auto flex max-w-6xl items-center px-4 py-12 sm:py-20">
          <div className="max-w-2xl">
            <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              HackOdyssey Provisions
            </p>
            <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-tight tracking-wide text-foreground sm:text-5xl lg:text-6xl">
              Fuel your <span className="text-primary">odyssey.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Keep building while provisions journey to your table. No accounts, no detours—just choose your fare and continue the quest.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setCartOpen(true)}>
                <ShoppingBag className="size-4" /> Open provisions
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full bg-background/40 backdrop-blur-sm sm:w-auto">
                <Link to="/track">
                  <Clock className="size-4" /> Track my order
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Bar */}
      <div className="sticky top-16 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md px-3 py-2.5 sm:px-4">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={`#cat-${cat}`}
              className="flex items-center justify-center rounded-full border border-border/80 bg-secondary/50 px-2.5 py-2 text-center text-xs font-bold text-muted-foreground transition-all duration-200 hover:border-primary/80 hover:bg-primary/15 hover:text-primary active:scale-95 sm:px-4 sm:py-2 sm:text-sm shadow-xs"
            >
              <span className="truncate">{cat}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Menu Categories */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {CATEGORIES.map((category) => {
              const list = (items ?? []).filter((i) => i.category === category);
              if (list.length === 0) return null;
              return (
                <section key={category} id={`cat-${category}`} className="scroll-mt-32">
                  <div className="mb-4 flex items-end justify-between border-b border-border pb-2.5">
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide text-primary sm:text-2xl">
                      {category}
                    </h2>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {list.length} item{list.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item) => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Clean Footer (No staff login) */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground sm:text-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <img
              src={logoImg || "/food/logo.png"}
              alt=""
              aria-hidden="true"
              className="size-6 rounded-full object-cover ring-1 ring-primary/40 bg-secondary"
              width={24}
              height={24}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes("/images/odyssey-cafe-logo.png")) return;
                target.src = "/images/odyssey-cafe-logo.png";
              }}
            />
            <p className="font-display font-semibold uppercase tracking-wider text-foreground">OdysseyBite</p>
          </div>
          <p className="text-muted-foreground">Provisions delivered directly to your hackathon table.</p>
        </div>
      </footer>

      <CartPanel open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

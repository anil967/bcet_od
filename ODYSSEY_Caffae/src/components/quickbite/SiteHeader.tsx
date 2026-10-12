import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import logoImg from "@/assets/odyssey-logo.png";

export function SiteHeader({
  onOpenCart,
  showMenuBack,
}: {
  onOpenCart?: () => void;
  showMenuBack?: boolean;
}) {
  const { count } = useCart();
  const router = useRouter();
  const isBackToMenu = showMenuBack ?? router.state.location.pathname.startsWith("/track");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-3 sm:px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <img
            src={logoImg || "/food/logo.png"}
            alt=""
            aria-hidden="true"
            className="size-9 rounded-full object-cover shadow-sm ring-1 ring-primary/40 bg-secondary"
            width={36}
            height={36}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.includes("/images/odyssey-cafe-logo.png")) return;
              target.src = "/images/odyssey-cafe-logo.png";
            }}
          />
          <div className="flex flex-col">
            <span className="font-display text-base font-bold uppercase tracking-wider text-primary sm:text-lg">
              OdysseyBite
            </span>
          </div>
        </Link>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 text-xs font-semibold uppercase sm:flex">
            <a
              href="/"
              className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Odyssey Map</span>
            </a>
            <Link
              to="/"
              className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "rounded-sm px-3 py-2 bg-secondary text-primary" }}
              activeOptions={{ exact: true }}
            >
              Menu
            </Link>
            <Link
              to="/track"
              className="rounded-sm px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              activeProps={{ className: "rounded-sm px-3 py-2 bg-secondary text-primary" }}
            >
              Track order
            </Link>
          </nav>

          {/* Mobile Quick Link: If on track page, show Menu (back to menu), otherwise show Track */}
          {isBackToMenu ? (
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 sm:hidden"
            >
              <ArrowLeft className="size-3.5" />
              <span>Menu</span>
            </Link>
          ) : (
            <Link
              to="/track"
              className="flex items-center gap-1 rounded-md border border-border/60 bg-secondary/50 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:hidden"
              activeProps={{ className: "border-primary/40 text-primary bg-primary/10" }}
            >
              <Clock className="size-3.5" />
              <span>Track</span>
            </Link>
          )}

          {/* Cart Button */}
          {onOpenCart ? (
            <Button
              onClick={onOpenCart}
              size="sm"
              className="relative h-9 gap-1.5 px-3 text-xs font-bold uppercase shadow-sm sm:h-9 sm:px-4 sm:text-sm"
            >
              <ShoppingBag className="size-4" />
              <span className="hidden xs:inline sm:inline">Cart</span>
              {count > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow-xs">
                  {count}
                </span>
              ) : null}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/quickbite/SiteHeader";
import { ORDER_STATUSES, formatPrice, statusIndex } from "@/lib/quickbite";

const searchSchema = z.object({ code: z.coerce.string().optional() });

export const Route = createFileRoute("/track")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Track my order — OdysseyBite" },
      {
        name: "description",
        content:
          "Check your OdysseyBite order status with your order ID or your name and table number.",
      },
      { property: "og:title", content: "Track my order — OdysseyBite" },
      {
        property: "og:description",
        content: "Placed, preparing, out for delivery or delivered — see where your food is.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrackPage,
});

type TrackedOrder = {
  id: string;
  code: string;
  customer_name: string;
  table_number: string;
  status: string;
  total: number;
  delivery_charge: number;
  transaction_id?: string | null;
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

function TrackPage() {
  const { code: initialCode } = Route.useSearch();
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [searchTab, setSearchTab] = useState<"code" | "details">("code");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const lookup = async (by: "code" | "details") => {
    setLoading(true);
    setMessage(null);
    try {
      const data =
        by === "code"
          ? await api.orders.getByCode(code.trim().toUpperCase())
          : await api.orders.getByCustomerAndTable(name.trim(), table.trim());

      setOrders(data as TrackedOrder[]);
      if (!data || data.length === 0) {
        setMessage("No order found with those details.");
        toast.error("No order found");
      } else {
        toast.success(`Found ${data.length} order${data.length > 1 ? "s" : ""}`);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
      toast.error("Could not fetch order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) void lookup("code");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader showMenuBack />
      <main className="mx-auto max-w-3xl px-3.5 py-6 sm:px-4 sm:py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Live status</p>
        <h1 className="mt-1 font-display text-2xl font-bold uppercase sm:text-4xl">Track my order</h1>
        <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
          Use your 6-character order ID, or your name and table number.
        </p>

        {/* Search Mode Toggle Tabs */}
        <div className="mt-5 flex items-center justify-center">
          <div className="grid w-full max-w-md grid-cols-2 gap-1 rounded-lg border border-border/80 bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setSearchTab("code")}
              className={`rounded-md py-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                searchTab === "code"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              By Order ID
            </button>
            <button
              type="button"
              onClick={() => setSearchTab("details")}
              className={`rounded-md py-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                searchTab === "details"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              By Name &amp; Table
            </button>
          </div>
        </div>

        <div className="mt-4 max-w-md mx-auto">
          {/* By Order ID */}
          {searchTab === "code" ? (
            <form
              className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
              onSubmit={(e) => {
                e.preventDefault();
                void lookup("code");
              }}
            >
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Enter Order ID</h2>
              <div className="mt-3 grid gap-1.5">
                <Label htmlFor="code" className="text-xs">Order ID (6 characters)</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. N889ST"
                  className="h-10 uppercase tracking-widest font-mono font-bold text-base"
                  autoFocus
                />
              </div>
              <Button
                className="mt-4 w-full font-bold h-10 shadow-sm"
                type="submit"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Finding order…
                  </>
                ) : (
                  <>
                    <Search className="size-4 mr-2" /> Find order
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* By Name & Table */
            <form
              className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
              onSubmit={(e) => {
                e.preventDefault();
                void lookup("details");
              }}
            >
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-primary">Search by Details</h2>
              <div className="mt-3 grid gap-2.5">
                <div className="grid gap-1">
                  <Label htmlFor="t-name" className="text-xs">Full name</Label>
                  <Input
                    id="t-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="h-9"
                    autoFocus
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="t-table" className="text-xs">Table number</Label>
                  <Input
                    id="t-table"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="e.g. 12 or B04"
                    className="h-9"
                  />
                </div>
              </div>
              <Button
                className="mt-4 w-full font-bold h-10 shadow-sm"
                type="submit"
                disabled={loading || !name.trim() || !table.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Finding orders…
                  </>
                ) : (
                  <>
                    <Search className="size-4 mr-2" /> Find orders
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Results anchor */}
        <div ref={resultsRef} className="scroll-mt-24">
          {message ? (
            <div className="mt-6 rounded-md border border-border bg-secondary/30 p-4 text-center text-xs sm:text-sm text-muted-foreground">
              {message}
            </div>
          ) : null}

          {orders && orders.length > 0 ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Order Result</h3>
                <span className="text-xs text-muted-foreground">{orders.length} order found</span>
              </div>
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const current = statusIndex(order.status);

  return (
    <article className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-muted-foreground">Order ID</p>
          <p className="font-display text-xl font-extrabold tracking-widest text-primary sm:text-2xl">{order.code}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {order.customer_name} · Table {order.table_number}
          </p>
          {order.transaction_id ? (
            <p className="text-[10px] font-mono text-primary mt-0.5">
              Txn: {order.transaction_id}
            </p>
          ) : null}
          <p className="text-[11px] mt-0.5">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Responsive Progress Stepper (2 columns on mobile, 4 on desktop) */}
      <ol className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        {ORDER_STATUSES.map((status, i) => (
          <li
            key={status}
            className={`rounded-sm border px-2 py-1.5 text-center text-xs font-semibold ${
              i <= current
                ? "border-transparent bg-primary text-primary-foreground font-bold shadow-xs"
                : "border-border bg-secondary/40 text-muted-foreground"
            }`}
          >
            {status}
          </li>
        ))}
      </ol>

      <ul className="mt-4 divide-y divide-border text-xs sm:text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between py-1.5">
            <span>
              {item.item_name} × {item.quantity}
            </span>
            <span className="font-semibold text-muted-foreground">
              {formatPrice(Number(item.unit_price) * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-border pt-2.5 text-sm font-bold">
        <span>Total</span>
        <span className="text-base text-primary font-extrabold">{formatPrice(order.total)}</span>
      </div>
    </article>
  );
}

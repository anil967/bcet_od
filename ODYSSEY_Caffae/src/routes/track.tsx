import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
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
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

function TrackPage() {
  const { code: initialCode } = Route.useSearch();
  const [code, setCode] = useState(initialCode ?? "");
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const lookup = async (by: "code" | "details") => {
    setLoading(true);
    setMessage(null);
    try {
      const data =
        by === "code"
          ? await api.orders.getByCode(code.trim().toUpperCase())
          : await api.orders.getByCustomerAndTable(name.trim(), table.trim());

      setOrders(data as TrackedOrder[]);
      if (!data || data.length === 0) setMessage("No order found with those details.");
    } catch {
      setMessage("Something went wrong. Please try again.");
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* By Order ID */}
          <form
            className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup("code");
            }}
          >
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">By order ID</h2>
            <div className="mt-3 grid gap-1.5">
              <Label htmlFor="code" className="text-xs">Order ID</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CF8DH2"
                className="h-9 uppercase tracking-widest font-mono"
              />
            </div>
            <Button className="mt-3.5 w-full font-semibold" size="sm" type="submit" disabled={loading || !code.trim()}>
              <Search className="size-3.5" /> Find order
            </Button>
          </form>

          {/* By Name & Table */}
          <form
            className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
            onSubmit={(e) => {
              e.preventDefault();
              void lookup("details");
            }}
          >
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">By name &amp; table</h2>
            <div className="mt-3 grid gap-2.5">
              <div className="grid gap-1">
                <Label htmlFor="t-name" className="text-xs">Full name</Label>
                <Input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="h-9"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="t-table" className="text-xs">Table number</Label>
                <Input
                  id="t-table"
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  placeholder="e.g. 12"
                  className="h-9"
                />
              </div>
            </div>
            <Button
              className="mt-3.5 w-full font-semibold"
              size="sm"
              type="submit"
              disabled={loading || !name.trim() || !table.trim()}
            >
              <Search className="size-3.5" /> Find orders
            </Button>
          </form>
        </div>

        {message ? (
          <div className="mt-6 rounded-md border border-border bg-secondary/30 p-4 text-center text-xs sm:text-sm text-muted-foreground">
            {message}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {(orders ?? []).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
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

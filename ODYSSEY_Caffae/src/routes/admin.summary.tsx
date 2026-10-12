import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/quickbite";

export const Route = createFileRoute("/admin/summary")({
  head: () => ({
    meta: [
      { title: "Sales summary — OdysseyBite Admin" },
      { name: "description", content: "Review OdysseyBite venue sales and popular items." },
      { property: "og:title", content: "Sales summary — OdysseyBite Admin" },
      { property: "og:description", content: "Review OdysseyBite venue sales and popular items." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminSummary,
});

function AdminSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-summary"],
    queryFn: async () => {
      return await api.summary.get();
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Sales summary</h1>
        <p className="text-sm text-muted-foreground">Everything ordered at the venue so far.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Total orders" value={String(data.totalOrders)} />
        <Stat label="Delivered" value={String(data.delivered)} />
        <Stat label="Total revenue" value={formatPrice(data.revenue)} />
        <Stat label="Average order" value={formatPrice(data.averageOrder)} />
      </div>

      <section className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-bold">Most ordered items</h2>
        {data.top.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No items ordered yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.top.map(([name, qty]) => {
              const max = data.top[0]?.[1] ?? 1;
              return (
                <li key={name}>
                  <div className="flex justify-between text-xs sm:text-sm font-medium">
                    <span>{name}</span>
                    <span className="text-muted-foreground">{qty} sold</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.round((qty / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="voyage-panel rounded-md border border-border bg-card p-3.5 sm:p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

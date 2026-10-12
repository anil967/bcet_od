import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api, type Order } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_STATUSES, formatPrice, statusIndex, type OrderStatus } from "@/lib/quickbite";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Live orders — OdysseyBite Admin" },
      { name: "description", content: "Manage live OdysseyBite venue orders." },
      { property: "og:title", content: "Live orders — OdysseyBite Admin" },
      { property: "og:description", content: "Manage live OdysseyBite venue orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOrders,
});

type AdminOrder = Order;

function AdminOrders() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const data = await api.orders.list();
      return data as AdminOrder[];
    },
    refetchInterval: 5000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      await api.orders.updateStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Could not update that order."),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      await api.orders.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order deleted");
    },
    onError: () => toast.error("Could not delete that order."),
  });

  const active = (orders ?? []).filter((o) => o.status !== "Delivered");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Live orders</h1>
        <p className="text-sm text-muted-foreground">
          {active.length} in progress · updates in real time
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (orders ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No orders yet. They'll appear here the moment someone checks out.
        </p>
      ) : (
        <div className="grid gap-4">
          {(orders ?? []).map((order) => (
            <article
              key={order.id}
              className="voyage-panel rounded-md border border-border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg sm:text-xl font-extrabold tracking-widest text-primary">
                    {order.code}
                  </p>
                  <p className="text-sm font-semibold">
                    {order.customer_name} · Table {order.table_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-left sm:text-right">
                    <p className="text-base sm:text-lg font-bold text-primary">{formatPrice(order.total)}</p>
                    {order.payment_method ? (
                      <p className="text-xs font-semibold text-primary">
                        {order.payment_method === "qr" ? "Paid via QR" : "Paid"}
                      </p>
                    ) : null}
                    <span className="inline-block mt-0.5 rounded-sm bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {order.status}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => {
                      if (confirm(`Delete order ${order.code}?`)) deleteOrder.mutate(order.id);
                    }}
                    aria-label={`Delete order ${order.code}`}
                    title="Delete order from database"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <ul className="mt-4 flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="rounded-md bg-muted px-2.5 py-1">
                    {item.item_name} × {item.quantity}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                {ORDER_STATUSES.map((status) => {
                  const isCurrent = order.status === status;
                  const isDone = statusIndex(order.status) > statusIndex(status);
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={isCurrent ? "default" : isDone ? "secondary" : "outline"}
                      disabled={isCurrent || updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status })}
                      className="h-8 text-xs font-semibold"
                    >
                      {status}
                    </Button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

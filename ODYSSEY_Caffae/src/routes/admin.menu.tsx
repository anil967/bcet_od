import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, formatPrice, itemImage, type Category } from "@/lib/quickbite";
import { PAYMENT_ENABLED_KEY, paymentEnabledQuery } from "@/lib/settings";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({
    meta: [
      { title: "Menu management — OdysseyBite Admin" },
      { name: "description", content: "Manage OdysseyBite food, drink and essentials availability." },
      { property: "og:title", content: "Menu management — OdysseyBite Admin" },
      { property: "og:description", content: "Manage OdysseyBite menu availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminMenu,
});

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: Category;
  image_url: string;
  is_available: boolean;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  category: "Meals",
  image_url: "",
  is_available: true,
};

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select a valid image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        resolve(compressed);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function AdminMenu() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const data = await api.menu.list();
      return (data as MenuItem[]).sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });
    },
  });



  const { data: paymentEnabledData } = useQuery(paymentEnabledQuery);
  const paymentEnabled = paymentEnabledData ?? true;
  const togglePayment = useMutation({
    mutationFn: async (on: boolean) => {
      await api.settings.set(PAYMENT_ENABLED_KEY, on);
    },
    onSuccess: (_d, on) => {
      toast.success(on ? "Payment step turned on" : "Payment step turned off");
      void queryClient.invalidateQueries({ queryKey: paymentEnabledQuery.queryKey });
    },
    onError: () => toast.error("Could not update the payment setting."),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-menu"] });
    void queryClient.invalidateQueries({ queryKey: ["menu"] });
  };

  const save = useMutation({
    mutationFn: async (value: Draft) => {
      const payload = {
        id: value.id,
        name: value.name.trim(),
        description: value.description.trim(),
        price: Number(value.price),
        category: value.category,
        image_url: value.image_url.trim() === "" ? null : value.image_url.trim(),
        is_available: value.is_available,
      };
      await api.menu.save(payload);
    },
    onSuccess: () => {
      toast.success("Menu saved");
      setDraft(null);
      invalidate();
    },
    onError: () => toast.error("Could not save that item."),
  });

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      await api.menu.toggleAvailability(id, is_available);
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not update availability."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.menu.delete(id);
    },
    onSuccess: () => {
      toast.success("Item deleted");
      invalidate();
    },
    onError: () => toast.error("Could not delete that item."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Menu management</h1>
          <p className="text-sm text-muted-foreground">
            Add items, adjust prices and mark things out of stock.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="size-4" /> New item
        </Button>
      </div>



      <div className="voyage-panel flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/50 bg-card p-5">
        <div>
          <h2 className="text-lg font-bold">QR Payment before ordering</h2>
          <p className="text-sm text-muted-foreground">
            {paymentEnabled
              ? "On — customers must scan and pay via QR before placing an order."
              : "Off — customers place orders without a payment step."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="payment-enabled"
            checked={paymentEnabled}
            disabled={togglePayment.isPending}
            onCheckedChange={(checked) => togglePayment.mutate(checked)}
          />
          <Label htmlFor="payment-enabled">{paymentEnabled ? "On" : "Off"}</Label>
        </div>
      </div>

      {draft ? (
        <form
           className="voyage-panel rounded-sm border border-border bg-card p-5 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{draft.id ? "Edit item" : "New item"}</h2>
            <Button type="button" size="icon" variant="ghost" onClick={() => setDraft(null)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input
                id="m-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-price">Price (₹)</Label>
              <Input
                id="m-price"
                type="number"
                min="0"
                step="1"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-category">Category</Label>
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value as Category })}
              >
                <SelectTrigger id="m-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Item Image (Upload from device or paste link)</Label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <label
                  htmlFor="m-image-file"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border/80 rounded-md cursor-pointer bg-secondary/50 hover:bg-secondary text-foreground transition-colors shrink-0"
                >
                  <Upload className="size-4 text-primary" />
                  <span>Upload Image File</span>
                  <input
                    id="m-image-file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const base64 = await processImageFile(file);
                        setDraft({ ...draft, image_url: base64 });
                        toast.success("Image selected");
                      } catch (err: unknown) {
                        toast.error(err instanceof Error ? err.message : "Failed to load image");
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <Input
                    id="m-image"
                    value={draft.image_url.startsWith("data:") ? "" : draft.image_url}
                    onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    placeholder="or paste image URL (https://…)"
                  />
                </div>
              </div>

              {draft.image_url && draft.image_url.trim().length > 0 && (
                <div className="mt-2 flex items-center gap-3 p-2.5 rounded-lg border border-border/70 bg-secondary/20">
                  <img
                    src={draft.image_url}
                    alt="Preview"
                    className="w-14 h-14 rounded-md object-cover border border-border/50 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Selected Image</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {draft.image_url.startsWith("data:")
                        ? "Uploaded image from device (ready to save)"
                        : draft.image_url}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 text-xs h-8 shrink-0"
                    onClick={() => setDraft({ ...draft, image_url: "" })}
                  >
                    <X className="size-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="m-desc">Short description</Label>
              <Textarea
                id="m-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="m-available"
                checked={draft.is_available}
                onCheckedChange={(checked) => setDraft({ ...draft, is_available: checked })}
              />
              <Label htmlFor="m-available">Available</Label>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save item"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <article
              key={item.id}
              className="voyage-panel overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-card)]"
            >
              <img
                src={itemImage(item)}
                alt={item.name}
                loading="lazy"
                width={944}
                height={704}
                className="aspect-[16/10] sm:aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-2 p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold leading-tight">{item.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={(checked) =>
                        toggleAvailability.mutate({ id: item.id, is_available: checked })
                      }
                      aria-label={`Toggle availability for ${item.name}`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.is_available ? "Available" : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${item.name}`}
                      onClick={() =>
                        setDraft({
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          price: String(Number(item.price)),
                          category: item.category as Category,
                          image_url: item.image_url ?? "",
                          is_available: item.is_available,
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => {
                        if (confirm(`Delete ${item.name}?`)) remove.mutate(item.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

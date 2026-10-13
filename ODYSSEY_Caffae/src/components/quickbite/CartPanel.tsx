import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Minus, Plus, CheckCircle2, Trash2, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/quickbite";
import { usePaymentEnabled } from "@/lib/settings";
import paymentQrImg from "@/assets/payment-qr.png";

export function CartPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { lines, setQuantity, remove, total, clear } = useCart();
  const [name, setName] = useState("");
  const [table, setTable] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [placed, setPlaced] = useState<{ code: string } | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);

  const paymentEnabled = usePaymentEnabled();
  const grandTotal = total;

  const handleTxnChange = (val: string) => {
    // Strictly only receive digits (0-9) and max 12 digits
    const cleanDigits = val.replace(/\D/g, "").slice(0, 12);
    setTransactionId(cleanDigits);
  };

  const handleTxnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Enter" ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Block any non-digit character
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const isTxnValid = !paymentEnabled
    ? transactionId.length === 0 || transactionId.length === 12
    : transactionId.length === 12;

  const paymentReady = !paymentEnabled || (paidConfirmed && isTxnValid);
  const canSubmit =
    lines.length > 0 &&
    paymentReady &&
    name.trim().length > 1 &&
    table.trim().length > 0 &&
    isTxnValid;

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (paymentEnabled && transactionId.trim().length !== 12) {
        throw new Error("Please enter a valid 12-digit UPI Transaction ID.");
      }
      if (transactionId.trim().length > 0 && transactionId.trim().length !== 12) {
        throw new Error("Transaction ID must be exactly 12 digits.");
      }

      const order = await api.orders.create({
        customer_name: name.trim(),
        table_number: table.trim(),
        transaction_id: transactionId.trim() || null,
        total: grandTotal,
        delivery_charge: 0,
        payment_method: paymentEnabled ? "qr" : null,
        items: lines.map((l) => ({
          menu_item_id: l.id,
          item_name: l.name,
          unit_price: l.price,
          quantity: l.quantity,
        })),
      });
      return order;
    },
    onSuccess: (order) => {
      setPlaced({ code: order.code });
      setPaidConfirmed(false);
      setTransactionId("");
      clear();
    },
    onError: (err: Error) => toast.error(err.message || "Could not place the order. Please try again."),
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setPlaced(null);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="font-display uppercase tracking-wide">
            {placed ? "Order confirmed" : "Your cart"}
          </SheetTitle>
        </SheetHeader>

        {placed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <CheckCircle2 className="size-16 text-success animate-in zoom-in-75 duration-300" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your order ID</p>
              <p className="font-display text-4xl font-extrabold tracking-widest text-primary">{placed.code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Status is <strong>Placed</strong>. Save this ID to track your order.
            </p>
            <div className="mt-4 flex w-full flex-col gap-2">
              <Button asChild size="lg" className="w-full">
                <Link to="/track" search={{ code: placed.code }}>
                  Track this order
                </Link>
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Keep browsing
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {lines.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <p>Your cart is empty.</p>
                  <p className="mt-1 text-xs text-muted-foreground/75">Add your favorite items from the menu.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {lines.map((line) => (
                    <li key={line.id} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(line.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/30 p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setQuantity(line.id, line.quantity - 1)}
                          aria-label={`Decrease ${line.name}`}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-xs font-bold">{line.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => setQuantity(line.id, line.quantity + 1)}
                          aria-label={`Increase ${line.name}`}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(line.id)}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Bottom Checkout Section */}
            <div className="max-h-[60vh] space-y-3.5 overflow-y-auto border-t border-border bg-card/50 p-4">
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-lg font-extrabold text-primary">{formatPrice(grandTotal)}</span>
              </div>

              <div className="grid gap-2.5">
                <div className="grid gap-1">
                  <Label htmlFor="cart-name" className="text-xs">Full name</Label>
                  <Input
                    id="cart-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    autoComplete="name"
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="cart-table" className="text-xs">Table number</Label>
                  <Input
                    id="cart-table"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="e.g. Table 12 or B04"
                    className="h-9"
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="cart-txn" className="text-xs flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Transaction ID / UTR {paymentEnabled ? <span className="text-primary">*</span> : null}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                        transactionId.length === 12
                          ? "bg-emerald-500/20 text-emerald-400"
                          : transactionId.length > 0
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {transactionId.length}/12 digits
                    </span>
                  </Label>
                  <Input
                    id="cart-txn"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    autoComplete="off"
                    value={transactionId}
                    onChange={(e) => handleTxnChange(e.target.value)}
                    onKeyDown={handleTxnKeyDown}
                    placeholder="Enter 12-digit UPI UTR (numbers only)"
                    className={`h-9 font-mono text-xs tracking-wider transition-colors ${
                      transactionId.length === 12
                        ? "border-emerald-500 focus-visible:ring-emerald-500"
                        : transactionId.length > 0
                        ? "border-amber-500 focus-visible:ring-amber-500"
                        : ""
                    }`}
                  />
                  <div className="text-[11px] leading-tight">
                    {transactionId.length === 12 ? (
                      <span className="text-emerald-500 font-medium">✓ 12-digit Transaction ID confirmed</span>
                    ) : transactionId.length > 0 ? (
                      <span className="text-amber-500 font-medium">
                        Must be exactly 12 digits ({12 - transactionId.length} remaining)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Only 12 numeric digits allowed</span>
                    )}
                  </div>
                </div>
              </div>

              {paymentEnabled && lines.length > 0 ? (
                <div className="grid gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <QrCode className="size-3.5 text-primary" /> Pay via QR
                    </Label>
                    <span className="text-[11px] font-bold text-primary">UPI / Online</span>
                  </div>

                  <div className="grid gap-2.5 rounded-sm border border-border bg-card p-3 text-center">
                    <p className="text-xs">
                      Scan and pay <strong className="text-primary font-bold">{formatPrice(grandTotal)}</strong>
                    </p>
                    <div className="mx-auto w-44 rounded-md border border-border/80 bg-white p-2 shadow-xs">
                      <img
                        src={paymentQrImg}
                        alt="Payment QR code — Anshuman Nayak"
                        className="mx-auto w-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-foreground">Anshuman Nayak</p>
                      <p className="text-[11px] text-muted-foreground font-mono select-all">UPI ID: 9040799416@okbizaxis</p>
                    </div>
                    <label className="flex items-center justify-center gap-2 text-xs font-medium cursor-pointer text-foreground hover:text-primary transition-colors pt-1">
                      <Checkbox
                        checked={paidConfirmed}
                        onCheckedChange={(v) => setPaidConfirmed(v === true)}
                      />
                      <span>I have scanned &amp; paid {formatPrice(grandTotal)}</span>
                    </label>
                  </div>
                </div>
              ) : null}

              <Button
                className="w-full font-bold shadow-md"
                size="lg"
                disabled={!canSubmit || placeOrder.isPending}
                onClick={() => {
                  if (paymentEnabled && transactionId.length !== 12) {
                    toast.error("Please enter the 12-digit UPI Transaction ID.");
                    return;
                  }
                  if (transactionId.length > 0 && transactionId.length !== 12) {
                    toast.error("Transaction ID must be exactly 12 digits.");
                    return;
                  }
                  placeOrder.mutate();
                }}
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Placing order…
                  </>
                ) : paymentEnabled && transactionId.length !== 12 ? (
                  `Enter 12-digit Txn ID (${transactionId.length}/12)`
                ) : (
                  `Place order · ${formatPrice(grandTotal)}`
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

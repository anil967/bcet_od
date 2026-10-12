import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import logoImg from "@/assets/odyssey-logo.png";
import { api, type UserSession } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff dashboard — OdysseyBite" },
      {
        name: "description",
        content: "OdysseyBite venue staff area: live orders, menu management and sales summary.",
      },
      { property: "og:title", content: "Staff dashboard — OdysseyBite" },
      { property: "og:description", content: "Manage OdysseyBite orders and the menu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = api.auth.onAuthStateChange((next) => {
      setSession(next);
      setReady(true);
    });
    return unsub;
  }, []);

  if (!ready) {
    return <CenteredNote title="Loading…" body="Checking your staff session." />;
  }

  if (!session) return <AdminLogin />;

  const isAdmin = session.user.role === "admin";

  if (!isAdmin) {
    return (
      <CenteredNote
        title="No staff access"
        body="This account is signed in but is not an OdysseyBite admin. Ask the venue owner to grant access, or sign out and use the admin account."
        action={
          <Button
            variant="outline"
            onClick={() => {
              api.auth.logout();
            }}
          >
            Sign out
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:px-4 sm:py-0">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="OdysseyBite logo"
              className="size-8 rounded-full object-cover shadow-sm ring-1 ring-primary/40 sm:size-9"
              width={36}
              height={36}
            />
            <div>
              <p className="font-display text-base font-bold uppercase leading-none text-primary sm:text-lg">OdysseyBite</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">Admin dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex items-center gap-1 font-medium">
              <AdminTab to="/admin" label="Orders" exact />
              <AdminTab to="/admin/menu" label="Menu" />
              <AdminTab to="/admin/summary" label="Sales" />
            </nav>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2 text-xs sm:px-3 sm:text-sm"
              onClick={() => {
                api.auth.logout();
                toast.success("Signed out");
              }}
            >
              <LogOut className="size-3.5 sm:size-4" />
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function AdminTab({
  to,
  label,
  exact = false,
}: {
  to: "/admin" | "/admin/menu" | "/admin/summary";
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3 sm:py-2 sm:text-sm"
      activeProps={{ className: "rounded-md px-2.5 py-1.5 sm:px-3 sm:py-2 bg-secondary text-foreground font-semibold" }}
      activeOptions={{ exact }}
    >
      {label}
    </Link>
  );
}

function CenteredNote({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        {action}
      </div>
    </div>
  );
}

function AdminLogin() {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.auth.login(staffId, password);
      toast.success("Welcome back");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Wrong admin ID or password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <form
        onSubmit={submit}
        className="voyage-panel w-full max-w-sm rounded-md border border-border bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]"
      >
        <img
          src={logoImg}
          alt="OdysseyBite crest"
          className="mb-4 size-14 rounded-full object-cover shadow-md ring-2 ring-primary/50"
          width={56}
          height={56}
        />
        <h1 className="text-2xl font-extrabold">Admin login</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Sign in with your admin ID and password to manage orders and menu.
        </p>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="staffId">Admin ID</Label>
            <Input
              id="staffId"
              inputMode="text"
              autoComplete="username"
              placeholder="8637205752"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="mt-5 w-full" size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <div className="mt-3 rounded border border-border/50 bg-secondary/30 p-2.5 text-center text-xs text-muted-foreground">
          Admin ID: <span className="font-semibold text-foreground">8637205752</span> · Password: <span className="font-semibold text-foreground">admin</span>
        </div>
        <Link to="/" className="mt-4 block text-center text-xs sm:text-sm text-muted-foreground underline">
          Back to menu
        </Link>
      </form>
    </div>
  );
}

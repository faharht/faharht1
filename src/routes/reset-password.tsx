import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Reset password — RussianFlow" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase redirects with a recovery token in the hash; the SDK exchanges
    // it for a session automatically. Confirm we have one before allowing
    // the new password to be set.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/profile" }), 1500);
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)]">
      <main className="mx-auto max-w-md px-4 pt-6">
        <Link to="/auth" search={{ mode: "signin" }} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h1 className="text-lg font-semibold">Set a new password</h1>
          {!ready ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Open this page from the reset email link to continue.
            </p>
          ) : done ? (
            <p className="mt-2 text-sm text-emerald-700">Password updated. Redirecting…</p>
          ) : (
            <form onSubmit={submit} className="mt-3 space-y-3">
              <input
                type="password"
                required
                minLength={8}
                placeholder="New password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

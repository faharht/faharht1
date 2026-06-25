import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode; redirectTo?: string } => ({
    mode: s.mode === "signup" ? "signup" : "signin",
    redirectTo: typeof s.redirectTo === "string" && s.redirectTo.startsWith("/") ? s.redirectTo : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — RussianFlow" },
      {
        name: "description",
        content: "Sign in or create an account to save your Russian practice progress.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const { mode, redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent">("idle");
  const [showForgot, setShowForgot] = useState(false);

  // Where to land after a successful sign-in. OAuth always goes through
  // /onboarding (consistent first-run experience); email sign-in honors
  // ?redirectTo= so deep links don't get lost.
  const postAuthPath = redirectTo ?? "/profile";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: postAuthPath });
    });
  }, [navigate, postAuthPath]);

  function setMode(next: Mode) {
    navigate({ to: "/auth", search: { mode: next, redirectTo }, replace: true });
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/onboarding" });
        } else {
          setInfo(t("auth.confirmEmail"));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: postAuthPath });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericFail"));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotState("sending");
    await supabase.auth.resetPasswordForEmail(forgotEmail || email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setForgotState("sent");
  }

  async function handleOAuth(provider: "google" | "apple") {
    setBusy(true);
    setError(null);
    try {
      // OAuth lands on /onboarding for parity with email signup.
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/onboarding",
      });
      if (result.error) {
        setError(
          result.error instanceof Error ? result.error.message : t("auth.googleFail"),
        );
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/onboarding" });
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="min-h-screen bg-[oklch(0.985_0.008_180)]">
      <main className="mx-auto max-w-md px-4 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>
          <Link
            to="/profile"
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("auth.continueGuest")}
          </Link>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            {mode === "signup" ? t("auth.signUpTitle") : t("auth.welcomeBack")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signup" ? t("auth.signUpDesc") : t("auth.signInDesc")}
          </p>

          <div className="mt-4 grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "h-8 rounded-md transition",
                mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "h-8 rounded-md transition",
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t("auth.signUp")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={busy}
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border/60 bg-background text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <GoogleIcon />
            {t("auth.google")}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={busy}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border/60 bg-foreground text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-60"
          >
            <AppleIcon />
            Continue with Apple
          </button>


          <div className="relative my-4 text-center">
            <span className="absolute inset-x-0 top-1/2 -z-10 border-t border-border/60" />
            <span className="bg-card px-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              {t("auth.orEmail")}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">{t("auth.password")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm outline-none ring-primary/30 focus:ring-2"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
            )}
            {info && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{info}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-10 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? t("common.pleaseWait") : mode === "signup" ? t("auth.create") : t("auth.signIn")}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2c0 5.1 4.1 9.2 9.2 9.2 5.3 0 8.8-3.7 8.8-9 0-.6-.07-1-.16-1.2H12z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M16.365 12.34c.02-2.13 1.74-3.15 1.82-3.2-.99-1.45-2.53-1.65-3.08-1.67-1.31-.13-2.56.77-3.23.77-.68 0-1.7-.75-2.8-.73-1.44.02-2.77.84-3.51 2.13-1.5 2.6-.38 6.44 1.07 8.55.72 1.04 1.57 2.2 2.68 2.16 1.08-.04 1.49-.7 2.79-.7 1.3 0 1.67.7 2.81.68 1.16-.02 1.89-1.05 2.6-2.09.82-1.2 1.16-2.37 1.18-2.43-.03-.01-2.26-.87-2.28-3.47zM14.3 5.94c.6-.72 1-1.72.89-2.72-.86.04-1.9.57-2.51 1.29-.55.64-1.04 1.66-.91 2.64.96.07 1.94-.49 2.53-1.21z"/>
    </svg>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, User, Wrench, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useT();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check(uid: string | null) {
      if (!uid) {
        if (mounted) setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin");
      if (mounted) setIsAdmin((data?.length ?? 0) > 0);
    }
    supabase.auth.getUser().then(({ data }) => check(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      check(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Hide on auth screen
  if (pathname.startsWith("/auth")) return null;

  const items: { to: string; label: string; icon: typeof Home; match: (p: string) => boolean }[] = [
    { to: "/", label: t("nav.home"), icon: Home, match: (p) => p === "/" },
    { to: "/utilities", label: "Utilities", icon: Wrench, match: (p) => p.startsWith("/utilities") },
    { to: "/profile", label: t("nav.profile"), icon: User, match: (p) => p.startsWith("/profile") },
  ];
  if (isAdmin) {
    items.push({ to: "/admin", label: "Admin", icon: Shield, match: (p) => p.startsWith("/admin") });
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[11px] font-medium transition",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

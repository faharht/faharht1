import { Link, useRouterState } from "@tanstack/react-router";
import { Home, User, Shield } from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/useT";
import { supabase } from "@/integrations/supabase/client";

async function fetchIsAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin");
  return (data?.length ?? 0) > 0;
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useT();
  const queryClient = useQueryClient();

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: fetchIsAdmin,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  // Hide on auth screen
  if (pathname.startsWith("/auth")) return null;

  type NavTo = "/" | "/profile" | "/admin";
  const items: { to: NavTo; label: string; icon: typeof Home; match: (p: string) => boolean }[] = [
    { to: "/", label: t("nav.home"), icon: Home, match: (p) => p === "/" },
    { to: "/profile", label: t("nav.profile"), icon: User, match: (p) => p.startsWith("/profile") },
  ];
  if (isAdmin) {
    items.push({ to: "/admin", label: "Admin", icon: Shield, match: (p) => p.startsWith("/admin") });
  }

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border/60"
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

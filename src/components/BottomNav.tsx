import { Link, useRouterState } from "@tanstack/react-router";
import { Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Hide on auth screen
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[11px] font-medium transition",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
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

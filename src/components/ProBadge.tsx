import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm",
        className,
      )}
    >
      <Crown className="h-3 w-3" />
      Pro
    </span>
  );
}

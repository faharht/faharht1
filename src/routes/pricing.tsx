import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyUsage } from "@/lib/customSets.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { sessionUserQueryOptions } from "@/lib/userQueries";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/pricing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pricing — RussianFlow" },
      { name: "description", content: "Go Pro for unlimited custom sets and sentences." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const router = useRouter();
  const usageFn = useServerFn(getMyUsage);
  const usage = useQuery({ queryKey: ["customUsage"], queryFn: () => usageFn() });
  const { data: user = null } = useQuery(sessionUserQueryOptions);
  const sub = useSubscription(user?.id ?? null);
  const { openCheckout, loading } = usePaddleCheckout();
  const activePriceId = sub.data?.subscription?.price_id ?? null;
  const isPro = !!sub.data?.isPro;

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    if (!user) {
      toast.error("Please sign in to upgrade.");
      return;
    }
    try {
      await openCheckout({
        priceId: plan === "monthly" ? "pro_monthly" : "pro_yearly",
        customerEmail: user.email ?? undefined,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/profile?checkout=success`,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open checkout");
    }
  };



  const features = [
    "Unlimited custom sets and translations",
    "AI tutor chat (Russian conversation)",
    "Unlimited typing drills & spaced-repetition reviews",
    "Unlimited verb conjugation lookups",
    "All current and future sentence packs",
    "Pro badge & profile decorations",
    "Priority support",
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 pb-10 pt-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) router.history.back();
              else router.navigate({ to: "/" });
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/70">Upgrade</div>
            <h1 className="text-xl font-bold">Russian Trainer Pro</h1>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/85">
          Build as many custom sets as you want and translate as many sentences as you need.
        </p>
      </header>

      <main className="mx-auto -mt-6 max-w-2xl space-y-4 px-4">
        {isPro && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <Crown className="mr-1 inline h-4 w-4" /> You're on Pro. Thanks for supporting the app!
          </div>
        )}

        {/* Yearly first — best value */}
        <div className="relative rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-xl ring-4 ring-amber-200/60">
          <span className="absolute -top-3 left-5 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-orange-600 shadow">
            Save 44% · Most popular
          </span>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
            <Crown className="h-4 w-4" /> Yearly
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold">$19.99</span>
            <span className="text-sm text-white/85">/year</span>
            <span className="ml-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">$1.67/mo</span>
          </div>
          <p className="mt-1 text-xs text-white/85">Billed once a year. Cancel anytime.</p>
          <Button
            variant="secondary"
            className="mt-4 w-full bg-white py-6 text-base font-bold text-orange-700 hover:bg-white/90"
            onClick={() => handleCheckout("yearly")}
            disabled={isPro || loading}
          >
            {activePriceId === "pro_yearly" ? "Current plan" : isPro ? "Switch plan via billing portal" : "Choose yearly"}
          </Button>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Sparkles className="h-4 w-4 text-blue-500" /> Monthly
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">$2.99</span>
            <span className="text-sm text-slate-500">/month</span>
          </div>
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={() => handleCheckout("monthly")}
            disabled={isPro || loading}
          >
            {activePriceId === "pro_monthly" ? "Current plan" : isPro ? "Switch plan via billing portal" : "Choose monthly"}
          </Button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Everything in Pro</h2>
          <ul className="mt-3 space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Free plan: 1 custom set · 5 sentence translations per day · 10 daily reviews · 5 typing drills per set.
        </p>
      </main>
    </div>
  );
}

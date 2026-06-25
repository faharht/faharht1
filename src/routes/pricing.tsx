import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyUsage } from "@/lib/customSets.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { sessionUserQueryOptions } from "@/lib/userQueries";

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
  const usageFn = useServerFn(getMyUsage);
  const usage = useQuery({ queryKey: ["customUsage"], queryFn: () => usageFn() });
  const { data: user = null } = useQuery(sessionUserQueryOptions);
  const { openCheckout, loading } = usePaddleCheckout();

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
    "Unlimited custom sets",
    "Unlimited sentence translations",
    "All current and future sentence packs",
    "Priority support",
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="rounded-b-[2rem] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 px-4 pb-10 pt-6 text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Link to="/custom" className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        {usage.data?.isPro && (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            <Crown className="mr-1 inline h-4 w-4" /> You're on Pro. Thanks for supporting the app!
          </div>
        )}

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
            onClick={() => handleCheckout("monthly")}
            disabled={usage.data?.isPro || loading}
          >
            {usage.data?.isPro ? "Active" : "Choose monthly"}
          </Button>
        </div>

        <div className="relative rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-xl">
          <span className="absolute -top-3 left-5 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 shadow">
            Best value
          </span>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
            <Crown className="h-4 w-4" /> Yearly
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold">$19.99</span>
            <span className="text-sm text-white/85">/year</span>
          </div>
          <p className="mt-1 text-xs text-white/80">≈ $1.67/month · save 44%</p>
          <Button
            variant="secondary"
            className="mt-4 w-full bg-white text-orange-700 hover:bg-white/90"
            onClick={() => handleCheckout("yearly")}
            disabled={usage.data?.isPro || loading}
          >
            {usage.data?.isPro ? "Active" : "Choose yearly"}
          </Button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">What's included</h2>
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
          Free plan: 1 custom set · 5 sentence translations per day.
        </p>
      </main>
    </div>
  );
}

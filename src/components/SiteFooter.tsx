import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 max-w-2xl px-5 pb-6 text-center text-xs text-slate-500">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link to="/pricing" className="hover:text-blue-600 hover:underline">Pricing</Link>
        <span aria-hidden>·</span>
        <Link to="/legal/terms" className="hover:text-blue-600 hover:underline">Terms</Link>
        <span aria-hidden>·</span>
        <Link to="/legal/refund" className="hover:text-blue-600 hover:underline">Refunds</Link>
        <span aria-hidden>·</span>
        <Link to="/legal/privacy" className="hover:text-blue-600 hover:underline">Privacy</Link>
      </nav>
      <p className="mt-3">© {new Date().getFullYear()} RussianLingua</p>
    </footer>
  );
}

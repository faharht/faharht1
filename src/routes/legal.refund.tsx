import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — RussianFlow" },
      { name: "description", content: "RussianFlow's 30-day money-back guarantee and how to request a refund." },
      { property: "og:title", content: "Refund Policy — RussianFlow" },
      { property: "og:description", content: "30-day money-back guarantee for RussianFlow subscriptions." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-2xl px-5 py-10 text-slate-800">
        <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">← Home</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Refund Policy</h1>
        <p className="mt-1 text-xs text-slate-500">Last updated: June 25, 2026</p>

        <div className="prose prose-sm mt-6 space-y-5 text-sm leading-6">
          <p>
            <strong>RussianFlow</strong> offers a <strong>30-day money-back guarantee</strong> on
            all subscription purchases. If you are not satisfied with your subscription, you may
            request a full refund within 30 days of the original purchase date.
          </p>

          <h2 className="text-base font-semibold text-slate-900">How to request a refund</h2>
          <p>
            Payments for RussianFlow are processed by our merchant of record,{" "}
            <strong>Paddle</strong>. To request a refund:
          </p>
          <ol className="list-decimal pl-5">
            <li>
              Visit{" "}
              <a
                href="https://paddle.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                paddle.net
              </a>{" "}
              and look up your order using the email address you used at checkout.
            </li>
            <li>Open the relevant transaction and follow the refund request flow.</li>
            <li>
              Alternatively, contact us via the in-app Suggestions feature on your Profile page
              and we will help you submit the request to Paddle.
            </li>
          </ol>

          <h2 className="text-base font-semibold text-slate-900">Renewals &amp; cancellations</h2>
          <p>
            You can cancel your subscription at any time. Cancellation stops future renewals; the
            30-day refund window applies from the date of each individual charge.
          </p>

          <h2 className="text-base font-semibold text-slate-900">Processing</h2>
          <p>
            Approved refunds are returned to the original payment method. Processing times depend
            on your bank or card issuer and typically take 5–10 business days.
          </p>

          <p className="text-xs text-slate-500">
            See also our{" "}
            <Link to="/legal/terms" className="text-blue-600 underline">Terms &amp; Conditions</Link>{" "}
            and{" "}
            <Link to="/legal/privacy" className="text-blue-600 underline">Privacy Notice</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

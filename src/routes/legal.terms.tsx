import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — RussianLingua" },
      { name: "description", content: "Terms and Conditions for using RussianLingua." },
      { property: "og:title", content: "Terms & Conditions — RussianLingua" },
      { property: "og:description", content: "The terms governing use of RussianLingua." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-2xl px-5 py-10 text-slate-800">
        <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">← Home</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Terms & Conditions</h1>
        <p className="mt-1 text-xs text-slate-500">Last updated: June 25, 2026</p>

        <div className="prose prose-sm mt-6 space-y-5 text-sm leading-6">
          <p>
            These Terms & Conditions ("Terms") govern your access to and use of the RussianLingua
            application and website (the "Service"), operated by <strong>RussianLingua</strong>
            ("we", "us", "our"). By creating an account or otherwise using the Service you agree
            to these Terms.
          </p>

          <h2 className="text-base font-semibold text-slate-900">1. The Service</h2>
          <p>
            RussianLingua provides language-learning content, including sentence sets, audio,
            transliterations, grammar notes, and tools to create custom sets. We may modify or
            discontinue features at any time.
          </p>

          <h2 className="text-base font-semibold text-slate-900">2. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5">
            <li>use the Service unlawfully or fraudulently;</li>
            <li>infringe intellectual-property or privacy rights;</li>
            <li>upload spam, malware, or harmful content;</li>
            <li>probe, scan, scrape, or interfere with the Service's security or infrastructure;</li>
            <li>resell, redistribute, or reverse-engineer the Service.</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-900">3. Accounts</h2>
          <p>
            You are responsible for activity under your account and for keeping your credentials
            confidential. You must provide accurate information and keep it up to date.
          </p>

          <h2 className="text-base font-semibold text-slate-900">4. Intellectual property</h2>
          <p>
            All software, content, branding, and materials that make up the Service remain the
            property of RussianLingua or its licensors. You receive a limited, non-exclusive,
            non-transferable right to use the Service for personal learning within your plan.
          </p>

          <h2 className="text-base font-semibold text-slate-900">5. User content</h2>
          <p>
            You retain ownership of sentences and sets you create. You grant us a limited license
            to host and process that content solely to provide the Service to you.
          </p>

          <h2 className="text-base font-semibold text-slate-900">6. Payments &amp; subscriptions</h2>
          <p>
            Our order process is conducted by our online reseller <strong>Paddle.com</strong>.
            Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer
            service inquiries and handles returns. Payment, billing, taxes, cancellation and refund
            mechanics are governed by Paddle's{" "}
            <a
              href="https://www.paddle.com/legal/checkout-buyer-terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Buyer Terms
            </a>
            . Subscriptions renew automatically until cancelled. See our{" "}
            <Link to="/legal/refund" className="text-blue-600 underline">Refund Policy</Link>.
          </p>

          <h2 className="text-base font-semibold text-slate-900">7. Service level &amp; warranties</h2>
          <p>
            The Service is provided "as is" and "as available". We do not guarantee that it will
            be uninterrupted or error-free. To the fullest extent permitted by law we disclaim
            all implied warranties, including merchantability and fitness for a particular purpose.
          </p>

          <h2 className="text-base font-semibold text-slate-900">8. Liability</h2>
          <p>
            To the extent permitted by law, our aggregate liability for any claim arising from the
            Service is limited to the fees you paid us in the 12 months preceding the claim. We
            are not liable for indirect, consequential, or special damages (including loss of
            profits, data, or goodwill). Nothing in these Terms excludes liability that cannot be
            excluded by law.
          </p>

          <h2 className="text-base font-semibold text-slate-900">9. Suspension &amp; termination</h2>
          <p>
            We may suspend or terminate your access for material breach of these Terms, non-payment,
            security or fraud risk, or repeated policy violations. You may stop using the Service
            at any time. On termination, your right to use the Service ends.
          </p>

          <h2 className="text-base font-semibold text-slate-900">10. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after
            changes take effect constitutes acceptance of the updated Terms.
          </p>

          <h2 className="text-base font-semibold text-slate-900">11. Governing law</h2>
          <p>
            These Terms are governed by the laws applicable at the seller's place of establishment,
            without regard to conflict-of-laws principles.
          </p>

          <h2 className="text-base font-semibold text-slate-900">12. Contact</h2>
          <p>
            Questions about these Terms? Contact RussianLingua through the in-app Suggestions
            feature on your Profile page.
          </p>
        </div>
      </div>
    </div>
  );
}

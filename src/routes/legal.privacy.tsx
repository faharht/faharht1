import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — RussianFlow" },
      { name: "description", content: "How RussianFlow collects, uses, and protects your personal data." },
      { property: "og:title", content: "Privacy Notice — RussianFlow" },
      { property: "og:description", content: "Privacy practices for the RussianFlow learning app." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-2xl px-5 py-10 text-slate-800">
        <Link to="/" className="text-xs font-semibold text-blue-600 hover:underline">← Home</Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Privacy Notice</h1>
        <p className="mt-1 text-xs text-slate-500">Last updated: June 25, 2026</p>

        <div className="prose prose-sm mt-6 space-y-5 text-sm leading-6">
          <p>
            This Privacy Notice explains how <strong>RussianFlow</strong> ("we", "us", "our")
            collects, uses, and shares personal data when you use our application and website
            (the "Service"). RussianFlow acts as the <strong>data controller</strong> for the
            personal data described below.
          </p>

          <h2 className="text-base font-semibold text-slate-900">1. Data we collect</h2>
          <ul className="list-disc pl-5">
            <li><strong>Account data:</strong> email address, display name, optional avatar.</li>
            <li><strong>Authentication data:</strong> login credentials and OAuth identifiers (Google, Apple).</li>
            <li><strong>Learning data:</strong> progress, streaks, reps, badges, daily-goal settings, custom sets and sentences you create.</li>
            <li><strong>Support data:</strong> messages you send through the Suggestions feature.</li>
            <li><strong>Usage &amp; device data:</strong> IP address, browser/device identifiers, and basic telemetry needed to operate and secure the Service.</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-900">2. Purposes &amp; legal bases</h2>
          <ul className="list-disc pl-5">
            <li><strong>Provide the Service</strong> (contract performance): account creation, lessons, progress sync, custom sets, AI-assisted translations.</li>
            <li><strong>Security &amp; fraud prevention</strong> (legitimate interests): detect abuse and protect users.</li>
            <li><strong>Customer support</strong> (legitimate interests / contract): respond to your messages.</li>
            <li><strong>Product improvement</strong> (legitimate interests): aggregated, non-identifying usage analysis.</li>
            <li><strong>Legal compliance</strong> (legal obligation): tax, accounting, and lawful requests.</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-900">3. Sharing your data</h2>
          <p>We share personal data with:</p>
          <ul className="list-disc pl-5">
            <li><strong>Service providers / sub-processors</strong> — hosting, database, authentication, and infrastructure (e.g. Supabase / Lovable Cloud).</li>
            <li><strong>AI providers</strong> — when you use AI-assisted translation for custom sentences, the text you submit is processed by our language-model gateway.</li>
            <li><strong>Paddle.com Market Limited</strong> — our Merchant of Record. Paddle handles payments, subscription management, taxes, invoicing, and refund requests for the Service.</li>
            <li><strong>Professional advisers</strong> — legal, accounting, and similar advisers where necessary.</li>
            <li><strong>Authorities</strong> — where required by law or to protect rights.</li>
          </ul>

          <h2 className="text-base font-semibold text-slate-900">4. Data retention</h2>
          <p>
            We keep personal data for as long as your account is active and for as long as needed
            to provide the Service, comply with legal obligations, resolve disputes, and enforce
            our agreements. When data is no longer needed it is deleted or anonymised. You can
            delete your account at any time from the Profile page.
          </p>

          <h2 className="text-base font-semibold text-slate-900">5. Your rights</h2>
          <p>
            Subject to applicable law, you may have the right to access, rectify, delete, restrict,
            port, or object to the processing of your personal data, and to withdraw consent. To
            exercise these rights, contact us via the in-app Suggestions feature on your Profile
            page. You may also have the right to lodge a complaint with your local data-protection
            authority.
          </p>

          <h2 className="text-base font-semibold text-slate-900">6. International transfers</h2>
          <p>
            Personal data may be processed outside your country of residence by our service
            providers. Where required, appropriate safeguards (such as Standard Contractual
            Clauses or adequacy decisions) are used to protect that data.
          </p>

          <h2 className="text-base font-semibold text-slate-900">7. Security</h2>
          <p>
            We use appropriate technical and organisational measures — including encryption in
            transit, access controls, and Row-Level Security on the database — to protect your
            personal data. No system is perfectly secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-base font-semibold text-slate-900">8. Cookies</h2>
          <p>
            The Service uses strictly necessary cookies and similar storage (e.g. session and
            authentication tokens) required for the Service to function. We do not use advertising
            cookies.
          </p>

          <h2 className="text-base font-semibold text-slate-900">9. Children</h2>
          <p>
            The Service is not directed to children under the age of 13. If you believe a child
            has provided us with personal data, please contact us so we can remove it.
          </p>

          <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
          <p>
            For privacy questions or requests, contact RussianFlow through the in-app
            Suggestions feature on your Profile page.
          </p>

          <p className="text-xs text-slate-500">
            See also our{" "}
            <Link to="/legal/terms" className="text-blue-600 underline">Terms &amp; Conditions</Link>{" "}
            and{" "}
            <Link to="/legal/refund" className="text-blue-600 underline">Refund Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

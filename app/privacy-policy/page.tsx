import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy – MyCashLedger",
  description: "Learn how MyCashLedger collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2, 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>MyCashLedger</strong> ("we", "us", or "our"). We are committed to protecting your
              personal information and your right to privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform at{" "}
              <a href="https://mycashledger.com" className="text-blue-600 hover:underline">
                https://mycashledger.com
              </a>
              .
            </p>
            <p className="mt-3">
              Please read this policy carefully. If you disagree with its terms, please discontinue use of the
              platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email address, phone number, and password when you
                register for an account.
              </li>
              <li>
                <strong>Business Information:</strong> Company name, address, tax identification numbers, and
                financial data you input into the platform.
              </li>
              <li>
                <strong>Usage Data:</strong> Log data, IP addresses, browser type, pages visited, and actions
                taken within the platform.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details processed securely through our payment
                providers. We do not store full card numbers.
              </li>
              <li>
                <strong>Cookies &amp; Tracking:</strong> Cookies and similar technologies to enhance your
                experience (see Section 7).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Provide, operate, and maintain the MyCashLedger platform.</li>
              <li>Process transactions and send related information (invoices, receipts).</li>
              <li>Send administrative information, updates, and security alerts.</li>
              <li>Respond to comments, questions, and requests.</li>
              <li>Monitor and analyse usage trends to improve the platform.</li>
              <li>Comply with legal obligations and enforce our Terms &amp; Conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Sharing Your Information</h2>
            <p>
              We do <strong>not</strong> sell, trade, or rent your personal data to third parties. We may share
              information with:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Service Providers:</strong> Trusted third-party vendors (hosting, payment processing,
                analytics) who assist us in operating the platform under strict confidentiality agreements.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets,
                your data may be transferred with prior notice.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services.
              You may request deletion of your account and associated data at any time by contacting us. We may
              retain certain information as required by law or for legitimate business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), encrypted
              storage, access controls, and regular security audits. However, no method of transmission over the
              internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to improve your browsing experience, analyse site
              traffic, and personalise content. You can control cookie preferences through your browser settings
              or our cookie consent banner. Disabling cookies may affect some features of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability (receive your data in a structured format).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:info@mycashledger.com" className="text-blue-600 hover:underline">
                info@mycashledger.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Third-Party Links</h2>
            <p>
              The platform may contain links to third-party websites. We are not responsible for the privacy
              practices of those sites and encourage you to review their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              updating the "Last updated" date at the top of this page. Continued use of the platform after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <address className="not-italic mt-3 space-y-1">
              <p><strong>MyCashLedger</strong></p>
              <p>
                Email:{" "}
                <a href="mailto:info@mycashledger.com" className="text-blue-600 hover:underline">
                  info@mycashledger.com
                </a>
              </p>
              <p>
                Website:{" "}
                <a href="https://mycashledger.com" className="text-blue-600 hover:underline">
                  https://mycashledger.com
                </a>
              </p>
            </address>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}

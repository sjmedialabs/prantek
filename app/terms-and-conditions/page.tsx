import { LandingHeader } from "@/components/landing-header"
import { LandingFooter } from "@/components/landing-footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions – MyCashLedger",
  description: "Read the Terms and Conditions governing your use of the MyCashLedger platform.",
}

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 2, 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>MyCashLedger</strong> (the "Platform") at{" "}
              <a href="https://mycashledger.com" className="text-blue-600 hover:underline">
                https://mycashledger.com
              </a>
              , you agree to be bound by these Terms &amp; Conditions ("Terms"). If you do not agree to all of
              these Terms, you must not access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
            <p>
              MyCashLedger is a multi-tenant SaaS platform providing financial and operations management tools,
              including but not limited to: ledger management, invoicing, expense tracking, reporting, and
              role-based access control for businesses of all sizes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into these Terms on behalf
              of yourself or the organisation you represent. By using the Platform, you represent and warrant
              that you meet these requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Account Registration</h2>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>You must provide accurate and complete registration information.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>
                You must notify us immediately at{" "}
                <a href="mailto:info@mycashledger.com" className="text-blue-600 hover:underline">
                  info@mycashledger.com
                </a>{" "}
                of any unauthorised use of your account.
              </li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Subscription and Billing</h2>
            <p>
              Certain features of the Platform require a paid subscription. By subscribing, you authorise us to
              charge your selected payment method on a recurring basis. Subscription fees are non-refundable
              except where required by applicable law. We reserve the right to change pricing with reasonable
              prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Use the Platform for any unlawful purpose or in violation of any regulations.</li>
              <li>Upload or transmit viruses, malware, or any malicious code.</li>
              <li>Attempt to gain unauthorised access to any part of the Platform or its systems.</li>
              <li>Reverse-engineer, decompile, or disassemble any component of the Platform.</li>
              <li>Use the Platform to store or process sensitive regulated data without appropriate authorisation.</li>
              <li>Resell, sublicense, or redistribute access to the Platform without our prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the Platform — including software, text, graphics,
              logos, and trademarks — are the exclusive property of MyCashLedger and its licensors. You are
              granted a limited, non-exclusive, non-transferable licence to use the Platform solely for your
              internal business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Your Data</h2>
            <p>
              You retain ownership of all data you upload to the Platform ("Your Data"). By using the Platform,
              you grant us a limited licence to process Your Data solely to provide the services described herein.
              We will handle Your Data in accordance with our{" "}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Disclaimers</h2>
            <p>
              The Platform is provided on an <strong>"as is"</strong> and <strong>"as available"</strong> basis
              without warranties of any kind, either express or implied, including but not limited to warranties
              of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that
              the Platform will be uninterrupted, error-free, or free of harmful components.
            </p>
            <p className="mt-3">
              MyCashLedger does not provide financial, legal, or accounting advice. The Platform is a tool to
              help you manage your data; you remain solely responsible for your financial decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, MyCashLedger shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of profits, data,
              or goodwill, arising out of or in connection with your use of the Platform, even if advised of the
              possibility of such damages. Our total aggregate liability shall not exceed the amount paid by you
              in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless MyCashLedger and its officers, directors,
              employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal
              fees) arising out of your use of the Platform, violation of these Terms, or infringement of any
              third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time, with or without cause or
              notice. Upon termination, your right to use the Platform will immediately cease. Provisions that by
              their nature should survive termination (including intellectual property, disclaimers, and
              limitation of liability) will survive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law. Any disputes
              arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by
              updating the "Last updated" date. Continued use of the Platform after changes are posted constitutes
              your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">15. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us:</p>
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

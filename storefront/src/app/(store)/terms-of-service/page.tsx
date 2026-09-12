import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'Read our terms of service. By using MyStore, you agree to these terms and conditions governing your use of our website and services.',
  path: '/terms-of-service',
});

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Terms of Service
      </h1>

      <section>
        <p className="text-gray-700 leading-relaxed mb-6">
          <strong>Last updated: June 15, 2026</strong>
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          1. Acceptance of Terms
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          By accessing and using MyStore (&quot;the Website&quot;), you accept and agree
          to be bound by these Terms of Service. If you do not agree to these
          terms, please do not use our Website or services.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          2. Use of Our Services
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          You agree to use our services only for lawful purposes and in
          accordance with these Terms. You must not:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
          <li>Use the Website in any way that violates applicable laws or regulations.</li>
          <li>Attempt to gain unauthorized access to any part of the Website or its systems.</li>
          <li>Use automated systems (bots, scrapers) to access the Website without our express permission.</li>
          <li>Transmit any malicious code or attempt to disrupt the Website&apos;s operation.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          3. Account Registration
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          To make purchases, you may be required to create an account. You are
          responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account.
          Please notify us immediately of any unauthorized use.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          4. Products & Pricing
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          We strive to display product information and pricing accurately.
          However, we do not warrant that product descriptions, images, or
          prices are error-free. We reserve the right to correct any errors and
          to update pricing at any time without prior notice. All prices are
          subject to change.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          5. Orders & Payment
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          All orders are subject to acceptance and availability. We reserve the
          right to refuse or cancel any order at our sole discretion. Payment
          is processed securely through our payment provider. By placing an
          order, you represent that you are authorized to use the payment
          method provided.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          6. Intellectual Property
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          All content on the Website, including but not limited to text,
          graphics, logos, images, and software, is the property of MyStore or
          its licensors and is protected by intellectual property laws. You may
          not reproduce, distribute, or create derivative works without our
          prior written consent.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          7. Limitation of Liability
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          To the fullest extent permitted by law, MyStore shall not be liable
          for any indirect, incidental, special, or consequential damages
          arising out of or in connection with your use of the Website or our
          services. Our total liability shall not exceed the amount you paid
          for the product in question.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          8. Privacy
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Your privacy is important to us. Please review our Privacy Policy to
          understand how we collect, use, and protect your personal
          information.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          9. Changes to These Terms
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          We reserve the right to modify these Terms of Service at any time.
          Changes will be posted on this page with an updated &quot;Last updated&quot;
          date. Your continued use of the Website after changes are posted
          constitutes your acceptance of the modified Terms.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          10. Governing Law
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          These Terms of Service shall be governed by and construed in
          accordance with applicable laws, without regard to conflict of law
          principles.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          11. Contact Us
        </h2>
        <p className="text-gray-700 leading-relaxed">
          If you have any questions about these Terms of Service, please
          contact us at{' '}
          <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
            support@mystore.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

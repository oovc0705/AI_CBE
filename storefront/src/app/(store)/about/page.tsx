import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'About Us',
  description:
    'Learn about our mission, values, and the team behind MyStore. We are committed to delivering premium quality products at affordable prices.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">About Us</h1>

      <section>
        <p className="text-lg text-gray-700 leading-relaxed mb-6">
          Welcome to <strong>MyStore</strong> — your trusted destination for
          premium quality products at affordable prices. We believe everyone
          deserves access to well-crafted, reliable goods without breaking the
          bank.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Our Mission
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Our mission is simple: to curate and deliver the finest products
          directly to your doorstep. We work closely with manufacturers and
          artisans worldwide to ensure every item in our catalog meets our
          rigorous quality standards.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Why Choose Us
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
          <li>
            <strong>Quality Assurance</strong> — Every product undergoes strict
            quality checks before shipping.
          </li>
          <li>
            <strong>Competitive Pricing</strong> — Direct sourcing means better
            prices for you.
          </li>
          <li>
            <strong>Fast Shipping</strong> — We partner with reliable carriers
            to get your order to you quickly.
          </li>
          <li>
            <strong>Customer Support</strong> — Our friendly team is always
            ready to help with any questions or concerns.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Our Values
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Transparency, integrity, and customer satisfaction are at the heart
          of everything we do. We strive to build long-lasting relationships
          with our customers based on trust and exceptional service.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Contact Us
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Have questions? We&apos;d love to hear from you. Reach out to us at{' '}
          <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
            support@mystore.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

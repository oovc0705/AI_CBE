import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Shipping Policy',
  description:
    'Learn about our shipping methods, delivery times, and shipping rates. We offer fast and reliable worldwide shipping.',
  path: '/shipping-policy',
});

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

      <section>
        <p className="text-gray-700 leading-relaxed mb-6">
          <strong>Last updated: June 15, 2026</strong>
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Order Processing Time
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          All orders are processed within <strong>1-2 business days</strong> of
          receiving your order confirmation. Orders placed on weekends or
          holidays will be processed on the next business day.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Shipping Methods & Delivery Times
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Shipping Method
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Estimated Delivery
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  Standard Shipping
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  7-14 business days
                </td>
                <td className="border border-gray-300 px-4 py-2">Free</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  Express Shipping
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  3-5 business days
                </td>
                <td className="border border-gray-300 px-4 py-2">$9.99</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  Priority Shipping
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  1-3 business days
                </td>
                <td className="border border-gray-300 px-4 py-2">$19.99</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Shipping Destinations
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          We currently ship to most countries worldwide. Shipping availability
          and delivery times may vary depending on your location. Some remote
          areas may have limited shipping options.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Order Tracking
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Once your order ships, you will receive a confirmation email with a
          tracking number. You can use this number to track your package on the
          carrier&apos;s website.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Customs & Import Duties
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          International orders may be subject to customs duties and taxes
          imposed by the destination country. These charges are the
          responsibility of the recipient and are not included in our shipping
          fees.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Lost or Damaged Packages
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          If your package arrives damaged or does not arrive at all, please
          contact us at{' '}
          <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
            support@mystore.com
          </a>{' '}
          within 30 days of your order date, and we will work to resolve the
          issue promptly.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Contact Us
        </h2>
        <p className="text-gray-700 leading-relaxed">
          If you have any questions about our shipping policy, please reach out
          to us at{' '}
          <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
            support@mystore.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Refund Policy',
  description:
    'Our refund and return policy. Learn about our 30-day return window, refund process, and conditions for eligible returns.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>

      <section>
        <p className="text-gray-700 leading-relaxed mb-6">
          <strong>Last updated: June 15, 2026</strong>
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          30-Day Return Policy
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          We offer a <strong>30-day return window</strong> from the date of
          delivery. If you are not completely satisfied with your purchase, you
          may return it within 30 days for a full refund, subject to the
          conditions below.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Eligibility for Returns
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          To be eligible for a return, your item must meet the following
          criteria:
        </p>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
          <li>The item must be unused and in the same condition you received it.</li>
          <li>The item must be in its original packaging.</li>
          <li>You must provide proof of purchase (order number or receipt).</li>
          <li>
            Certain items cannot be returned, including but not limited to:
            perishable goods, custom-made products, and personal care items.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          How to Initiate a Return
        </h2>
        <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-6">
          <li>
            Contact us at{' '}
            <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
              support@mystore.com
            </a>{' '}
            with your order number and reason for return.
          </li>
          <li>
            We will provide you with a Return Merchandise Authorization (RMA)
            number and return shipping instructions.
          </li>
          <li>
            Ship the item back to us using a trackable shipping method. You are
            responsible for return shipping costs unless the return is due to
            our error.
          </li>
          <li>
            Once we receive and inspect the returned item, we will process your
            refund.
          </li>
        </ol>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Refund Processing
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Approved refunds will be processed within <strong>5-10 business days</strong> of
          receiving the returned item. The refund will be applied to your
          original payment method. Please note that it may take an additional
          3-5 business days for the refund to appear on your statement,
          depending on your bank or payment provider.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Exchanges
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          If you need to exchange an item for a different size or color, please
          follow the return process above and place a new order for the desired
          item.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Damaged or Defective Items
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          If you receive a damaged or defective item, please contact us within
          7 days of delivery with photos of the damage. We will arrange a
          replacement or full refund at no additional cost to you.
        </p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Non-Refundable Items
        </h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
          <li>Gift cards</li>
          <li>Downloadable software or digital products</li>
          <li>Items marked as &quot;Final Sale&quot; or &quot;Non-returnable&quot;</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
          Contact Us
        </h2>
        <p className="text-gray-700 leading-relaxed">
          For any questions about our refund policy, please contact us at{' '}
          <a href="mailto:support@mystore.com" className="text-blue-600 hover:underline">
            support@mystore.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}

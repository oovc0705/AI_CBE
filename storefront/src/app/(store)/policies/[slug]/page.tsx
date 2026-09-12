import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import policiesData from '@/lib/policies.json';

interface PolicySection {
  heading: string;
  content: string;
}

interface Policy {
  title: string;
  description: string;
  lastUpdated: string;
  sections: PolicySection[];
}

const policies: Record<string, Policy> = policiesData;
const VALID_SLUGS = Object.keys(policies);

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) {
    return { title: 'Page Not Found', robots: { index: false, follow: false } };
  }
  return buildMetadata({
    title: policy.title,
    description: policy.description,
    path: `/policies/${slug}`,
  });
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];
  if (!policy) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: policy.title,
    description: policy.description,
    dateModified: policy.lastUpdated,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16 animate-fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-caption text-gray-400">
          <li>
            <Link href="/" className="hover:text-brand transition-fast">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-gray-700">{policy.title}</li>
        </ol>
      </nav>

      <h1 className="text-h2 md:text-h1 font-bold text-gray-900 mb-2">
        {policy.title}
      </h1>
      <p className="text-body-sm text-gray-400 mb-10">
        Last updated: {policy.lastUpdated}
      </p>

      <div className="space-y-8">
        {policy.sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-h5 md:text-h4 font-semibold text-gray-900 mb-3">
              {section.heading}
            </h2>
            <p className="text-body-base text-gray-700 leading-relaxed">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {/* Related policies */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-body-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">
          Related Policies
        </h3>
        <div className="flex flex-wrap gap-3">
          {VALID_SLUGS.filter((s) => s !== slug).map((s) => (
            <Link
              key={s}
              href={`/policies/${s}`}
              className="text-body-sm text-brand hover:text-brand-light transition-fast underline underline-offset-4"
            >
              {policies[s].title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

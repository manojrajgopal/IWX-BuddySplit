import { AppShell } from '@/components/layout/AppShell';
import { getPublicSettings, settingArray, settingString } from '@/lib/cms';
import Link from 'next/link';

interface FeatureCard { title: string; body: string }

export default async function HomePage(): Promise<JSX.Element> {
  const settings = await getPublicSettings();
  const features = settingArray<FeatureCard>(settings, 'feature.cards');
  return (
    <AppShell>
      <section className="hero fade-in-up">
        <h1>{settingString(settings, 'hero.title', 'Money clarity for groups.')}</h1>
        <p>{settingString(settings, 'hero.subtitle', '')}</p>
        <Link href={settingString(settings, 'cta.primary.href', '/register')} className="btn btn--primary btn--lg">
          {settingString(settings, 'cta.primary.label', 'Get started')}
        </Link>
      </section>

      {features.length > 0 && (
        <section className="container" style={{ paddingBottom: '6rem' }}>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} className="card card--hover">
                <h3 className="card__title">{f.title}</h3>
                <p className="text-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

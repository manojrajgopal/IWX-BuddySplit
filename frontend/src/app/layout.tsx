import '@/styles/globals.css';
import '@/styles/components.css';
import type { Metadata } from 'next';
import { getBranding, getPublicSettings, settingString } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, brand] = await Promise.all([getPublicSettings(), getBranding()]);
  return {
    title: { default: settingString(settings, 'app.name', 'IWX-BuddySplit'), template: `%s · ${settingString(settings, 'app.name', 'IWX-BuddySplit')}` },
    description: settingString(settings, 'app.description', 'Real-time expense sharing and settlement.'),
    icons: brand['favicon'] ? [{ rel: 'icon', url: brand['favicon'].url, type: brand['favicon'].mime }] : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}

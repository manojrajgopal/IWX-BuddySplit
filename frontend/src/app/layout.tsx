import '@/styles/globals.css';
import '@/styles/components.css';
import '@/styles/auth.css';
import '@/styles/shell.css';
import type { Metadata, Viewport } from 'next';
import { getBranding, getPublicSettings, settingString } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const [settings, brand] = await Promise.all([getPublicSettings(), getBranding()]);
  const appName = settingString(settings, 'app.name', 'IWX BuddySplit');
  const description = settingString(
    settings,
    'app.description',
    'IWX BuddySplit is a real-time expense sharing and settlement platform. Split bills, track balances, and settle debts with friends, roommates, travel buddies, and teams — with precision down to every paisa.',
  );

  return {
    title: { default: appName, template: `%s · ${appName}` },
    description,
    applicationName: appName,
    keywords: [
      'expense splitting',
      'bill sharing',
      'group expenses',
      'settle debts',
      'split bills',
      'roommate expenses',
      'travel expenses',
      'BuddySplit',
      'IWX',
      'money management',
    ],
    authors: [{ name: 'InfiniteWaveX', url: 'https://infinitewavex.com' }],
    creator: 'InfiniteWaveX',
    publisher: 'InfiniteWaveX',
    metadataBase: new URL(settingString(settings, 'app.url', 'http://localhost:3000')),
    openGraph: {
      type: 'website',
      siteName: appName,
      title: `${appName} — Money clarity for groups`,
      description,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${appName} — Money clarity for groups`,
      description,
    },
    icons: {
      icon: brand['favicon'] ? brand['favicon'].url : '/favicon.ico',
      apple: '/logo192.png',
    },
    manifest: '/manifest.json',
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}}catch(e){}})()` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

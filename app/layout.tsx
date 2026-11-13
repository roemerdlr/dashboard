import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';
import { I18nProvider } from '@/app/lib/i18n/client';
import {
  getDictionary,
  getLocale,
  getTranslations,
} from '@/app/lib/i18n/server';
import { SpeedInsights } from '@vercel/speed-insights/next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: {
      template: '%s | Acme Dashboard',
      default: 'Acme Dashboard',
    },
    description: t('metadata.description'),
    metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <I18nProvider locale={locale} dictionary={getDictionary(locale)}>
          {children}
        </I18nProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

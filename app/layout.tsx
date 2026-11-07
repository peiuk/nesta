import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { LocaleProvider } from '@/components/product/locale';
import { Toaster } from '@/components/ui/toast';
import { HOME_DESCRIPTION, HOME_TITLE, publicOrigin } from '@/lib/seo';
import './globals.css';
import './product.css';
import './home.css';
import './admin.css';
import './client.css';

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const origin = publicOrigin(process.env.SITE_ORIGIN, headerList.get('x-forwarded-host') || headerList.get('host'), headerList.get('x-forwarded-proto'));
  return {
    metadataBase: new URL(origin),
    title: { default: HOME_TITLE, template: '%s · Nesta' },
    description: HOME_DESCRIPTION,
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const savedLanguage = cookieStore.get('firstleaf-language')?.value;
  const acceptedLanguages = (headerList.get('accept-language') || '').split(',').map((language) => language.trim().toLowerCase());
  const initialLang = savedLanguage === 'zh' || savedLanguage === 'en'
    ? savedLanguage
    : acceptedLanguages.some((language) => language.startsWith('zh')) ? 'zh' : 'en';

  return (
    <html lang={initialLang === 'zh' ? 'zh-CN' : 'en'}>
      <body>
        <LocaleProvider initialLang={initialLang}>
          <Toaster>{children}</Toaster>
        </LocaleProvider>
      </body>
    </html>
  );
}

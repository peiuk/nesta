import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { LocaleProvider } from '@/components/product/locale';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

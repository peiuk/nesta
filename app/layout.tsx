import type { Metadata } from 'next';
import { LocaleProvider } from '@/components/product/locale';
import './globals.css';
import './product.css';
import './admin.css';

export const metadata: Metadata = {
  title: '初禾 FIRSTLEAF · 生育服务协调',
  description: '中文与英文客户服务空间：个别评估、案件进度与私密报告交付。',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}

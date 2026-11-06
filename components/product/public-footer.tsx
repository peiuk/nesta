'use client';
import Link from "next/link";
import {Brand} from './brand';
import {useLocale} from './locale';
import {CONTACT_EMAIL,CONTACT_PHONE,CONTACT_PHONE_TEL,PUBLIC_LEGAL_NAME_EN,PUBLIC_LEGAL_NAME_ZH} from '@/lib/public-contact';
import {PUBLIC_NAV_LINKS} from './public-site-header';

type PublicFooterProps = {
  current?: string;
  showHomeLink?: boolean;
};

export function PublicFooter({current, showHomeLink = false}: PublicFooterProps) {
  const {t, lang} = useLocale();
  const legal = lang === 'en' ? PUBLIC_LEGAL_NAME_EN : PUBLIC_LEGAL_NAME_ZH;
  return (
    <footer className="site-footer site-footer-public">
      <div className="site-footer-brand">
        <Brand />
        <p className="site-footer-legal">{legal}</p>
        <p className="site-footer-contact">
          <a href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE}</a>
          <span aria-hidden="true"> · </span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
      <span className="footer-links">
        {showHomeLink ? <Link href="/">{t('首页', 'Home')}</Link> : null}
        {PUBLIC_NAV_LINKS.map(([href, zh, en]) => (
          <a key={href} href={href} aria-current={href === current ? 'page' : undefined}>
            {t(zh, en)}
          </a>
        ))}
        <Link href="/privacy" aria-current={current === '/privacy' ? 'page' : undefined}>
          {t('隐私政策', 'Privacy policy')}
        </Link>
      </span>
    </footer>
  );
}

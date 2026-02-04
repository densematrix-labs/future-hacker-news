import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hn-footer">
      <div className="hn-footer-links">
        <a href="#">{t('guidelines')}</a> |{' '}
        <a href="#">{t('faq')}</a> |{' '}
        <a href="#">{t('api')}</a> |{' '}
        <a href="#">{t('security')}</a> |{' '}
        <a href="#">{t('lists')}</a> |{' '}
        <a href="#">{t('legal')}</a> |{' '}
        <a href="#">{t('apply')}</a> |{' '}
        <a href="#">{t('contact')}</a>
      </div>
      <div className="hn-footer-note">{t('footer')}</div>
    </footer>
  );
}

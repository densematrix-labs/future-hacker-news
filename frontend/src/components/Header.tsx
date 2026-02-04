import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'ko', label: '한국어' },
  { code: 'es', label: 'ES' },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2030 + i);

interface HeaderProps {
  year: number;
  setYear: (year: number) => void;
  onGenerate: () => void;
  loading: boolean;
  canGenerate?: boolean;
  credits?: number;
}

export function Header({ year, setYear, onGenerate, loading, canGenerate = true, credits }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="hn-header">
      <div className="hn-header-inner">
        <div className="hn-header-left">
          <Link to="/" className="hn-logo">
            <span className="hn-logo-box">Y</span>
          </Link>
          <span className="hn-site-name">
            <strong>{t('title')}</strong>
          </span>
          <nav className="hn-nav">
            <a href="#">{t('new')}</a> |{' '}
            <a href="#">{t('past')}</a> |{' '}
            <a href="#">{t('ask')}</a> |{' '}
            <a href="#">{t('show')}</a> |{' '}
            <a href="#">{t('jobs')}</a> |{' '}
            <Link to="/pricing" className="hn-nav-pricing">{t('pricing.title')}</Link>
          </nav>
        </div>
        <div className="hn-header-right">
          {credits !== undefined && (
            <span className="hn-credits">
              🎫 {credits}
            </span>
          )}
          <select
            className="hn-year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label={t('selectYear')}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            className="hn-go-btn"
            onClick={onGenerate}
            disabled={loading || !canGenerate}
          >
            {loading ? '⏳' : t('generate')}
          </button>
          <select
            className="hn-lang-select"
            value={i18n.language.split('-')[0]}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            aria-label="Language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

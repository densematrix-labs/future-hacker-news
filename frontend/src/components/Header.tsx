import { useTranslation } from 'react-i18next';

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
}

export function Header({ year, setYear, onGenerate, loading }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="hn-header">
      <div className="hn-header-inner">
        <div className="hn-header-left">
          <a href="/" className="hn-logo">
            <span className="hn-logo-box">Y</span>
          </a>
          <span className="hn-site-name">
            <strong>{t('title')}</strong>
          </span>
          <nav className="hn-nav">
            <a href="#">{t('new')}</a> |{' '}
            <a href="#">{t('past')}</a> |{' '}
            <a href="#">{t('ask')}</a> |{' '}
            <a href="#">{t('show')}</a> |{' '}
            <a href="#">{t('jobs')}</a> |{' '}
            <a href="#">{t('submit')}</a>
          </nav>
        </div>
        <div className="hn-header-right">
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
            disabled={loading}
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

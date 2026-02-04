import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { StoryList } from './components/StoryList';
import { Footer } from './components/Footer';
import { generateStories, getTrialStatus } from './services/api';
import { getDeviceId } from './lib/fingerprint';
import { useTokenStore } from './stores/tokenStore';
import type { Story } from './services/api';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [year, setYear] = useState(2035);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [hasFreeTrial, setHasFreeTrial] = useState(true);
  const { getActiveToken, updateTokenUsage, getTotalGenerations } = useTokenStore();

  useEffect(() => {
    async function init() {
      const id = await getDeviceId();
      setDeviceId(id);
      try {
        const status = await getTrialStatus(id);
        setHasFreeTrial(status.has_free_trial);
      } catch {
        // ignore
      }
    }
    init();
  }, []);

  const totalCredits = getTotalGenerations();
  const canGenerate = hasFreeTrial || totalCredits > 0;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const activeToken = getActiveToken();
      const data = await generateStories(
        year,
        i18n.language.split('-')[0],
        activeToken ? undefined : deviceId,
        activeToken?.token,
      );
      setStories(data.stories);
      setGenerated(true);

      // Update local state after usage
      if (activeToken) {
        updateTokenUsage(activeToken.token, activeToken.remaining_generations - 1);
      } else {
        setHasFreeTrial(false);
      }
    } catch (err: any) {
      if (err.status === 402) {
        setError(t('errorNeedCredits'));
        setHasFreeTrial(false);
      } else {
        setError(t('errorGenerate'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hn-page">
      <Header
        year={year}
        setYear={setYear}
        onGenerate={handleGenerate}
        loading={loading}
        canGenerate={canGenerate}
        credits={hasFreeTrial ? 1 : totalCredits}
      />
      <div className="hn-content">
        {error && <div className="hn-error">{error}</div>}
        {loading && (
          <div className="hn-loading">
            <span className="hn-spinner"></span>
            {t('generating')}
          </div>
        )}
        {!loading && generated && stories.length > 0 && (
          <StoryList stories={stories} year={year} />
        )}
        {!loading && !generated && (
          <div className="hn-welcome">
            <p>{t('subtitle', { year })}</p>
            {canGenerate ? (
              <button className="hn-generate-btn" onClick={handleGenerate}>
                {t('generate')} →
              </button>
            ) : (
              <div className="hn-need-credits">
                <p>{t('needCreditsMsg')}</p>
                <a href="/pricing" className="hn-generate-btn">
                  {t('pricing.viewPricing')} →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;

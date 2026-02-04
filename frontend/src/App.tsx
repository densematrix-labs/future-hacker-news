import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { StoryList } from './components/StoryList';
import { Footer } from './components/Footer';
import { generateStories } from './services/api';
import type { Story } from './services/api';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [year, setYear] = useState(2035);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await generateStories(year, i18n.language.split('-')[0]);
      setStories(data.stories);
      setGenerated(true);
    } catch {
      setError(t('errorGenerate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hn-page">
      <Header year={year} setYear={setYear} onGenerate={handleGenerate} loading={loading} />
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
            <button className="hn-generate-btn" onClick={handleGenerate}>
              {t('generate')} →
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;

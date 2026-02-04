import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTokenStore } from '../stores/tokenStore';
import { getTokensByDevice } from '../services/api';
import { getDeviceId } from '../lib/fingerprint';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const { addToken, tokens } = useTokenStore();
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const deviceId = await getDeviceId();
        const serverTokens = await getTokensByDevice(deviceId);

        for (const serverToken of serverTokens) {
          const exists = tokens.some((t) => t.token === serverToken.token);
          if (!exists) {
            addToken({
              token: serverToken.token,
              remaining_generations: serverToken.remaining_generations,
              expires_at: serverToken.expires_at,
            });
            setTokenValue(serverToken.token);
          }
        }

        if (!tokenValue && serverTokens.length > 0) {
          setTokenValue(serverTokens[0].token);
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTokens();
  }, [addToken, tokens]);

  const handleCopy = async () => {
    if (tokenValue) {
      await navigator.clipboard.writeText(tokenValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncate = (t: string) =>
    t.length > 24 ? `${t.slice(0, 12)}...${t.slice(-12)}` : t;

  return (
    <div className="hn-page">
      <header className="hn-header">
        <div className="hn-header-inner">
          <div className="hn-header-left">
            <Link to="/" className="hn-logo">
              <span className="hn-logo-box">Y</span>
            </Link>
            <span className="hn-site-name">
              <strong>{t('title')}</strong>
            </span>
          </div>
        </div>
      </header>

      <div className="hn-content">
        <div className="success-page">
          <div className="success-icon">✅</div>
          <h1 className="success-title">{t('payment.successTitle')}</h1>
          <p className="success-subtitle">{t('payment.successSubtitle')}</p>

          {loading ? (
            <div className="success-loading">{t('loading')}</div>
          ) : tokenValue ? (
            <div className="success-token-box">
              <p className="success-token-label">{t('payment.tokenLabel')}</p>
              <div className="success-token-row">
                <code className="success-token-value">{truncate(tokenValue)}</code>
                <button className="success-copy-btn" onClick={handleCopy}>
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              <p className="success-token-hint">{t('payment.tokenHint')}</p>
            </div>
          ) : null}

          <div className="success-actions">
            <Link to="/" className="hn-generate-btn">{t('payment.startUsing')} →</Link>
            <Link to="/pricing" className="success-back-link">{t('pricing.title')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

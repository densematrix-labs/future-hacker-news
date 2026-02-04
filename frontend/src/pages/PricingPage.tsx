import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createCheckout } from '../services/api';
import { getDeviceId } from '../lib/fingerprint';

const products = [
  {
    sku: 'future_hn_pack_3',
    generations: 3,
    price_cents: 799,
    discount_percent: null as number | null,
    popular: true,
  },
  {
    sku: 'future_hn_pack_10',
    generations: 10,
    price_cents: 1999,
    discount_percent: 25,
    popular: false,
  },
];

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PricingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handlePurchase = async (sku: string) => {
    setLoading(sku);
    setError('');
    try {
      const deviceId = await getDeviceId();
      const response = await createCheckout({
        product_sku: sku,
        device_id: deviceId,
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/pricing`,
      });
      window.location.href = response.checkout_url;
    } catch {
      setError(t('pricing.error'));
    } finally {
      setLoading(null);
    }
  };

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
            <nav className="hn-nav">
              <Link to="/">{t('nav.home')}</Link> |{' '}
              <Link to="/pricing">{t('pricing.title')}</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="hn-content">
        <div className="pricing-page">
          <h1 className="pricing-title">{t('pricing.title')}</h1>
          <p className="pricing-subtitle">{t('pricing.subtitle')}</p>

          <div className="pricing-free-note">
            🎁 {t('pricing.freeNote')}
          </div>

          {error && <div className="hn-error">{error}</div>}

          <div className="pricing-grid">
            {products.map((product) => (
              <div
                key={product.sku}
                className={`pricing-card ${product.popular ? 'pricing-card-popular' : ''}`}
              >
                {product.popular && (
                  <div className="pricing-badge">{t('pricing.popular')}</div>
                )}
                <h2 className="pricing-card-title">
                  {product.generations} {t('pricing.generations')}
                </h2>
                <div className="pricing-price">
                  {formatCurrency(product.price_cents)}
                </div>
                <div className="pricing-per-unit">
                  {formatCurrency(Math.round(product.price_cents / product.generations))}{' '}
                  / {t('pricing.perGeneration')}
                </div>
                {product.discount_percent && (
                  <div className="pricing-discount">
                    {t('pricing.save')} {product.discount_percent}%
                  </div>
                )}
                <ul className="pricing-features">
                  <li>✓ {t('pricing.feature1')}</li>
                  <li>✓ {t('pricing.feature2')}</li>
                  <li>✓ {t('pricing.feature3')}</li>
                </ul>
                <button
                  className="pricing-buy-btn"
                  disabled={loading !== null}
                  onClick={() => handlePurchase(product.sku)}
                >
                  {loading === product.sku ? '⏳ ...' : t('pricing.buyNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

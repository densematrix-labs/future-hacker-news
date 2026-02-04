import { describe, it, expect } from 'vitest';
import en from '../src/locales/en/translation.json';
import zh from '../src/locales/zh/translation.json';
import ja from '../src/locales/ja/translation.json';
import de from '../src/locales/de/translation.json';
import fr from '../src/locales/fr/translation.json';
import ko from '../src/locales/ko/translation.json';
import es from '../src/locales/es/translation.json';

const translations = { en, zh, ja, de, fr, ko, es };

describe('i18n translations', () => {
  const enKeys = Object.keys(en).sort();

  it('english translation has all required keys', () => {
    const requiredKeys = ['title', 'subtitle', 'generate', 'generating', 'points', 'by', 'comments', 'footer'];
    for (const key of requiredKeys) {
      expect(en).toHaveProperty(key);
    }
  });

  for (const [lang, trans] of Object.entries(translations)) {
    it(`${lang} translation has all keys from english`, () => {
      const langKeys = Object.keys(trans).sort();
      expect(langKeys).toEqual(enKeys);
    });

    it(`${lang} translation has no empty values`, () => {
      for (const [key, value] of Object.entries(trans)) {
        expect(value, `${lang}.${key} is empty`).toBeTruthy();
      }
    });
  }
});

import i18next from 'i18next';
import en from '../../../packages/shared/locales/en.json';
import hi from '../../../packages/shared/locales/hi.json';
import pa from '../../../packages/shared/locales/pa.json';
import mr from '../../../packages/shared/locales/mr.json';
export const simpleResources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
  mr: { translation: mr },
};
export const simpleI18n = i18next.createInstance();
void simpleI18n.init({
  lng: localStorage.getItem('khet-simple-lang') || 'en',
  fallbackLng: 'en',
  resources: simpleResources,
  interpolation: { escapeValue: false },
});
export type SimpleKey = keyof typeof en;
export const s = (key: SimpleKey) => String(simpleI18n.t(key));

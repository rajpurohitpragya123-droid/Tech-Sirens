import i18next from 'i18next';
import en from '../../../packages/shared/locales/en.json';
import hi from '../../../packages/shared/locales/hi.json';
import pa from '../../../packages/shared/locales/pa.json';
import mr from '../../../packages/shared/locales/mr.json';
const aliases = (locale: typeof en) => ({
  ...locale,
  diagnose: locale.doctor,
  bazaar: locale.prices,
  sell: locale.mandi,
  irrigation: locale.paani,
  benchmark: locale.neighbours,
  transport: locale.gaadi,
  mock: locale.demo,
  read: locale.listen,
  voice: locale.speak,
  continue: locale.next,
  skip: locale.notNow,
  queued: locale.sync,
  advice: locale.paaniHint,
  photo: locale.cameraTitle,
  permission: locale.takePhoto,
  capture: locale.takePhoto,
  result: locale.sample,
  consent: locale.privacy,
  name: locale.demo,
  village: locale.location,
  role: locale.demo,
  phone: locale.phoneHint,
  otp: locale.demo,
  send: locale.next,
  verify: locale.next,
  welcome: locale.languageHint,
  voiceHint: locale.voiceFailed,
});
void i18next.init({
  lng: 'hi',
  fallbackLng: 'en',
  resources: {
    en: { translation: aliases(en) },
    hi: { translation: aliases(hi) },
    pa: { translation: aliases(pa) },
    mr: { translation: aliases(mr) },
  },
});
export const t = (key: string) => String(i18next.t(key));
export default i18next;

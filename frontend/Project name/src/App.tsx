import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  AudioLines,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CloudSun,
  Droplets,
  FlaskConical,
  HelpCircle,
  Home,
  LandPlot,
  Leaf,
  MapPin,
  Menu,
  Mic,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sprout,
  Sun,
  Tractor,
  Truck,
  Volume2,
  Wallet,
  Wheat,
  Wind,
  X,
  Camera,
  Recycle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Star,
  SlidersHorizontal,
  ChartNoAxesCombined,
  Package,
  CloudRain,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import i18n, { t } from './i18n';
import { useFarm } from './store';
import { buyers, lands, mandis, products, vehicles } from './data';
import {
  aboveGovernmentRate,
  benchmark,
  dose,
  irrigationDecision,
  matchingBuyers,
  rankInputs,
  splitFare,
  stubbleEstimate,
} from '../../../packages/shared/domain.mjs';

type Route =
  | 'home'
  | 'diagnose'
  | 'bazaar'
  | 'irrigation'
  | 'benchmark'
  | 'sell'
  | 'transport'
  | 'parali'
  | 'land'
  | 'wallet'
  | 'settings'
  | 'help';
type Modal = 'voice' | 'pledge' | 'diary' | 'notifications' | 'forecast' | 'voucher' | null;
const nav: { id: Route; icon: LucideIcon }[] = [
  { id: 'home', icon: Home },
  { id: 'diagnose', icon: Sprout },
  { id: 'bazaar', icon: ShoppingBag },
  { id: 'irrigation', icon: Droplets },
  { id: 'benchmark', icon: BookOpen },
  { id: 'sell', icon: Wheat },
  { id: 'transport', icon: Truck },
  { id: 'parali', icon: Recycle },
  { id: 'land', icon: LandPlot },
  { id: 'wallet', icon: Wallet },
];
const actions: { id: Route; key: string; icon: LucideIcon; color: string }[] = [
  { id: 'diagnose', key: 'diagnoseShort', icon: Sprout, color: 'green' },
  { id: 'bazaar', key: 'bazaarShort', icon: ShoppingBag, color: 'orange' },
  { id: 'sell', key: 'sellShort', icon: Wheat, color: 'yellow' },
  { id: 'irrigation', key: 'irrigationShort', icon: Droplets, color: 'blue' },
  { id: 'parali', key: 'paraliShort', icon: Recycle, color: 'green' },
  { id: 'transport', key: 'transportShort', icon: Truck, color: 'purple' },
  { id: 'benchmark', key: 'benchmarkShort', icon: ChartNoAxesCombined, color: 'pink' },
  { id: 'land', key: 'landShort', icon: LandPlot, color: 'sand' },
];
const rupee = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: v % 1 ? 1 : 0,
  }).format(v);
const photo = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const Button = ({
  children,
  onClick,
  secondary = false,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`${secondary ? 'btn secondary' : 'btn'} ${className}`}
  >
    {children}
  </button>
);
const Badge = ({ children, color = 'green' }: { children: ReactNode; color?: string }) => (
  <span className={`badge ${color}`}>{children}</span>
);
const SectionTitle = ({
  title,
  sub,
  action,
  onClick,
}: {
  title: string;
  sub?: string;
  action?: string;
  onClick?: () => void;
}) => (
  <div className="section-title">
    <div>
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
    {action && (
      <button className="text-link" onClick={onClick}>
        {action}
        <ArrowUpRight size={16} />
      </button>
    )}
  </div>
);

export default function App() {
  const [route, setRoute] = useState<Route>(() => (location.hash.slice(1) as Route) || 'home');
  const [lang, setLang] = useState(i18n.language);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [search, setSearch] = useState('');
  const [voice, setVoice] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [category, setCategory] = useState('all');
  const [radius, setRadius] = useState(10);
  const [productSearch, setProductSearch] = useState('');
  const [minPrice, setMinPrice] = useState(2500);
  const [quantity, setQuantity] = useState(20);
  const [weight, setWeight] = useState(1500);
  const [compare, setCompare] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [diagnosed, setDiagnosed] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [crop, setCrop] = useState('tomato');
  const [valve, setValve] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [dayMinutes, setDayMinutes] = useState(0);
  const [area, setArea] = useState(2.5);
  const [rate, setRate] = useState(0.5);
  const [doseResult, setDoseResult] = useState('');
  const [voucher, setVoucher] = useState(false);
  const farm = useFarm();
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const notify = (message: string) => setToast(message);
  const go = (id: Route) => {
    setRoute(id);
    location.hash = id;
    setSidebar(false);
    setSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mainRef.current?.focus();
  };
  useEffect(() => {
    const onHash = () => {
      const r = location.hash.slice(1) as Route;
      if (nav.some((n) => n.id === r) || ['settings', 'help'].includes(r)) setRoute(r);
    };
    const onNet = () => setOnline(navigator.onLine);
    addEventListener('hashchange', onHash);
    addEventListener('online', onNet);
    addEventListener('offline', onNet);
    return () => {
      removeEventListener('hashchange', onHash);
      removeEventListener('online', onNet);
      removeEventListener('offline', onNet);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
      if (e.key === 'Tab') {
        const els = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      previous?.focus();
    };
  }, [modal]);
  useEffect(() => {
    if (!valve) return;
    const timer = setInterval(() => {
      const minutes = (Date.now() - startedAt) / 60000;
      const result = irrigationDecision({
        telemetryAgeMinutes: 0,
        sessionMinutes: minutes,
        dayMinutes: dayMinutes + minutes,
        manual: 'ON',
        moisture: 31,
        target: 45,
        threshold: 35,
        rainProbability: 10,
        insidePowerSlot: true,
      });
      if (result.valve === 'OFF') {
        setValve(false);
        setDayMinutes((v) => v + minutes);
        notify(result.reason);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [valve, startedAt, dayMinutes]);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image);
    },
    [image],
  );
  function changeLanguage(value: string) {
    void i18n.changeLanguage(value).then(() => {
      setLang(value);
      localStorage.setItem('khet-language', value);
      document.documentElement.lang = value;
    });
  }
  function read(text: string) {
    if (!('speechSynthesis' in window)) {
      notify(t('voiceUnavailable'));
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    speechSynthesis.speak(u);
  }
  function routeIntent(text: string) {
    const q = text.toLowerCase();
    const rules: [RegExp, Route][] = [
      [/parali|stubble|पराली|पुआल/, 'parali'],
      [/sell|buyer|price|बेच|भाव/, 'sell'],
      [/water|irrigat|pump|सिंचाई|पानी/, 'irrigation'],
      [/disease|diagnos|leaf|रोग|बीमारी/, 'diagnose'],
      [/buy|seed|bazaar|खाद|बीज|दवाई/, 'bazaar'],
      [/transport|truck|गाड़ी/, 'transport'],
      [/land|rent|किराया/, 'land'],
      [/credit|wallet|बटुआ/, 'wallet'],
      [/diary|neighbour|डायरी|पड़ोस/, 'benchmark'],
    ];
    const found = rules.find(([r]) => r.test(q));
    if (found) {
      go(found[1]);
      setModal(null);
      setVoice('');
    } else notify(t('empty'));
  }
  function record() {
    const W = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
      };
    };
    const Recognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus(t('voiceUnavailable'));
      return;
    }
    const r = new Recognition();
    r.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    r.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      setVoice(text);
      setVoiceStatus('');
    };
    r.onerror = () => setVoiceStatus(t('voiceUnavailable'));
    r.onend = () => setVoiceStatus('');
    setVoiceStatus(t('listening'));
    try {
      r.start();
    } catch {
      setVoiceStatus(t('voiceUnavailable'));
    }
  }
  function pledgeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    farm.addPledge(
      String(f.get('date')),
      String(f.get('access')),
      stubbleEstimate('wheat', 2.5, 18).quintals,
    );
    setModal(null);
    notify(t('pledgeDone'));
  }
  function diarySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    farm.addEntry(String(f.get('type')), String(f.get('note')));
    setModal(null);
    notify(t('synced'));
  }
  function book(kind: string, id: string) {
    farm.enqueue(kind, { id, date: new Date().toISOString() });
    notify(t('interestSaved'));
  }
  const matches = matchingBuyers(buyers, minPrice, quantity);
  const peerData = Array.from({ length: 12 }, (_, i) => ({
    yield: 17 + i * 0.8,
    sowingDays: i < 3 ? 2 : 8,
    fertiliserSplits: i < 3 ? 2 : 1,
  }));
  const insight = benchmark(peerData, { sowingDays: 12, fertiliserSplits: 1 }, farm.optIn);
  const filtered = rankInputs(
    products.filter((p) => (category === 'all' || p.category === category) && p.distance <= radius),
    productSearch,
  );
  const titleMap: Record<Route, [string, string]> = {
    home: ['overview', 'overviewSub'],
    diagnose: ['diagnosisTitle', 'diagnosisSub'],
    bazaar: ['bazaarTitle', 'bazaarSub'],
    irrigation: ['irrigationTitle', 'irrigationSub'],
    benchmark: ['benchmarkHeading', 'benchmarkSub'],
    sell: ['sellTitle', 'sellSub'],
    transport: ['transportTitle', 'transportSub'],
    parali: ['paraliHeading', 'paraliSub'],
    land: ['landTitle', 'landSub'],
    wallet: ['walletTitle', 'walletSub'],
    settings: ['language', 'languageSub'],
    help: ['help', 'support'],
  };

  function YieldChart({ large = false }: { large?: boolean }) {
    return (
      <div className={`yield-chart ${large ? 'large' : ''}`}>
        <div className="bar-row">
          <span>{t('yourFarm')}</span>
          <div className="bar-track">
            <div style={{ width: '64%' }} className="yield-bar own">
              18 <small>{t('yieldUnit')}</small>
            </div>
          </div>
        </div>
        <div className="bar-row">
          <span>{t('nearbyTop')}</span>
          <div className="bar-track">
            <div style={{ width: '91%' }} className="yield-bar top">
              25.0 <small>{t('yieldUnit')}</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function Timeline() {
    return (
      <div className="timeline">
        {[
          ...farm.entries.slice(0, 3).map((e) => ({
            title: e.note || e.type,
            date: new Date(e.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN'),
            icon: BookOpen,
          })),
          { title: t('activity1'), date: t('activityDate1'), icon: Droplets },
          { title: t('activity2'), date: t('activityDate2'), icon: Sprout },
          { title: t('activity3'), date: t('activityDate3'), icon: FlaskConical },
        ]
          .slice(0, 4)
          .map((a, i) => (
            <div className="timeline-item" key={i}>
              <span className="timeline-icon">
                <a.icon size={17} />
              </span>
              <div>
                <strong>{a.title}</strong>
                <p>{a.date}</p>
              </div>
              <Check size={14} />
            </div>
          ))}
      </div>
    );
  }
  function HomeScreen() {
    return (
      <>
        <div className="hero-grid">
          <section className="hero">
            <img
              src={photo('photo-1500382017468-9049fed747ef', 1400)}
              alt="Sunlit green fields in the countryside"
            />
            <div className="hero-shade" />
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="live-dot" />
                {t('today')}
              </span>
              <h2>{t('heroTitle')}</h2>
              <p>{t('heroText')}</p>
              <button className="hero-button" onClick={() => go('benchmark')}>
                {t('viewFarm')}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="field-pill">
              <Wheat size={17} />
              <span>{t('fieldStage')}</span>
            </div>
          </section>
          <section className="weather-card card">
            <div className="card-top">
              <span>
                <MapPin size={14} />
                {t('village')}
              </span>
              <span className="tiny">{t('estimated')}</span>
            </div>
            <div className="weather-main">
              <div>
                <strong>
                  28<span>°C</span>
                </strong>
                <p>{t('sunny')}</p>
              </div>
              <div className="weather-art">
                <Sun size={70} strokeWidth={1.4} />
                <CloudSun className="weather-cloud" size={65} strokeWidth={1.4} />
              </div>
            </div>
            <div className="weather-details">
              <div>
                <Droplets size={15} />
                <b>62%</b>
                <span>{t('humidity')}</span>
              </div>
              <div>
                <Wind size={15} />
                <b>8 km/h</b>
                <span>{t('wind')}</span>
              </div>
              <div>
                <CloudRain size={15} />
                <b>10%</b>
                <span>{t('rain')}</span>
              </div>
            </div>
            <button className="weather-footer" onClick={() => setModal('forecast')}>
              {t('forecast')}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
        <section className="quick-section">
          <SectionTitle title={t('quickActions')} sub={t('quickSub')} />
          <div className="quick-actions">
            {actions.map((a) => (
              <button className="quick-action" key={a.id} onClick={() => go(a.id)}>
                <span className={`action-icon ${a.color}`}>
                  <a.icon size={25} strokeWidth={1.7} />
                </span>
                <span>{t(a.key)}</span>
              </button>
            ))}
          </div>
        </section>
        <div className="attention-strip">
          <div className="strip-icon">
            <Droplets size={23} />
          </div>
          <div>
            <div className="strip-heading">
              <strong>{t('irrigate')}</strong>
              <Badge color="blue">{t('field')}</Badge>
            </div>
            <p>{t('irrigateText')}</p>
          </div>
          <button className="text-link" onClick={() => go('irrigation')}>
            {t('seeAdvice')}
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="feature-grid">
          <section className="parali-card">
            <div className="parali-copy">
              <span className="eyebrow">{t('impact')}</span>
              <h2>{t('paraliTitle')}</h2>
              <p>{t('paraliText')}</p>
              <button className="btn earthy" onClick={() => setModal('pledge')}>
                {t('pledge')}
                <ArrowUpRight size={17} />
              </button>
              <div className="impact-counter">
                <span className="small-leaf">
                  <Leaf size={15} />
                </span>
                <b>24.8</b>
                <span>{t('villageImpact')}</span>
              </div>
            </div>
            <div className="parali-art">
              <img
                src={photo('photo-1574323347407-f5e1ad6d020b', 650)}
                alt="Golden harvested wheat"
              />
              <div className="recycle-stamp">
                <Recycle size={30} />
                <span>GROW • GIVE • GROW</span>
              </div>
              <div className="credit-tag">
                <Leaf size={14} />
                <span>Residue → resources</span>
              </div>
            </div>
          </section>
          <section className="benchmark-card card">
            <div className="card-label">
              <span className="mini-icon">
                <ChartNoAxesCombined size={17} />
              </span>
              <span>PADOSI BENCHMARK</span>
              <span className="dots">•••</span>
            </div>
            <h2>{t('benchmarkTitle')}</h2>
            <p>{t('benchmarkText')}</p>
            {farm.optIn ? <YieldChart /> : <p className="notice">{t('privacy')}</p>}
            <div className="anonymous">
              <ShieldCheck size={13} />
              {t('pattern')}
            </div>
            <button className="text-link" onClick={() => go('benchmark')}>
              {t('seeBenchmark')}
              <ArrowRight size={16} />
            </button>
          </section>
        </div>
        <div className="bottom-grid">
          <section className="card mandi-card">
            <SectionTitle
              title={t('mandiTitle')}
              sub={t('mandiSub')}
              action={t('viewPrices')}
              onClick={() => go('sell')}
            />
            <table>
              <thead>
                <tr>
                  <th>{t('market')}</th>
                  <th>{t('modalPrice')}</th>
                  <th>{t('trend')}</th>
                  <th aria-label="Price chart" />
                </tr>
              </thead>
              <tbody>
                {mandis.map((m) => (
                  <tr key={m.name}>
                    <td>
                      <strong>{m.name}</strong>
                      <span>
                        {m.distance} · {t('estimated')}
                      </span>
                    </td>
                    <td>
                      <b>{rupee(m.price)}</b>
                    </td>
                    <td className={m.change > 0 ? 'positive' : 'negative'}>
                      {m.change > 0 ? '↗' : '↘'} {Math.abs(m.change)}%
                    </td>
                    <td>
                      <svg
                        viewBox="0 0 80 32"
                        width="74"
                        height="32"
                        aria-label={`${m.change}% sample price trend`}
                      >
                        <polyline
                          points={m.points}
                          fill="none"
                          stroke={m.change > 0 ? '#698f51' : '#c98765'}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="data-note">
              <Clock size={12} />
              Seeded snapshot · 18 Oct 2026 · not live market data
            </div>
          </section>
          <section className="card notebook-card">
            <SectionTitle
              title={t('recent')}
              action={t('viewAll')}
              onClick={() => go('benchmark')}
            />
            <Timeline />
          </section>
        </div>
        <section className="voice-banner">
          <div className="voice-symbol">
            <AudioLines size={29} />
          </div>
          <div>
            <h3>{t('voiceTitle')}</h3>
            <p>{t('voiceSub')}</p>
          </div>
          <button onClick={() => setModal('voice')}>
            <Mic size={17} />
            {t('voiceAction')}
            <ArrowUpRight size={16} />
          </button>
        </section>
      </>
    );
  }

  function Screen() {
    switch (route) {
      case 'home':
        return <HomeScreen />;
      case 'diagnose':
        return (
          <div className="two-column">
            <section className="card content-card">
              <span className="step-label">01 / {t('crop')}</span>
              <label>
                {t('crop')}
                <select
                  value={crop}
                  onChange={(e) => {
                    setCrop(e.target.value);
                    setDiagnosed(false);
                  }}
                >
                  {[
                    'wheat',
                    'rice',
                    'maize',
                    'tomato',
                    'potato',
                    'onion',
                    'cotton',
                    'sugarcane',
                    'mustard',
                    'chilli',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={`upload-zone ${image ? 'has-image' : ''}`}
                onClick={() => fileRef.current?.click()}
              >
                {image ? (
                  <img src={image} alt="Selected crop leaf" />
                ) : (
                  <>
                    <Camera size={44} strokeWidth={1.3} />
                    <strong>{t('upload')}</strong>
                    <span>{t('photoTip')}</span>
                  </>
                )}
              </button>
              <input
                className="visually-hidden"
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 12 * 1024 * 1024) {
                      notify('Please choose an image under 12 MB.');
                      return;
                    }
                    setImage(URL.createObjectURL(f));
                    setDiagnosed(false);
                  }
                }}
              />
              <Button
                disabled={!image || diagnosing}
                onClick={() => {
                  setDiagnosing(true);
                  setTimeout(() => {
                    setDiagnosed(true);
                    setDiagnosing(false);
                    farm.enqueue('diagnosis', {
                      crop,
                      mode: 'mock',
                      timestamp: new Date().toISOString(),
                    });
                  }, 800);
                }}
              >
                {diagnosing ? '…' : t('analyze')}
                <Sprout size={18} />
              </Button>
              <p className="notice">{t('mockDiagnosis')}</p>
            </section>
            <section className="card content-card">
              {diagnosed ? (
                <>
                  <Badge color="orange">78% · sample confidence</Badge>
                  <h2>{t('result')}</h2>
                  <p>{t('resultText')}</p>
                  <div className="advice-box">
                    <Leaf size={24} />
                    <div>
                      <h3>{t('organic')}</h3>
                      <p>{t('organicText')}</p>
                    </div>
                  </div>
                  <p className="notice">
                    Sample alternatives: healthy 14% · unknown 8%. Not computed from this image.
                  </p>
                  <div className="button-row">
                    <Button
                      onClick={() => {
                        setCategory('protection');
                        go('bazaar');
                      }}
                    >
                      {t('treatment')}
                    </Button>
                    <Button
                      secondary
                      onClick={() => {
                        farm.enqueue('expert-review', { crop, mode: 'mock' });
                        notify(t('expertDone'));
                      }}
                    >
                      {t('expert')}
                    </Button>
                  </div>
                  <button className="text-link" onClick={() => read(t('resultText'))}>
                    <Volume2 size={18} />
                    {t('readAloud')}
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <Sprout size={60} strokeWidth={1} />
                  <h2>{t('diagnosisSub')}</h2>
                  <p>{t('photoTip')}</p>
                  <Badge>{t('mockDiagnosis')}</Badge>
                </div>
              )}
            </section>
          </div>
        );
      case 'bazaar':
        return (
          <>
            <div className="filter-bar card">
              <label className="search-field">
                <Search size={18} />
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t('productSearch')}
                />
              </label>
              <select
                aria-label="Search radius"
                value={radius}
                onChange={(e) => setRadius(+e.target.value)}
              >
                {[5, 10, 25].map((n) => (
                  <option key={n} value={n}>
                    {n} km
                  </option>
                ))}
              </select>
              <SlidersHorizontal size={20} />
            </div>
            <div className="tab-row">
              {['all', 'protection', 'seed', 'fertiliser', 'manure'].map((c) => (
                <button
                  key={c}
                  className={category === c ? 'active' : ''}
                  onClick={() => setCategory(c)}
                >
                  {t(c)}
                </button>
              ))}
            </div>
            <p className="notice inline">
              <ShieldCheck size={15} />
              {t('neutral')}
            </p>
            <div className="product-grid">
              {filtered.map((p) => (
                <article className="card product-card" key={p.id}>
                  <div className="product-visual" style={{ background: p.color }}>
                    <span>{p.icon}</span>
                    <Badge>
                      <ShieldCheck size={12} />
                      {t('verified')}
                    </Badge>
                  </div>
                  <div className="product-info">
                    <span className="eyebrow">{t(p.category)}</span>
                    <h3>{p.name}</h3>
                    <p>
                      {p.pack} · {p.seller}
                    </p>
                    <div className="product-meta">
                      <span>
                        <MapPin size={13} />
                        {p.distance} {t('distance')}
                      </span>
                      <span>
                        <Star size={13} />
                        {p.rating}
                      </span>
                    </div>
                    <div className="price-row">
                      <strong>{rupee(p.price)}</strong>
                      <span>
                        {rupee(p.price / p.units)} {t('unitPrice')}
                      </span>
                    </div>
                    {p.mrp && (
                      <div className="warning">
                        <span>{aboveGovernmentRate(p.price, p.mrp) ? t('mrp') : ''}</span>
                        <small>
                          MRP {rupee(p.mrp)} · {t('reference')}
                        </small>
                      </div>
                    )}
                    <Button
                      secondary
                      onClick={() => {
                        farm.addOrder(p.name, p.price);
                        notify(t('added'));
                      }}
                    >
                      {t('order')}
                      <Plus size={16} />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && <p className="card content-card">{t('empty')}</p>}
            <div className="two-column spaced">
              <section className="card content-card">
                <h2>{t('dose')}</h2>
                <p>{t('doseNote')}</p>
                <div className="two-column">
                  <label>
                    Acres
                    <input
                      type="number"
                      min=".1"
                      step=".1"
                      value={area}
                      onChange={(e) => setArea(+e.target.value)}
                    />
                  </label>
                  <label>
                    Label dose / acre (kg)
                    <input
                      type="number"
                      min=".01"
                      step=".1"
                      value={rate}
                      onChange={(e) => setRate(+e.target.value)}
                    />
                  </label>
                </div>
                <Button
                  secondary
                  onClick={() => {
                    try {
                      const d = dose(area, rate, 1);
                      setDoseResult(`${d.quantity} kg · ${d.packs} × 1 kg packs`);
                    } catch {
                      notify('Enter positive quantities.');
                    }
                  }}
                >
                  {t('calculate')}
                </Button>
                {doseResult && <div className="result-number">{doseResult}</div>}
              </section>
              <section className="card content-card">
                <h2>{t('orderHistory')}</h2>
                {farm.orders.length ? (
                  farm.orders.map((o) => (
                    <div className="ledger-row" key={o.id}>
                      <Package size={20} />
                      <div>
                        <strong>{o.name}</strong>
                        <p>{o.status} · pay at pickup</p>
                      </div>
                      <b>{rupee(o.price)}</b>
                    </div>
                  ))
                ) : (
                  <p>{t('noOrders')}</p>
                )}
              </section>
            </div>
          </>
        );
      case 'irrigation':
        return (
          <>
            <div className="two-column">
              <section className="card content-card">
                <Badge color="blue">{t('field')}</Badge>
                <h2>{t('irrigate')}</h2>
                <p>{t('irrigateText')}</p>
                <div className="water-gauge">
                  <Droplets size={44} />
                  <strong>
                    31<span>%</span>
                  </strong>
                  <span>{t('moisture')} · simulated</span>
                </div>
                <div className="stats-three">
                  <div>
                    <b>4.2 mm</b>
                    <span>ET₀ / day</span>
                  </div>
                  <div>
                    <b>0.7</b>
                    <span>Crop Kc</span>
                  </div>
                  <div>
                    <b>10%</b>
                    <span>{t('rain')}</span>
                  </div>
                </div>
                <p>
                  {t('confidence')} · {t('power')}
                </p>
                <button className="text-link" onClick={() => read(t('irrigateText'))}>
                  <Volume2 size={18} />
                  {t('readAloud')}
                </button>
                <h3>{t('feedback')}</h3>
                <div className="button-row">
                  {['wet', 'fine', 'dry'].map((s) => (
                    <Button
                      secondary
                      key={s}
                      onClick={() => {
                        farm.addEntry('irrigation', `Field feedback: ${s}`);
                        notify(t('feedbackSaved'));
                      }}
                    >
                      {t(s)}
                    </Button>
                  ))}
                </div>
              </section>
              <section className="card content-card">
                <div className="card-top">
                  <h2>{t('controller')}</h2>
                  <Badge color={valve ? 'green' : 'sand'}>
                    {valve ? t('valveOn') : t('valveOff')}
                  </Badge>
                </div>
                <div className={`controller-art ${valve ? 'running' : ''}`}>
                  <Droplets size={64} strokeWidth={1.2} />
                  <span>{valve ? 'ON' : 'OFF'}</span>
                </div>
                <Button
                  className={valve ? 'danger' : ''}
                  onClick={() => {
                    if (valve) {
                      setDayMinutes((d) => d + (Date.now() - startedAt) / 60000);
                      setValve(false);
                      farm.addEntry('irrigation', 'Demo manual stop');
                    } else {
                      const decision = irrigationDecision({
                        telemetryAgeMinutes: 0,
                        sessionMinutes: 0,
                        dayMinutes,
                        manual: 'ON',
                        moisture: 31,
                        target: 45,
                        threshold: 35,
                        rainProbability: 10,
                        insidePowerSlot: true,
                      });
                      if (decision.valve === 'ON') {
                        setValve(true);
                        setStartedAt(Date.now());
                        farm.addEntry('irrigation', 'Demo manual start');
                      } else notify(decision.reason);
                    }
                  }}
                >
                  {valve ? t('stop') : t('start')}
                  <Droplets size={18} />
                </Button>
                <p className="notice">{t('sensorNote')}</p>
                <div className="safety-note">
                  <ShieldCheck size={20} />
                  {t('safety')}
                </div>
                <button
                  className="text-link"
                  onClick={() => {
                    farm.enqueue('installation', { package: '2 sensor starter' });
                    notify(t('installSaved'));
                  }}
                >
                  {t('buyIot')}
                  <ArrowRight size={16} />
                </button>
              </section>
            </div>
          </>
        );
      case 'benchmark':
        return (
          <>
            <div className="card consent-card">
              <ShieldCheck size={25} />
              <div>
                <strong>{t('optIn')}</strong>
                <p>{t('privacy')}</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={farm.optIn}
                  onChange={(e) => farm.setOptIn(e.target.checked)}
                  aria-label={t('optIn')}
                />
                <span />
              </label>
            </div>
            <div className="two-column spaced">
              <section className="card content-card">
                <h2>{t('yield')}</h2>
                {insight ? (
                  <>
                    <YieldChart large />
                    <p>{t('pattern')}</p>
                    <div className="advice-box">
                      <Sprout size={23} />
                      <div>
                        <h3>{t('gaps')}</h3>
                        <p>{t('gap1')}</p>
                        <p>{t('gap2')}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <ShieldCheck size={48} />
                    <p>{t('privacy')}</p>
                  </div>
                )}
              </section>
              <section className="card content-card">
                <SectionTitle
                  title={t('diary')}
                  action={t('addEntry')}
                  onClick={() => setModal('diary')}
                />
                <Timeline />
                <Button secondary onClick={() => setModal('diary')}>
                  <Plus size={17} />
                  {t('addEntry')}
                </Button>
              </section>
            </div>
          </>
        );
      case 'sell':
        return (
          <>
            <div className="card filter-bar sell-filter">
              <label>
                {t('crop')}
                <select>
                  <option>Wheat · गेहूँ</option>
                </select>
              </label>
              <label>
                {t('minimum')}
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.max(0, +e.target.value))}
                />
              </label>
              <label>
                {t('quantity')}
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, +e.target.value))}
                />
              </label>
              <Badge>
                {matches.length} {t('matching')}
              </Badge>
            </div>
            <SectionTitle title={t('matching')} sub={t('breakdown')} />
            {!matches.length && (
              <section className="card content-card">
                <h3>{t('noBuyers')}</h3>
                <Button
                  onClick={() => {
                    farm.enqueue('price-alert', { minPrice, quantity, crop: 'wheat' });
                    notify(t('alertSaved'));
                  }}
                >
                  {t('saveAlert')}
                  <Bell size={17} />
                </Button>
                <p className="notice">
                  Closest below your minimum:{' '}
                  {buyers.toSorted((a, b) => b.price - a.price)[0]?.name} · {rupee(2700)} / quintal
                </p>
              </section>
            )}
            <div className="buyer-list">
              {matches.map((b, i) => (
                <article className="card buyer-card" key={b.id}>
                  <div className="buyer-avatar">
                    <Wheat size={28} />
                  </div>
                  <div className="buyer-description">
                    <div className="buyer-name">
                      <h3>{b.name}</h3>
                      <Badge>
                        <ShieldCheck size={12} />
                        {t('verified')}
                      </Badge>
                      {i === 0 && <Badge color="orange">Highest net earning</Badge>}
                    </div>
                    <p>
                      <MapPin size={13} />
                      {b.distance} {t('distance')} ·{' '}
                      {b.pickup ? 'Pickup available' : 'Delivery required'}
                    </p>
                    <details>
                      <summary>{t('breakdown')}</summary>
                      <p>
                        Gross {rupee(b.price * quantity)} − transport {rupee(b.transport)} − fees{' '}
                        {rupee(b.fees)} − loading {rupee(b.loading)}
                      </p>
                    </details>
                  </div>
                  <div className="buyer-price">
                    <span>{t('offer')}</span>
                    <strong>{rupee(b.price)}</strong>
                  </div>
                  <div className="net-price">
                    <span>{t('net')}</span>
                    <strong>{rupee(b.net)}</strong>
                    <Button onClick={() => book('buyer-interest', b.id)}>
                      {t('accept')}
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <section className="spaced">
              <SectionTitle title={t('coldStorage')} sub={t('coldNote')} />
              <div className="three-column">
                {['Meerut Cold Chain', 'Kisan Fresh Storage', 'Mawana Agro Store'].map(
                  (name, i) => (
                    <article className="card content-card" key={name}>
                      <Badge>{t('verified')}</Badge>
                      <h3>{name}</h3>
                      <p>
                        {[6, 12, 18][i]} km · Potato, onion · {[40, 80, 25][i]} t available
                      </p>
                      <strong>{rupee([180, 200, 190][i]!)}/quintal/season</strong>
                      <p className="notice">
                        Demo notified rate reference · 01 Oct 2026 · authority verification pending
                      </p>
                      <Button secondary onClick={() => book('storage-booking', name)}>
                        {t('storageBook')}
                      </Button>
                    </article>
                  ),
                )}
              </div>
            </section>
          </>
        );
      case 'transport':
        return (
          <>
            <section className="card filter-bar">
              <label>
                From
                <input value="Rampur · Field 01" readOnly />
              </label>
              <ArrowRight size={20} />
              <label>
                To
                <select>
                  <option>Meerut Mandi · 8.2 km</option>
                </select>
              </label>
              <label>
                {t('weight')}
                <input
                  type="number"
                  min="1"
                  value={weight}
                  onChange={(e) => setWeight(Math.max(1, +e.target.value))}
                />
              </label>
            </section>
            <div className="three-column spaced">
              {vehicles
                .filter((v) => v.capacity >= weight)
                .map((v) => (
                  <article className="card content-card vehicle-card" key={v.id}>
                    <div className="vehicle-visual">
                      <Truck size={60} strokeWidth={1} />
                    </div>
                    {v.returnTrip ? (
                      <Badge color="orange">{t('returnTrip')}</Badge>
                    ) : (
                      <Badge>{t('verified')}</Badge>
                    )}
                    <h2>{v.name}</h2>
                    <p>
                      {v.driver} · ★ {v.rating}
                    </p>
                    <p>{v.number}</p>
                    <div className="ledger-row">
                      <span>{v.capacity} kg capacity</span>
                      <strong>{rupee(v.fare)}</strong>
                    </div>
                    <p className="notice">
                      {t('estimated')} · {rupee(v.fare / weight)} / kg · transporter confirmation
                      required
                    </p>
                    <Button onClick={() => book('transport-booking', v.id)}>
                      {t('book')}
                      <ArrowRight size={17} />
                    </Button>
                  </article>
                ))}
            </div>
            {!vehicles.some((v) => v.capacity >= weight) && (
              <p className="card content-card">{t('empty')}</p>
            )}
            <div className="card content-card spaced">
              <h2>{t('shared')}</h2>
              <p>
                {t('split')} · {weight} kg + 500 kg
              </p>
              <strong>{splitFare(850, [weight, 500]).map(rupee).join(' + ')}</strong>
              <p className="notice">
                Estimated only · shared trips require acceptance by every participant.
              </p>
            </div>
          </>
        );
      case 'parali':
        return (
          <>
            <section className="parali-wide">
              <img src={photo('photo-1574323347407-f5e1ad6d020b', 1200)} alt="Harvested wheat" />
              <div>
                <span className="eyebrow">PARALI BADLO</span>
                <h2>{t('paraliTitle')}</h2>
                <p>{t('paraliText')}</p>
                <Button onClick={() => setModal('pledge')}>
                  {t('pledge')}
                  <ArrowUpRight size={18} />
                </Button>
              </div>
            </section>
            <div className="stats-grid spaced">
              <div className="card stat-card">
                <Recycle />
                <strong>24.8 t</strong>
                <span>{t('villageImpact')}</span>
              </div>
              <div className="card stat-card">
                <Tractor />
                <strong>12</strong>
                <span>Village pledges · sample</span>
              </div>
              <div className="card stat-card">
                <Wallet />
                <strong>₹1,200</strong>
                <span>{t('balance')} · sample</span>
              </div>
            </div>
            <div className="two-column spaced">
              <section className="card content-card">
                <h2>{t('journey')}</h2>
                <ol className="steps">
                  {['step1', 'step2', 'step3', 'step4'].map((s, i) => (
                    <li key={s}>
                      <span>{i + 1}</span>
                      <strong>{t(s)}</strong>
                    </li>
                  ))}
                </ol>
                <p className="safety-note">
                  <ShieldCheck size={20} />
                  {t('creditRule')}
                </p>
              </section>
              <section className="card content-card">
                <SectionTitle
                  title={t('pledges')}
                  action={t('pledge')}
                  onClick={() => setModal('pledge')}
                />
                {farm.pledges.map((p) => (
                  <div className="pledge-row" key={p.id}>
                    <Recycle size={24} />
                    <div>
                      <strong>Wheat · Field 01 · {p.quintals} q estimate</strong>
                      <p>
                        {p.date} · {p.access}
                      </p>
                      <Badge color="orange">{t('pending')}</Badge>
                    </div>
                  </div>
                ))}
                <div className="pledge-row">
                  <CheckCircle2 size={24} />
                  <div>
                    <strong>Wheat · 30 quintals collected</strong>
                    <p>Demo collection · 20 Apr 2026</p>
                    <Badge>{t('completed')}</Badge>
                  </div>
                  <strong>₹1,200</strong>
                </div>
              </section>
            </div>
          </>
        );
      case 'land':
        return (
          <>
            <div className="notice legal">
              <ShieldCheck size={20} />
              {t('legal')}
            </div>
            <div className="tab-row">
              <span className="badge">Meerut · within 10 km</span>
              <span className="badge sand">Rabi 2026–27</span>
              <span className="badge sand">Sorted by rent, then distance</span>
            </div>
            <div className="three-column">
              {lands
                .toSorted((a, b) => a.rent - b.rent || a.distance - b.distance)
                .map((l) => (
                  <article className="card land-card" key={l.id}>
                    <img src={photo(l.image, 600)} alt={l.name} />
                    <div className="content-card">
                      <Badge>
                        <ShieldCheck size={12} />
                        {t('verified')}
                      </Badge>
                      <h2>{l.name}</h2>
                      <p>
                        <MapPin size={14} />
                        {l.village} · {l.distance} km
                      </p>
                      <div className="land-details">
                        <span>{l.area} acres</span>
                        <span>{l.soil}</span>
                        <span>{l.water}</span>
                      </div>
                      <strong className="land-price">
                        {rupee(l.rent)}
                        <small> {t('rent')}</small>
                      </strong>
                      <div className="button-stack">
                        <Button onClick={() => book('land-interest', l.id)}>
                          {t('connect')}
                          <ArrowRight size={16} />
                        </Button>
                        <Button
                          secondary
                          onClick={() =>
                            setCompare((a) =>
                              a.includes(l.id)
                                ? a.filter((id) => id !== l.id)
                                : a.length < 3
                                  ? [...a, l.id]
                                  : a,
                            )
                          }
                        >
                          {compare.includes(l.id) ? <Check size={16} /> : <Plus size={16} />}{' '}
                          {t('compare')}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
            {compare.length > 0 && (
              <section className="card content-card spaced">
                <h2>
                  {t('compare')} ({compare.length}/3)
                </h2>
                <div className="comparison">
                  {lands
                    .filter((l) => compare.includes(l.id))
                    .map((l) => (
                      <div key={l.id}>
                        <h3>{l.name}</h3>
                        <p>
                          {l.area} acres · {l.soil}
                        </p>
                        <p>
                          {l.water} · {l.distance} km
                        </p>
                        <strong>{rupee(l.rent)} / acre</strong>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        );
      case 'wallet':
        return (
          <>
            <div className="wallet-hero">
              <Wallet size={40} />
              <span>{t('balance')}</span>
              <strong>₹1,200</strong>
              <p>Demo credit from confirmed collection · Scheme v1</p>
              <button className="hero-button" onClick={() => setModal('voucher')}>
                {t('redeem')}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <section className="card content-card spaced">
              <h2>{t('ledger')}</h2>
              <div className="ledger-row">
                <Recycle size={24} />
                <div>
                  <strong>Confirmed wheat collection · 30 q</strong>
                  <p>20 Apr 2026 · Scheme v1 · Demo immutable record</p>
                </div>
                <strong className="positive">+ ₹1,200</strong>
              </div>
              <p className="notice">{t('creditRule')}</p>
            </section>
          </>
        );
      case 'settings':
        return (
          <div className="two-column">
            <section className="card content-card">
              <h2>{t('language')}</h2>
              <div className="language-grid">
                {[
                  ['en', 'English', 'English'],
                  ['hi', 'हिन्दी', 'Hindi'],
                  ['pa', 'ਪੰਜਾਬੀ', 'Punjabi'],
                  ['mr', 'मराठी', 'Marathi'],
                ].map(([code, native, label]) => (
                  <button
                    className={lang === code ? 'selected' : ''}
                    key={code}
                    onClick={() => changeLanguage(code!)}
                  >
                    <strong>{native}</strong>
                    <span>{label}</span>
                    {lang === code && <CheckCircle2 size={20} />}
                  </button>
                ))}
              </div>
              {['pa', 'mr'].includes(lang) && (
                <p className="notice">{t('review')} · English fallback enabled.</p>
              )}
            </section>
            <section className="card content-card">
              <h2>{t('phone')}</h2>
              <p>{t('phoneNote')}</p>
              <div className="profile-summary">
                <div className="avatar">RK</div>
                <div>
                  <strong>Ramesh Kumar</strong>
                  <p>Farmer · Rampur · Demo profile</p>
                </div>
              </div>
              <div className="safety-note">
                <Wifi size={20} />
                {farm.outbox.length} local changes waiting for a configured backend. They are not
                uploaded.
              </div>
            </section>
          </div>
        );
      case 'help':
        return (
          <section className="card content-card">
            <HelpCircle size={40} />
            <h2>{t('support')}</h2>
            <p>{t('supportText')}</p>
            <Button onClick={() => setModal('voice')}>
              <Mic size={18} />
              {t('voiceAction')}
            </Button>
            <p className="notice">{t('demoNotice')}</p>
          </section>
        );
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? 'open' : ''}`}>
        <a className="brand" href="#home" onClick={() => go('home')}>
          <span className="brand-mark">
            <Sprout size={29} strokeWidth={1.5} />
          </span>
          <div>
            <strong>
              खेत <span>Doctor</span>
            </strong>
            <small>Sahi rog. Sahi dawai. Sahi daam.</small>
          </div>
        </a>
        <div className="farm-selector">
          <div className="farm-icon">
            <Tractor size={22} />
          </div>
          <div>
            <strong>Ramesh’s farm</strong>
            <span>
              <MapPin size={11} />
              {t('village')}
            </span>
          </div>
          <ChevronDown size={15} />
        </div>
        <span className="nav-label">{t('workspace')}</span>
        <nav>
          {nav.slice(0, 5).map((n) => (
            <button
              className={`nav-item ${route === n.id ? 'active' : ''}`}
              key={n.id}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} strokeWidth={1.7} />
              <span>{t(n.id)}</span>
              {n.id === 'home' && <span className="active-dot" />}
            </button>
          ))}
          <span className="nav-label market-label">{t('marketplace')}</span>
          {nav.slice(5).map((n) => (
            <button
              className={`nav-item ${route === n.id ? 'active' : ''} ${n.id === 'parali' ? 'nav-parali' : ''}`}
              key={n.id}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} strokeWidth={1.7} />
              <span>{t(n.id)}</span>
              {n.id === 'parali' && <span className="new-label">NEW</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-promo">
            <Leaf size={21} />
            <div>
              <strong>
                Better farms.
                <br />
                Better tomorrows.
              </strong>
              <span>One season at a time.</span>
            </div>
            <span className="promo-decoration">✳</span>
          </div>
          <button
            className={`nav-item ${route === 'help' ? 'active' : ''}`}
            onClick={() => go('help')}
          >
            <HelpCircle size={19} />
            {t('help')}
          </button>
          <button
            className={`nav-item ${route === 'settings' ? 'active' : ''}`}
            onClick={() => go('settings')}
          >
            <Settings size={19} />
            {t('settings')}
          </button>
          <div className="connection">
            <span className={online ? 'connection-dot' : 'connection-dot offline'} />
            {online ? t('online') : t('offline')}
            <span>v0.1</span>
          </div>
        </div>
      </aside>
      {sidebar && <div className="sidebar-overlay" onClick={() => setSidebar(false)} />}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              onClick={() => setSidebar((v) => !v)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <div className="breadcrumb">
              <span>{t('home')}</span>
              {route !== 'home' && (
                <>
                  <ChevronRight size={14} />
                  <strong>{t(route)}</strong>
                </>
              )}
            </div>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={17} />
              <input
                aria-label={t('search')}
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') routeIntent(search);
                }}
              />
              <kbd>/</kbd>
              {search && (
                <div className="search-results">
                  {actions
                    .filter((a) =>
                      `${t(a.key)} ${a.id}`.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((a) => (
                      <button key={a.id} onClick={() => go(a.id)}>
                        <a.icon size={17} />
                        {t(a.key)}
                        <ArrowUpRight size={15} />
                      </button>
                    ))}
                  <button onClick={() => routeIntent(search)}>
                    <Search size={17} />
                    {search}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
            <label className="language-select">
              <span>
                अ<span>A</span>
              </span>
              <select
                aria-label={t('language')}
                value={lang}
                onChange={(e) => changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
                <option value="mr">मराठी</option>
              </select>
            </label>
            <span className="top-divider" />
            <button
              className="icon-button notification-button"
              onClick={() => setModal('notifications')}
              aria-label={t('notifications')}
            >
              <Bell size={20} />
              <i />
            </button>
            <button
              className="profile-button"
              aria-label="Open profile settings"
              onClick={() => go('settings')}
            >
              <span className="avatar">RK</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <main ref={mainRef} tabIndex={-1}>
          <div className="greeting-row">
            <div>
              <span className="greeting">
                <Sun size={17} />
                {t('greeting')} <span className="wave">✺</span>
              </span>
              <p>{t('goodMorning')}</p>
            </div>
            <div className="date-pill">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="page-heading">
            <div>
              <h1>{t(titleMap[route]?.[0] || 'overview')}</h1>
              <p>{t(titleMap[route]?.[1] || 'overviewSub')}</p>
            </div>
            {route === 'home' ? (
              <span className="farm-status">
                <span className="live-dot" />
                Rabi season · 2026
              </span>
            ) : (
              <button className="back-button" onClick={() => go('home')}>
                <ArrowLeft size={16} />
                {t('back')}
              </button>
            )}
          </div>
          {Screen()}
          <footer className="page-footer">
            <span>
              <Sprout size={15} />
              खेत Doctor <i>·</i> Made for the hands that feed us.
            </span>
            <span>{t('demoNotice')}</span>
          </footer>
        </main>
      </div>
      <button
        className="floating-mic"
        onClick={() => setModal('voice')}
        aria-label={t('voiceAction')}
      >
        <Mic size={24} />
        <span>{t('voiceHint')}</span>
      </button>
      <nav className="mobile-nav">
        {[nav[0]!, nav[1]!, nav[2]!, nav[5]!].map((n) => (
          <button className={route === n.id ? 'active' : ''} key={n.id} onClick={() => go(n.id)}>
            <n.icon size={21} />
            <span>{t(n.id)}</span>
          </button>
        ))}
        <button onClick={() => setSidebar(true)}>
          <Menu size={21} />
          <span>More</span>
        </button>
      </nav>
      {!online && (
        <div className="offline-banner">
          <WifiOff size={16} />
          {t('offline')}
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={20} />
          <span>{toast}</span>
          <button className="icon-button" onClick={() => setToast('')} aria-label={t('close')}>
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            tabIndex={-1}
            ref={dialogRef}
          >
            <button
              className="modal-close icon-button"
              onClick={() => setModal(null)}
              aria-label={t('close')}
            >
              <X size={22} />
            </button>
            {modal === 'voice' && (
              <>
                <div className="modal-symbol">
                  <Mic size={30} />
                </div>
                <h2 id="dialog-title">{t('voicePrompt')}</h2>
                <p>{t('voiceSub')}</p>
                <button className="record-button" onClick={record}>
                  <Mic size={35} />
                </button>
                <p className="notice" role="status">
                  {voiceStatus || t('voiceHint')}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    routeIntent(voice);
                  }}
                >
                  <label>
                    {t('voicePrompt')}
                    <input
                      autoComplete="off"
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      placeholder={t('voicePlaceholder')}
                    />
                  </label>
                  <button className="btn" type="submit">
                    {t('go')}
                    <ArrowRight size={17} />
                  </button>
                </form>
                <p className="notice">
                  Browser voice demo. Bhashini backend integration is not configured.
                </p>
              </>
            )}
            {modal === 'pledge' && (
              <>
                <div className="modal-symbol orange">
                  <Recycle size={30} />
                </div>
                <h2 id="dialog-title">{t('pledgeTitle')}</h2>
                <p>{t('paraliText')}</p>
                <div className="pledge-estimate">
                  <Wheat size={26} />
                  <div>
                    <span>{t('pledgeEstimate')}</span>
                    <strong>
                      {stubbleEstimate('wheat', 2.5, 18).quintals} quintals{' '}
                      <small>· 72% confidence</small>
                    </strong>
                  </div>
                </div>
                <form onSubmit={pledgeSubmit}>
                  <label>
                    {t('harvestDate')}
                    <input
                      required
                      type="date"
                      name="date"
                      min={new Date().toISOString().slice(0, 10)}
                      defaultValue="2027-04-15"
                    />
                  </label>
                  <label>
                    {t('access')}
                    <textarea
                      name="access"
                      required
                      maxLength={500}
                      placeholder={t('accessPlaceholder')}
                    />
                  </label>
                  <p className="notice">{t('creditRule')}</p>
                  <button className="btn earthy" type="submit">
                    {t('confirmPledge')}
                    <ArrowRight size={17} />
                  </button>
                </form>
              </>
            )}
            {modal === 'diary' && (
              <>
                <h2 id="dialog-title">{t('addEntry')}</h2>
                <form onSubmit={diarySubmit}>
                  <label>
                    {t('entryType')}
                    <select name="type">
                      {['irrigationEntry', 'fertiliserEntry', 'observation'].map((k) => (
                        <option key={k}>{t(k)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('entryNote')}
                    <textarea name="note" maxLength={1000} required />
                  </label>
                  <button className="btn" type="submit">
                    {t('save')}
                    <Check size={17} />
                  </button>
                </form>
              </>
            )}
            {modal === 'notifications' && (
              <>
                <h2 id="dialog-title">{t('notifications')}</h2>
                <div className="notification-item">
                  <Droplets size={23} />
                  <div>
                    <strong>{t('irrigate')}</strong>
                    <p>{t('irrigateText')}</p>
                    <button
                      className="text-link"
                      onClick={() => {
                        setModal(null);
                        go('irrigation');
                      }}
                    >
                      {t('seeAdvice')}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
                <div className="notification-item">
                  <CheckCheck size={23} />
                  <div>
                    <strong>{farm.outbox.length} changes saved locally</strong>
                    <p>Backend sync is not configured. Your demo data stays on this device.</p>
                  </div>
                </div>
              </>
            )}
            {modal === 'forecast' && (
              <>
                <h2 id="dialog-title">{t('forecast')}</h2>
                <p>{t('demoNotice')}</p>
                <div className="forecast-list">
                  {['Today', 'Mon', 'Tue', 'Wed', 'Thu'].map((day, i) => (
                    <div key={day}>
                      <strong>{day}</strong>
                      {i === 3 ? <CloudSun size={32} /> : <Sun size={32} />}
                      <b>{[28, 29, 27, 26, 28][i]}°</b>
                      <span>{[10, 10, 20, 30, 10][i]}% rain</span>
                    </div>
                  ))}
                </div>
                <p className="notice">
                  Sample forecast, not fetched from Open-Meteo. Check current local conditions
                  before irrigating.
                </p>
              </>
            )}
            {modal === 'voucher' && (
              <>
                <div className="modal-symbol">
                  <Wallet size={30} />
                </div>
                <h2 id="dialog-title">{t('redeem')}</h2>
                <p>{t('voucherNote')}</p>
                {voucher ? (
                  <div className="voucher">
                    <CheckCircle2 size={38} />
                    <strong>DEMO-KHET-1200</strong>
                    <span>₹1,200 · non-redeemable preview</span>
                  </div>
                ) : (
                  <Button onClick={() => setVoucher(true)}>
                    {t('redeem')}
                    <ArrowRight size={17} />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

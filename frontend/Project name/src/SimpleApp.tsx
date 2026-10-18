import { isBlurry, benchmarkTips } from '../../../packages/shared/vision.mjs';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudCheck,
  CloudOff,
  CloudSun,
  Droplets,
  HandHeart,
  Heart,
  Leaf,
  LocateFixed,
  MapPin,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Phone,
  Play,
  Plus,
  Recycle,
  RotateCcw,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sprout,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Tractor,
  Truck,
  Users,
  Volume2,
  Wheat,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { simpleI18n, s } from './simple-i18n';
import type { SimpleKey } from './simple-i18n';
import { getPhoto, prepareLeaf, savePhoto, useSimple } from './simple-store';
import { buyers, lands, mandis, products, vehicles } from './data';
import { matchingBuyers, rankInputs } from '../../../packages/shared/domain.mjs';
import {
  compareLand,
  filterLand,
  planNotification,
} from '../../../packages/shared/notifications.mjs';
import './simple.css';
const IMAGE = (id: string, _w = 900) =>
  id === 'photo-1416879595882-3373a0480b5b'
    ? '/images/crop.jpg'
    : id === 'photo-1500382017468-9049fed747ef'
      ? '/images/neighbours.jpg'
      : '/images/land.jpg';
const core: [string, SimpleKey, SimpleKey, LucideIcon, string][] = [
  ['crops', 'doctor', 'doctorHint', Sprout, 'photo-1416879595882-3373a0480b5b'],
  ['benchmark', 'neighbours', 'neighboursHint', Users, 'photo-1500382017468-9049fed747ef'],
  ['land', 'land', 'landHint', MapPin, 'photo-1500937386664-56d1dfef3854'],
];
const cropPics: [string, string][] = [
  ['tomato', '🍅'],
  ['wheat', '🌾'],
  ['rice', '🍚'],
  ['potato', '🥔'],
  ['maize', '🌽'],
  ['onion', '🧅'],
];
const pages = [
  'home',
  'crops',
  'camera',
  'result',
  'care',
  'feedback',
  'benchmark',
  'diary',
  'harvest',
  'land',
  'plot',
  'interest',
  'chat',
  'compare',
  'list',
  'more',
  'prices',
  'paani',
  'mandi',
  'gaadi',
  'settings',
  'inbox',
  'language',
  'consent',
];
const demoInsights = benchmarkTips({
  consent: true,
  peerCount: 12,
  self: { yield: 18, sowingOffset: 12, fertiliserSplits: 1, irrigations: 8 },
  top: { yield: 25, sowingOffset: 2, fertiliserSplits: 2, irrigations: 7 },
  averageYield: 21.4,
  associations: { sowing: 4, khaad: 3, water: 1 },
})!;
const sampleDiseases: Record<string, SimpleKey> = {
  tomato: 'earlyBlight',
  wheat: 'leafRust',
  rice: 'leafBlight',
  potato: 'lateBlight',
  maize: 'commonRust',
  onion: 'purpleBlotch',
};
const money = (v: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(v);
const plotData = lands.map((l, i) => ({
  ...l,
  verified: true,
  waterKey: i === 1 ? 'borewell' : 'canal',
  soilKey: i === 1 ? 'soilLoam' : 'soilAlluvial',
}));
const cropsTitle: Record<string, SimpleKey> = {
  crops: 'chooseCrop',
  camera: 'cameraTitle',
  result: 'doctor',
  care: 'treatment',
  feedback: 'feedback',
  benchmark: 'neighbours',
  diary: 'diary',
  harvest: 'yield',
  land: 'land',
  plot: 'details',
  interest: 'noticeTitle',
  chat: 'privateChat',
  compare: 'comparison',
  list: 'listLand',
  more: 'helpers',
  prices: 'prices',
  paani: 'paani',
  mandi: 'mandi',
  gaadi: 'gaadi',
  settings: 'settings',
  inbox: 'inbox',
  language: 'language',
  consent: 'optInTitle',
  home: 'home',
};
function Action({
  icon: Icon,
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`simple-action ${secondary ? 'secondary' : ''}`}
      onClick={onClick}
    >
      <Icon size={23} />
      <span>{children}</span>
      <ArrowRight size={19} />
    </button>
  );
}
function PictureChoice({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`picture-choice ${selected ? 'selected' : ''}`} onClick={onClick}>
      <Icon size={28} strokeWidth={1.6} />
      <span>{label}</span>
      {selected && <Check size={17} />}
    </button>
  );
}
export default function SimpleApp() {
  const [page, setPage] = useState(() => {
    const hash = location.hash.slice(1);
    return hash === 'bazaar'
      ? 'prices'
      : hash === 'sell'
        ? 'mandi'
        : hash === 'irrigation'
          ? 'paani'
          : hash === 'transport'
            ? 'gaadi'
            : pages.includes(hash)
              ? hash
              : 'home';
  });
  const [lang, setLang] = useState(simpleI18n.language),
    [toast, setToast] = useState(''),
    [voice, setVoice] = useState(false),
    [voiceStatus, setVoiceStatus] = useState(''),
    [langOpen, setLangOpen] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [showCrops, setShowCrops] = useState(false),
    [photoUrl, setPhotoUrl] = useState(''),
    [photoBusy, setPhotoBusy] = useState(false),
    [blurry, setBlurry] = useState(false),
    [checking, setChecking] = useState(false),
    [moreItems, setMoreItems] = useState(3),
    [radius, setRadius] = useState(10),
    [size, setSize] = useState('all'),
    [water, setWater] = useState('all'),
    [maxRent, setMaxRent] = useState(30000),
    [filtersOpen, setFiltersOpen] = useState(false),
    [selectedPlot, setSelectedPlot] = useState(lands[0]!.id),
    [compared, setCompared] = useState<string[]>([]),
    [diaryKind, setDiaryKind] = useState('sowing'),
    [yieldUnit, setYieldUnit] = useState('quintal'),
    [helperCategory, setHelperCategory] = useState('all'),
    [number, setNumber] = useState<{ target: string; value: string } | null>(null),
    [feedbackDone, setFeedbackDone] = useState(false),
    [listingStep, setListingStep] = useState(0),
    [locationSaved, setLocationSaved] = useState(false);
  const farm = useSimple();
  const seen = useRef(new Set<string>());
  const file = useRef<HTMLInputElement>(null);
  const listingFile = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const diagnosisMode = farm.resultMode;
  const currentPlot = plotData.find((p) => p.id === selectedPlot) || plotData[0]!;
  function go(next: string) {
    const valid = pages.includes(next) ? next : 'home';
    setPage(valid);
    location.hash = valid;
    setMoreItems(3);
    setVoice(false);
    setLangOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function say(text?: string, language = lang) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text || main.current?.innerText || '');
    utterance.lang = language === 'en' ? 'en-IN' : `${language}-IN`;
    utterance.rate = 0.88;
    speechSynthesis.speak(utterance);
  }
  function notify(text: string) {
    setToast(text);
    say(text);
  }
  useEffect(() => {
    const hash = () => {
      const p = location.hash.slice(1);
      if (pages.includes(p)) setPage(p);
    };
    const net = () => setOnline(navigator.onLine);
    addEventListener('hashchange', hash);
    addEventListener('online', net);
    addEventListener('offline', net);
    return () => {
      removeEventListener('hashchange', hash);
      removeEventListener('online', net);
      removeEventListener('offline', net);
    };
  }, []);
  useEffect(() => {
    if (!farm.autoRead || seen.current.has(page)) return;
    seen.current.add(page);
    const timeout = setTimeout(
      () => say(page === 'home' ? core.map((c) => s(c[1])).join('. ') : undefined),
      200,
    );
    return () => clearTimeout(timeout);
  }, [page, lang, farm.autoRead]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    let active = true,
      url = '';
    if (farm.photoId)
      void getPhoto(farm.photoId)
        .then((blob) => {
          if (blob && active) {
            url = URL.createObjectURL(blob);
            setPhotoUrl(url);
          }
        })
        .catch(() => setPhotoUrl(''));
    else setPhotoUrl('');
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [farm.photoId]);
  useEffect(() => {
    if (!voice && !number && !langOpen) return;
    const previous = document.activeElement as HTMLElement;
    overlay.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setVoice(false);
        setNumber(null);
        setLangOpen(false);
      }
      if (event.key === 'Tab') {
        const controls = overlay.current?.querySelectorAll<HTMLButtonElement>('button');
        if (!controls?.length) return;
        const first = controls[0]!,
          last = controls[controls.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    addEventListener('keydown', key);
    return () => {
      removeEventListener('keydown', key);
      previous?.focus();
    };
  }, [voice, number, langOpen]);
  function changeLanguage(code: string, native: string) {
    void simpleI18n.changeLanguage(code).then(() => {
      setLang(code);
      localStorage.setItem('khet-simple-lang', code);
      document.documentElement.lang = code;
      say(native, code);
      setLangOpen(false);
    });
  }
  function sendUpdate(kind: string, text: string, route: string) {
    const now = new Date().toISOString();
    const plan = planNotification({
      consent: { whatsapp: farm.whatsapp, push: true },
      now,
      history: farm.messages,
      lastInboundAt: undefined,
      approvedTemplate: true,
    });
    if (plan.status === 'deferred') {
      notify(s(plan.reason === 'quiet_hours' ? 'quiet' : 'limited'));
      return;
    }
    if (plan.status !== 'ready') {
      notify(s('noConsent'));
      return;
    }
    farm.set({
      messages: [
        {
          id: crypto.randomUUID(),
          kind,
          text,
          route,
          status: 'sent',
          channel: plan.channel!,
          sentAt: now,
          urgent: false,
        },
        ...farm.messages,
      ],
    });
    farm.enqueue('notification-mock', { kind, channel: plan.channel, route });
    notify(s('whatsappMock'));
  }
  function routeIntent(text: string) {
    const q = text.toLowerCase();
    if (/rog|leaf|yellow|disease|patte|पत्त|रोग|पीले/.test(q)) go('crops');
    else if (/land|rent|zameen|जमीन|ज़मीन|किराय/.test(q)) go('land');
    else if (/neigh|benchmark|kisan|पड़ोस|किसान/.test(q)) go('benchmark');
    else if (/mandi|price|sell|मंडी|बेच|भाव/.test(q)) go('mandi');
    else if (/water|paani|पानी|सिंचाई/.test(q)) go('paani');
    else if (/gaadi|vehicle|truck|गाड़ी/.test(q)) go('gaadi');
    else if (/seed|medicine|fertili|दवा|खाद|बीज/.test(q)) go('prices');
    else {
      setVoiceStatus(s('voiceFailed'));
      say(s('voiceFailed'));
    }
  }
  function record() {
    const W = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: { transcript: string }[][] }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const Recognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus(s('voiceFailed'));
      say(s('voiceFailed'));
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    recognition.onresult = (e) => routeIntent(e.results[0]?.[0]?.transcript || '');
    recognition.onerror = () => setVoiceStatus(s('voiceFailed'));
    recognition.onend = () => setVoiceStatus(s('voiceFailed'));
    setVoiceStatus(s('listening'));
    try {
      recognition.start();
    } catch {
      setVoiceStatus(s('voiceFailed'));
    }
  }
  async function capturePhoto(selected?: File, forListing = false) {
    if (!selected) return;
    if (selected.size > 12 * 1024 * 1024) {
      notify(s('retake'));
      return;
    }
    setPhotoBusy(true);
    try {
      const prepared = await prepareLeaf(selected);
      const id = await savePhoto(prepared.blob);
      if (forListing) {
        farm.set({ listing: { ...farm.listing, photoId: id } });
        notify(s('photoSaved'));
      } else {
        farm.set({ photoId: id });
        setBlurry(isBlurry(prepared.variance));
        farm.enqueue('diagnosis-photo', {
          photoId: id,
          crop: farm.crop,
          date: new Date().toISOString(),
          blurVariance: prepared.variance,
        });
        if (isBlurry(prepared.variance)) notify(s('unclear'));
        else runDiagnosis();
      }
    } catch {
      notify(s('retake'));
    } finally {
      setPhotoBusy(false);
    }
  }
  function runDiagnosis() {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      go('result');
    }, 700);
  }
  function setConsent(value: boolean) {
    farm.set({ whatsapp: value, consentAt: new Date().toISOString() });
    farm.enqueue('consent', { whatsapp: value, at: new Date().toISOString() });
    notify(s(value ? 'consentSaved' : 'stopped'));
  }
  function updateNumber() {
    if (!number) return;
    const n = Number(number.value);
    if (!Number.isFinite(n) || n < 0) return;
    if (number.target === 'minPrice') farm.set({ minPrice: n });
    else if (number.target === 'area' && n > 0) farm.set({ area: n });
    else if (number.target === 'labelDose' && n > 0) farm.set({ labelDose: n });
    else if (number.target === 'maxRent') setMaxRent(n);
    else if (number.target === 'yield') {
      farm.log('harvest', n, yieldUnit);
      go('diary');
      notify(s('logSaved'));
    } else if (number.target === 'listingArea' && n > 0)
      farm.set({ listing: { ...farm.listing, area: n } });
    else if (number.target === 'listingRent' && n > 0)
      farm.set({ listing: { ...farm.listing, rent: n } });
    setNumber(null);
  }
  function primaryBack() {
    if (['crops', 'benchmark', 'land', 'more'].includes(page)) go('home');
    else if (['camera', 'result'].includes(page)) go('crops');
    else if (['care', 'feedback'].includes(page)) go('result');
    else if (['plot', 'compare', 'list', 'interest', 'chat'].includes(page)) go('land');
    else if (['diary', 'harvest'].includes(page)) go('benchmark');
    else go('more');
  }
  const numberLabel: Record<string, SimpleKey> = {
    minPrice: 'minPrice',
    area: 'plotArea',
    labelDose: 'enterDose',
    maxRent: 'rent',
    yield: 'yield',
    listingArea: 'plotArea',
    listingRent: 'plotRent',
  };
  const { data: cachedPlots = plotData } = useQuery({
    queryKey: ['demo', 'land-v2'],
    queryFn: async () => plotData,
    initialData: plotData,
    staleTime: Infinity,
  });
  const filteredPlots = filterLand(cachedPlots, { radius, size, water, maxRent });
  function renderScreen() {
    if (page === 'home')
      return (
        <section className="simple-home">
          <div className="home-tiles">
            {core.map(([route, title, hint, Icon, img], i) => (
              <button className={`home-tile tile-${i}`} key={route} onClick={() => go(route)}>
                <img src={IMAGE(img)} alt="" />
                <div className="tile-tint" />
                <span className="tile-corner">
                  <Icon size={25} strokeWidth={1.7} />
                </span>
                <div className="tile-copy">
                  <span className="tile-kicker">{s(hint)}</span>
                  <h1>{s(title)}</h1>
                  <span className="tile-arrow">
                    <ArrowUpRight size={25} />
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="home-voice">
            <div className="voice-side-line" />
            <button
              className="home-mic"
              onClick={() => {
                setVoice(true);
                setVoiceStatus('');
              }}
              aria-label={s('speak')}
            >
              <Mic size={32} />
              <span>{s('speak')}</span>
            </button>
            <div className="voice-side-line" />
          </div>
          <button className="simple-more" onClick={() => go('more')}>
            <MoreHorizontal size={21} />
            {s('more')}
            <ChevronDown size={15} />
          </button>
        </section>
      );
    if (page === 'crops')
      return (
        <div className="center-flow">
          <div className="crop-grid">
            {cropPics.slice(0, showCrops ? 6 : 3).map(([id, emoji]) => (
              <button
                className="crop-choice"
                key={id}
                onClick={() => {
                  farm.set({ crop: id, photoId: null });
                  setBlurry(false);
                  go('camera');
                }}
              >
                <span>{emoji}</span>
                <strong>{s(id as SimpleKey)}</strong>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
          {!showCrops && (
            <Action secondary icon={Plus} onClick={() => setShowCrops(true)}>
              {s('showMore')}
            </Action>
          )}
        </div>
      );
    if (page === 'camera')
      return (
        <div className="center-flow camera-flow">
          <div className="leaf-camera">
            {photoUrl ? (
              <img src={photoUrl} alt={s('photoSaved')} />
            ) : (
              <>
                <img src={IMAGE('photo-1416879595882-3373a0480b5b', 900)} alt="" />
                <div className="leaf-outline">
                  <Leaf size={110} strokeWidth={0.7} />
                </div>
              </>
            )}
            <span className="camera-crop">
              {cropPics.find((c) => c[0] === farm.crop)?.[1]} {s(farm.crop as SimpleKey)}
            </span>
          </div>
          <p className={blurry ? 'warning-line' : 'spoken-line'}>
            {checking ? s('checking') : blurry ? s('unclear') : s('cameraHint')}
          </p>
          <Action
            icon={Camera}
            disabled={checking || photoBusy}
            onClick={() => file.current?.click()}
          >
            {blurry ? s('retake') : s('takePhoto')}
          </Action>
          <Action
            secondary
            icon={Play}
            disabled={checking}
            onClick={() => {
              setBlurry(false);
              runDiagnosis();
            }}
          >
            {s('tryDemo')}
          </Action>
          <p className="demo-footnote">{s('sample')}</p>
        </div>
      );
    if (page === 'result')
      return (
        <div className="center-flow">
          <div className={`diagnosis-card mode-${diagnosisMode}`}>
            <span className="confidence-word">
              {diagnosisMode === 'expert' ? <Users size={23} /> : <ShieldCheck size={23} />}{' '}
              {s(diagnosisMode as SimpleKey)}
            </span>
            <div className="diagnosis-picture">
              {photoUrl ? (
                <img src={photoUrl} alt={s('photoSaved')} />
              ) : (
                <img src={IMAGE('photo-1416879595882-3373a0480b5b', 700)} alt="" />
              )}
              {diagnosisMode === 'healthy' && (
                <span className="healthy-check">
                  <CheckCircle2 size={62} />
                </span>
              )}
            </div>
            <h2>
              {s(
                diagnosisMode === 'healthy'
                  ? 'healthy'
                  : diagnosisMode === 'expert'
                    ? 'expertHint'
                    : sampleDiseases[farm.crop] || 'disease',
              )}
            </h2>
            <p>{s(diagnosisMode === 'healthy' ? 'healthyHint' : 'cause')}</p>
            {diagnosisMode === 'shayad' && (
              <div className="two-predictions">
                <span>
                  <Leaf size={20} />
                  {s('disease')}
                </span>
                <span>
                  <Sprout size={20} />
                  {s('cropHealthy')}
                </span>
              </div>
            )}
            <span className="result-suggestion">{s('suggestion')}</span>
          </div>
          {diagnosisMode === 'expert' ? (
            <Action
              icon={Users}
              onClick={() => {
                farm.enqueue('expert-review', { photoId: farm.photoId, crop: farm.crop });
                sendUpdate('expert', s('reviewStatus'), 'result');
                notify(s('expertSaved'));
                go('inbox');
              }}
            >
              {s('askExpert')}
            </Action>
          ) : diagnosisMode === 'shayad' ? (
            <Action icon={Camera} onClick={() => go('camera')}>
              {s('another')}
            </Action>
          ) : (
            <Action
              icon={diagnosisMode === 'healthy' ? Check : Leaf}
              onClick={() => go(diagnosisMode === 'healthy' ? 'feedback' : 'care')}
            >
              {s(diagnosisMode === 'healthy' ? 'done' : 'treatment')}
            </Action>
          )}
          <p className="demo-footnote">{s('sample')}</p>
        </div>
      );
    if (page === 'care')
      return (
        <div className="care-flow">
          <div className="care-options">
            <article className="care-card organic-card">
              <span className="care-icon">
                <Leaf size={37} />
              </span>
              <span className="small-caps">01</span>
              <h2>{s('organic')}</h2>
              <p>{s('organicAdvice')}</p>
              <div className="care-safety">
                <Sun size={19} />
                {s('suggestion')}
              </div>
            </article>
            <article className="care-card">
              <span className="care-icon amber">
                <ShoppingBag size={37} />
              </span>
              <span className="small-caps">02</span>
              <h2>{s('chemical')}</h2>
              <p>{s('chemicalAdvice')}</p>
              <div className="care-safety">
                <ShieldCheck size={19} />
                {s('safety')}
              </div>
            </article>
          </div>
          <div className="dose-summary">
            <Scale size={27} />
            <div>
              <strong>
                {s('dose')} · {farm.area} {s('acre')}
              </strong>
              <p>{farm.labelDose ? `${farm.area * farm.labelDose} ${s('kg')}` : s('noDose')}</p>
              <small>{s('wait')}</small>
            </div>
            <button
              className="icon-button"
              onClick={() => setNumber({ target: 'area', value: String(farm.area) })}
              aria-label={s('plotArea')}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
          <button
            className="filter-chip label-dose-button"
            onClick={() =>
              setNumber({
                target: 'labelDose',
                value: farm.labelDose ? String(farm.labelDose) : '',
              })
            }
          >
            <Scale size={21} />
            {s('enterDose')} · {s('doseUnit')}
          </button>
          <p className="small-note">{s('doseHint')}</p>
          <Action
            icon={HandHeart}
            onClick={() => {
              farm.log('treatment');
              sendUpdate('diagnosis', s('organicAdvice'), 'care');
              go('feedback');
            }}
          >
            {s('startCare')}
          </Action>
          <Action
            secondary
            icon={MapPin}
            onClick={() => {
              setHelperCategory('protection');
              go('prices');
            }}
          >
            {s('nearbyPrices')}
          </Action>
        </div>
      );
    if (page === 'feedback')
      return (
        <div className="center-flow feedback-screen">
          <span className="big-friendly-icon">
            <Heart size={70} strokeWidth={1.2} />
          </span>
          <h2>{s(feedbackDone ? 'thanks' : 'feedback')}</h2>
          {feedbackDone ? (
            <Action
              icon={Check}
              onClick={() => {
                setFeedbackDone(false);
                go('home');
              }}
            >
              {s('done')}
            </Action>
          ) : (
            <div className="yes-no">
              <button
                onClick={() => {
                  farm.enqueue('diagnosis-feedback', { photoId: farm.photoId, helpful: true });
                  setFeedbackDone(true);
                }}
              >
                <ThumbsUp size={46} />
                <span>{s('yes')}</span>
              </button>
              <button
                onClick={() => {
                  farm.enqueue('diagnosis-feedback', { photoId: farm.photoId, helpful: false });
                  setFeedbackDone(true);
                }}
              >
                <ThumbsDown size={46} />
                <span>{s('no')}</span>
              </button>
            </div>
          )}
        </div>
      );
    if (page === 'benchmark')
      return (
        <div className="benchmark-flow">
          {!farm.benchmarkConsent ? (
            <div className="consent-panel">
              <span className="big-friendly-icon">
                <Users size={64} strokeWidth={1.3} />
              </span>
              <h2>{s('consentTitle')}</h2>
              <p>{s('consentHint')}</p>
              <span className="privacy-label">
                <ShieldCheck size={18} />
                {s('privacy')}
              </span>
              <Action
                icon={Check}
                onClick={() => {
                  farm.set({ benchmarkConsent: true });
                  farm.enqueue('benchmark-consent', { at: new Date().toISOString(), value: true });
                }}
              >
                {s('agree')}
              </Action>
              <Action secondary icon={ArrowLeft} onClick={() => go('home')}>
                {s('notNow')}
              </Action>
            </div>
          ) : (
            <>
              <section className="simple-benchmark">
                <div className="benchmark-heading">
                  <span className="illustration-icon">
                    <Wheat size={32} />
                  </span>
                  <div>
                    <h2>{s('field')}</h2>
                    <p>{s('privacy')}</p>
                  </div>
                  <span className="benchmark-unit">q / acre</span>
                </div>
                <div className="simple-bars">
                  {[
                    ['yourFarm', demoInsights.selfYield, 58],
                    ['villageAverage', demoInsights.averageYield, 72],
                    ['topFarmers', demoInsights.topYield, 92],
                  ].map(([label, value, width]) => (
                    <div key={label}>
                      <span>{s(label as SimpleKey)}</span>
                      <div>
                        <i style={{ width: `${width}%` }}>
                          <b>{value}</b>
                        </i>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="benchmark-disclaimer">{s('benchmarkNotice')}</p>
              </section>
              <div className="tip-cards">
                {[
                  ['tip1', CalendarIcon],
                  ['tip2', ShoppingBag],
                  ['tip3', Droplets],
                ].map(([key, Icon], i) => {
                  const TipIcon = Icon as LucideIcon;
                  return (
                    <article className="tip-card" key={String(key)}>
                      <span className={`tip-icon tip-${i}`}>
                        <TipIcon size={28} />
                      </span>
                      <p>{s(key as SimpleKey)}</p>
                      <button
                        className="round-listen"
                        onClick={() => say(s(key as SimpleKey))}
                        aria-label={s('listen')}
                      >
                        <Volume2 size={22} />
                      </button>
                    </article>
                  );
                })}
              </div>
              <Action icon={Plus} onClick={() => go('diary')}>
                {s('diary')}
              </Action>
              <Action
                secondary
                icon={MessageCircle}
                onClick={() =>
                  sendUpdate('season-tip', [s('tip1'), s('tip2'), s('tip3')].join(' '), 'benchmark')
                }
              >
                {s('getTips')}
              </Action>
            </>
          )}
        </div>
      );
    if (page === 'diary')
      return (
        <div className="diary-flow">
          <div className="diary-picture-choices">
            {[
              ['sowing', Sprout],
              ['khaad', ShoppingBag],
              ['spray', Leaf],
              ['water', Droplets],
              ['harvest', Wheat],
            ].map(([key, Icon]) => (
              <PictureChoice
                icon={Icon as LucideIcon}
                key={String(key)}
                label={s(key as SimpleKey)}
                selected={diaryKind === key}
                onClick={() => setDiaryKind(String(key))}
              />
            ))}
          </div>
          <Action
            icon={Plus}
            onClick={() => {
              if (diaryKind === 'harvest') setNumber({ target: 'yield', value: '' });
              else {
                farm.log(diaryKind);
                notify(s('logSaved'));
              }
            }}
          >
            {s(diaryKind === 'harvest' ? 'yield' : 'logToday')}
          </Action>
          <div className="simple-timeline">
            {farm.diary.slice(0, moreItems).map((entry) => (
              <div key={entry.id}>
                <CheckCircle2 size={23} />
                <strong>
                  {s(entry.kind === 'treatment' ? 'startCare' : (entry.kind as SimpleKey))}
                </strong>
                <span>
                  {entry.amount !== undefined
                    ? `${entry.amount} ${s((entry.unit || 'quintal') as SimpleKey)}`
                    : new Date(entry.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                </span>
                <button
                  className="round-listen"
                  onClick={() =>
                    say(
                      `${s(entry.kind === 'treatment' ? 'startCare' : (entry.kind as SimpleKey))} ${entry.amount || ''}`,
                    )
                  }
                  aria-label={s('listen')}
                >
                  <Volume2 size={20} />
                </button>
              </div>
            ))}
          </div>
          {farm.diary.length > moreItems && (
            <Action secondary icon={Plus} onClick={() => setMoreItems((v) => v + 3)}>
              {s('showMore')}
            </Action>
          )}
        </div>
      );
    if (page === 'land')
      return (
        <div className="land-flow">
          <div className="land-toolbar">
            <button className="filter-chip" onClick={() => setFiltersOpen((v) => !v)}>
              <SlidersHorizontal size={20} />
              {s('distance')} · {radius} km
              <ChevronDown size={15} />
            </button>
            <button
              className="filter-chip"
              onClick={() => {
                setListingStep(0);
                go('list');
              }}
            >
              <Plus size={20} />
              {s('listLand')}
            </button>
            {compared.length > 0 && (
              <button className="filter-chip" onClick={() => go('compare')}>
                <Scale size={20} />
                {s('compare')} ({compared.length})
              </button>
            )}
          </div>
          {filtersOpen && (
            <section className="land-filters">
              <div>
                <span>{s('distance')}</span>
                <div className="chip-row">
                  {[5, 10, 25].map((r) => (
                    <button
                      className={radius === r ? 'active' : ''}
                      key={r}
                      onClick={() => setRadius(r)}
                    >
                      <MapPin size={18} />
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span>{s('size')}</span>
                <div className="chip-row">
                  {['all', 'small', 'medium', 'large'].map((k) => (
                    <button
                      className={size === k ? 'active' : ''}
                      key={k}
                      onClick={() => setSize(k)}
                    >
                      <Scale size={18} />
                      {s(k as SimpleKey)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span>{s('plotWater')}</span>
                <div className="chip-row">
                  {[
                    ['all', 'all'],
                    ['canal', 'waterCanal'],
                    ['borewell', 'waterBorewell'],
                    ['rain', 'waterRain'],
                  ].map(([key, label]) => (
                    <button
                      className={water === key ? 'active' : ''}
                      key={key}
                      onClick={() => setWater(key!)}
                    >
                      <Droplets size={18} />
                      {s(label as SimpleKey)}
                    </button>
                  ))}
                </div>
              </div>
              <label className="rent-slider">
                <span>
                  <Scale size={22} />
                  {s('rent')} <strong>{money(maxRent)}</strong>
                </span>
                <input
                  type="range"
                  min="5000"
                  max="30000"
                  step="500"
                  value={maxRent}
                  onChange={(event) => setMaxRent(Number(event.target.value))}
                  aria-label={s('rent')}
                />
              </label>
            </section>
          )}
          <div className="land-map" role="region" aria-label={s('mapHint')}>
            <span className="map-river" />
            <span className="map-road road-one" />
            <span className="map-road road-two" />
            <span className="map-road road-three" />
            <span className="map-label map-village">{s('rampur')}</span>
            <span className="map-label map-village-two">{s('kithore')}</span>
            {filteredPlots.map((p, i) => (
              <button
                className={`map-pin pin-${i}`}
                key={p.id}
                onClick={() => {
                  setSelectedPlot(p.id);
                  go('plot');
                }}
                aria-label={`${p.area} ${s('acre')} ${money(p.rent)}`}
              >
                <MapPin size={20} />
                {money(p.rent)}
              </button>
            ))}
            <span className="map-note">
              <MapPin size={13} />
              {s('mapHint')}
            </span>
          </div>
          <div className="simple-plots">
            {filteredPlots.slice(0, moreItems).map((p) => (
              <article className="simple-plot" key={p.id}>
                <button
                  className="plot-image"
                  onClick={() => {
                    setSelectedPlot(p.id);
                    go('plot');
                  }}
                  aria-label={`${s('details')} ${p.village}`}
                >
                  <img src={IMAGE(p.image, 700)} alt="" />
                  <span className="verified-tag">
                    <ShieldCheck size={14} />
                    {s('verified')}
                  </span>
                </button>
                <div className="plot-copy">
                  <div className="plot-title">
                    <h2>
                      {p.area} {s('acre')}
                    </h2>
                    <button
                      className={compared.includes(p.id) ? 'compare-tick selected' : 'compare-tick'}
                      onClick={() =>
                        setCompared((list) =>
                          list.includes(p.id)
                            ? list.filter((id) => id !== p.id)
                            : list.length < 3
                              ? [...list, p.id]
                              : list,
                        )
                      }
                      aria-label={`${s('compare')} ${p.village}`}
                    >
                      {compared.includes(p.id) ? <Check size={21} /> : <Plus size={21} />}
                    </button>
                  </div>
                  <div className="plot-rent">
                    <strong>{money(p.rent)}</strong>
                    <span>{s('rentUnit')}</span>
                  </div>
                  <div className="plot-facts">
                    <span>
                      <Droplets size={17} />
                      {s(p.waterKey === 'canal' ? 'waterCanal' : 'waterBorewell')}
                    </span>
                    <span>
                      <MapPin size={17} />
                      {p.distance} km
                    </span>
                  </div>
                  <button
                    className="plot-details"
                    onClick={() => {
                      setSelectedPlot(p.id);
                      go('plot');
                    }}
                  >
                    {s('details')}
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!filteredPlots.length && (
            <div className="empty-simple">
              <MapPin size={48} />
              <p>{s('noLand')}</p>
            </div>
          )}
          {filteredPlots.length > moreItems ? (
            <Action icon={Plus} onClick={() => setMoreItems((v) => v + 3)}>
              {s('showMore')}
            </Action>
          ) : (
            <Action
              icon={Bell}
              onClick={() => {
                farm.enqueue('land-saved-search', { radius, size, water, maxRent });
                notify(s('searchSaved'));
              }}
            >
              {s('saveSearch')}
            </Action>
          )}
        </div>
      );
    if (page === 'plot')
      return (
        <div className="plot-detail">
          <img className="plot-cover" src={IMAGE(currentPlot.image, 1100)} alt="" />
          <div className="plot-detail-copy">
            <span className="verified-tag">
              <ShieldCheck size={16} />
              {s('verified')}
            </span>
            <h2>
              {currentPlot.area} {s('acre')} · {currentPlot.village}
            </h2>
            <p className="detail-price">
              {money(currentPlot.rent)}
              <span>{s('rentUnit')}</span>
            </p>
            <div className="detail-facts">
              <span>
                <Droplets size={25} />
                {s(currentPlot.waterKey === 'canal' ? 'waterCanal' : 'waterBorewell')}
              </span>
              <span>
                <Leaf size={25} />
                {s(currentPlot.soilKey as SimpleKey)}
              </span>
              <span>
                <MapPin size={25} />
                {currentPlot.distance} km
              </span>
            </div>
            <p className="small-note">{s('phoneHint')}</p>
            <Action icon={HandHeart} onClick={() => go('interest')}>
              {s('sendInterest')}
            </Action>
            <Action
              secondary
              icon={Scale}
              onClick={() => {
                setCompared((list) =>
                  list.includes(currentPlot.id)
                    ? list
                    : list.length < 3
                      ? [...list, currentPlot.id]
                      : list,
                );
                go('compare');
              }}
            >
              {s('compare')}
            </Action>
          </div>
        </div>
      );
    if (page === 'interest')
      return (
        <div className="center-flow">
          <div className="consent-panel">
            <span className="big-friendly-icon">
              <ShieldCheck size={66} strokeWidth={1.2} />
            </span>
            <h2>{s('noticeTitle')}</h2>
            <p>{s('notice')}</p>
            <p>{s('notice2')}</p>
            <span className="small-note">Uttar Pradesh</span>
            <Action
              icon={Check}
              onClick={() => {
                farm.set({ interests: { ...farm.interests, [currentPlot.id]: 'pending' } });
                farm.enqueue('land-interest', {
                  listingId: currentPlot.id,
                  noticeVersion: 'UP-demo-v1',
                });
                sendUpdate('land-interest', s('waiting'), 'chat');
                go('chat');
                notify(s('interestSaved'));
              }}
            >
              {s('understand')}
            </Action>
          </div>
        </div>
      );
    if (page === 'chat')
      return (
        <div className="center-flow">
          <div className="chat-status">
            <span className="big-friendly-icon">
              <MessageCircle size={55} />
            </span>
            <h2>{s(farm.interests[currentPlot.id] === 'accepted' ? 'accepted' : 'waiting')}</h2>
            <p>{s('phoneHint')}</p>
          </div>
          {farm.interests[currentPlot.id] !== 'accepted' ? (
            <>
              <Action
                icon={HandHeart}
                onClick={() => {
                  farm.set({ interests: { ...farm.interests, [currentPlot.id]: 'accepted' } });
                  farm.enqueue('owner-accept-demo', { listingId: currentPlot.id });
                  sendUpdate('land-accepted', s('accepted'), 'chat');
                }}
              >
                {s('acceptDemo')}
              </Action>
              <p className="small-note">{s('ownerReview')}</p>
            </>
          ) : (
            <>
              <div className="private-messages">
                {(farm.chats[currentPlot.id] || []).slice(-3).map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
              <Action
                icon={MessageCircle}
                onClick={() => {
                  farm.set({
                    chats: {
                      ...farm.chats,
                      [currentPlot.id]: [...(farm.chats[currentPlot.id] || []), s('hello')],
                    },
                  });
                  farm.enqueue('land-message', { listingId: currentPlot.id, text: s('hello') });
                }}
              >
                {s('message')}
              </Action>
              <Action secondary icon={Phone} onClick={() => notify(s('callUnavailable'))}>
                {s('maskedCall')}
              </Action>
            </>
          )}
        </div>
      );
    if (page === 'compare')
      return (
        <div className="compare-flow">
          {compareLand(plotData.filter((p) => compared.includes(p.id))).map((p) => (
            <article className="compare-field" key={p.id}>
              <img src={IMAGE(p.image, 500)} alt="" />
              <div>
                <h2>
                  {p.area} {s('acre')}
                </h2>
                <strong>{money(p.rent)}</strong>
                <p>
                  {p.distance} km · {s(p.waterKey === 'canal' ? 'waterCanal' : 'waterBorewell')}
                </p>
                <div className="comparison-labels">
                  {p.cheapest && (
                    <span>
                      <Check size={15} />
                      {s('cheapest')}
                    </span>
                  )}
                  {p.nearest && (
                    <span>
                      <MapPin size={15} />
                      {s('nearest')}
                    </span>
                  )}
                </div>
                <button
                  className="plot-details"
                  onClick={() => {
                    setSelectedPlot(p.id);
                    go('plot');
                  }}
                >
                  {s('details')}
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </article>
          ))}
          {!compared.length && (
            <Action icon={MapPin} onClick={() => go('land')}>
              {s('findLand')}
            </Action>
          )}
        </div>
      );
    if (page === 'list')
      return (
        <div className="center-flow">
          <div className="listing-progress">
            {[0, 1, 2, 3].map((step) => (
              <span key={step} className={listingStep >= step ? 'active' : ''} />
            ))}
          </div>
          {listingStep === 0 ? (
            <>
              <h2>{s('location')}</h2>
              <div className="picture-choice-grid">
                {['rampur', 'mawana', 'kithore'].map((v) => (
                  <PictureChoice
                    icon={MapPin}
                    label={s(v as SimpleKey)}
                    selected={farm.listing.village === v}
                    onClick={() => farm.set({ listing: { ...farm.listing, village: v } })}
                    key={v}
                  />
                ))}
              </div>
              <Action
                icon={LocateFixed}
                onClick={() => {
                  if (!navigator.geolocation) {
                    notify(s('gpsFailed'));
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      farm.enqueue('listing-location', {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                      });
                      setLocationSaved(true);
                      notify(s('saved'));
                    },
                    () => notify(s('gpsFailed')),
                    { timeout: 8000 },
                  );
                }}
              >
                {locationSaved ? s('saved') : s('gps')}
              </Action>
              <Action secondary icon={ArrowRight} onClick={() => setListingStep(1)}>
                {s('next')}
              </Action>
            </>
          ) : listingStep === 1 ? (
            <>
              <h2>{s('plotArea')}</h2>
              <div className="big-number-choices">
                <button
                  onClick={() =>
                    setNumber({ target: 'listingArea', value: String(farm.listing.area) })
                  }
                >
                  <Scale size={28} />
                  <strong>{farm.listing.area}</strong>
                  <span>{s('acre')}</span>
                </button>
                <button
                  onClick={() =>
                    setNumber({ target: 'listingRent', value: String(farm.listing.rent) })
                  }
                >
                  <Wheat size={28} />
                  <strong>{money(farm.listing.rent)}</strong>
                  <span>{s('plotRent')}</span>
                </button>
              </div>
              <Action icon={ArrowRight} onClick={() => setListingStep(2)}>
                {s('next')}
              </Action>
            </>
          ) : listingStep === 2 ? (
            <>
              <h2>{s('plotWater')}</h2>
              <div className="picture-choice-grid">
                {[
                  ['canal', 'waterCanal'],
                  ['borewell', 'waterBorewell'],
                  ['rain', 'waterRain'],
                ].map(([key, label]) => (
                  <PictureChoice
                    key={key}
                    icon={Droplets}
                    label={s(label as SimpleKey)}
                    selected={farm.listing.water === key}
                    onClick={() => farm.set({ listing: { ...farm.listing, water: key! } })}
                  />
                ))}
              </div>
              <div className="chip-row">
                {[
                  ['alluvial', 'soilAlluvial'],
                  ['loam', 'soilLoam'],
                ].map(([key, label]) => (
                  <button
                    className={farm.listing.soil === key ? 'active' : ''}
                    key={key}
                    onClick={() => farm.set({ listing: { ...farm.listing, soil: key! } })}
                  >
                    <Leaf size={20} />
                    {s(label as SimpleKey)}
                  </button>
                ))}
              </div>
              <Action icon={ArrowRight} onClick={() => setListingStep(3)}>
                {s('next')}
              </Action>
            </>
          ) : (
            <>
              <div className="listing-photo">
                <Camera size={68} />
                {farm.listing.photoId && <CheckCircle2 size={35} />}
                <p>{s('plotPhoto')}</p>
              </div>
              <Action icon={Camera} onClick={() => listingFile.current?.click()}>
                {s('takePhoto')}
              </Action>
              <Action
                secondary
                icon={Check}
                onClick={() => {
                  farm.enqueue('land-listing', farm.listing);
                  notify(s('listingSaved'));
                  go('land');
                }}
              >
                {s('publish')}
              </Action>
            </>
          )}
        </div>
      );
    if (page === 'more')
      return (
        <div className="more-grid">
          {[
            ['prices', 'prices', ShoppingBag],
            ['paani', 'paani', Droplets],
            ['mandi', 'mandi', Wheat],
            ['gaadi', 'gaadi', Truck],
            ['settings', 'settings', Settings],
            ['inbox', 'inbox', MessageCircle],
          ].map(([route, key, Icon]) => (
            <PictureChoice
              icon={Icon as LucideIcon}
              label={s(key as SimpleKey)}
              key={String(route)}
              onClick={() => go(String(route))}
            />
          ))}
        </div>
      );
    if (page === 'prices')
      return (
        <div className="helper-flow">
          <div className="chip-row category-pictures">
            {[
              ['all', 'all', ShoppingBag],
              ['protection', 'doctor', Leaf],
              ['seed', 'sowing', Sprout],
              ['fertiliser', 'khaad', ShoppingBag],
              ['manure', 'organic', Recycle],
            ].map(([key, label, Icon]) => (
              <button
                className={helperCategory === key ? 'active' : ''}
                key={String(key)}
                onClick={() => setHelperCategory(String(key))}
              >
                {(() => {
                  const I = Icon as LucideIcon;
                  return <I size={22} />;
                })()}
                {s(label as SimpleKey)}
              </button>
            ))}
          </div>
          <div className="simple-shop-list">
            {rankInputs(
              products.filter((p) => helperCategory === 'all' || p.category === helperCategory),
            )
              .slice(0, 3)
              .map((p) => (
                <article className="simple-shop" key={p.id}>
                  <span className="product-emoji">{p.icon}</span>
                  <div>
                    <span className="verified-label">
                      <ShieldCheck size={14} />
                      {s('verified')}
                    </span>
                    <h2>{p.name}</h2>
                    <p>
                      {p.seller} · {p.distance} km
                    </p>
                    <strong>
                      {money(p.price)}
                      <small> / {p.pack}</small>
                    </strong>
                    {p.mrp && (
                      <span className="mrp-warning">
                        {s('mrp')} · {money(p.mrp)}
                      </span>
                    )}
                  </div>
                  <button
                    className="call-circle"
                    onClick={() => notify(s('demoCall'))}
                    aria-label={s('call')}
                  >
                    <Phone size={24} />
                  </button>
                </article>
              ))}
          </div>
          <p className="small-note">
            {s('priceDemo')}
            <br />
            {s('reference')}
          </p>
        </div>
      );
    if (page === 'paani')
      return (
        <div className="center-flow">
          <div className="paani-picture">
            <CloudSun size={84} strokeWidth={1.1} />
            <span className="rain-drop">
              <Droplets size={52} />
            </span>
          </div>
          <h2>{s('paaniHint')}</h2>
          <p className="spoken-line">{s('suggestion')}</p>
          <div className="small-note">
            {s('demo')} · {s('time')}
          </div>
          <Action
            icon={Bell}
            onClick={() => {
              farm.set({ waterUpdates: !farm.waterUpdates });
              notify(s('saved'));
            }}
          >
            {s(farm.waterUpdates ? 'optOut' : 'morning')}
          </Action>
          <p className="small-note">{s('whatsappMock')}</p>
        </div>
      );
    if (page === 'mandi')
      return (
        <div className="helper-flow">
          <button
            className="minimum-price"
            onClick={() => setNumber({ target: 'minPrice', value: String(farm.minPrice) })}
          >
            <span>
              <Scale size={25} />
              {s('minPrice')}
            </span>
            <strong>
              {money(farm.minPrice)}
              <small>{s('pricePerQ')}</small>
              <ChevronDown size={22} />
            </strong>
          </button>
          <div className="simple-mandi-prices">
            {mandis.map((m) => (
              <div key={m.name}>
                <Wheat size={22} />
                <span>{m.name}</span>
                <strong>{money(m.price)}</strong>
              </div>
            ))}
          </div>
          <p className="small-note">
            {s('time')} · {s('priceDemo')}
          </p>
          <div className="simple-shop-list">
            {matchingBuyers(buyers, farm.minPrice, 1)
              .slice(0, 3)
              .map((b) => (
                <article className="simple-shop" key={b.id}>
                  <span className="buyer-symbol">
                    <Wheat size={32} />
                  </span>
                  <div>
                    <span className="verified-label">
                      <ShieldCheck size={14} />
                      {s('verified')}
                    </span>
                    <h2>{b.name}</h2>
                    <p>{b.distance} km</p>
                    <strong>
                      {money(b.price)}
                      <small>{s('pricePerQ')}</small>
                    </strong>
                  </div>
                  <button
                    className="call-circle"
                    onClick={() => notify(s('demoCall'))}
                    aria-label={s('call')}
                  >
                    <Phone size={23} />
                  </button>
                </article>
              ))}
          </div>
          {!matchingBuyers(buyers, farm.minPrice, 1).length && (
            <p className="spoken-line">{s('noBuyer')}</p>
          )}
          <Action
            icon={Bell}
            onClick={() => {
              farm.enqueue('price-alert', { minimum: farm.minPrice, crop: 'wheat' });
              notify(s('saved'));
            }}
          >
            {s('buyerAlert')}
          </Action>
        </div>
      );
    if (page === 'gaadi')
      return (
        <div className="helper-flow simple-shop-list">
          {vehicles.slice(0, 3).map((v) => (
            <article className="simple-shop" key={v.id}>
              <span className="vehicle-symbol">
                <Tractor size={42} strokeWidth={1.5} />
              </span>
              <div>
                <span className="verified-label">
                  <ShieldCheck size={14} />
                  {s('verified')}
                </span>
                <h2>{v.name}</h2>
                <p>{v.capacity} kg</p>
                <strong>
                  {money(v.fare)}
                  <small>{s('rate')}</small>
                </strong>
              </div>
              <button
                className="call-circle"
                onClick={() => notify(s('demoCall'))}
                aria-label={s('call')}
              >
                <Phone size={24} />
              </button>
            </article>
          ))}
        </div>
      );
    if (page === 'settings')
      return (
        <div className="center-flow settings-flow">
          <div className="setting-row">
            <span>
              <Volume2 size={25} />
              {s('autoRead')}
            </span>
            <button
              className={farm.autoRead ? 'setting-toggle active' : 'setting-toggle'}
              onClick={() => farm.set({ autoRead: !farm.autoRead })}
              aria-label={s('autoRead')}
              aria-pressed={farm.autoRead}
            >
              {s(farm.autoRead ? 'on' : 'off')}
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>
              <MessageCircle size={25} />
              {s('whatsapp')}
            </span>
            <button
              className={farm.whatsapp ? 'setting-toggle active' : 'setting-toggle'}
              onClick={() => setConsent(!farm.whatsapp)}
              aria-label={s('whatsapp')}
              aria-pressed={farm.whatsapp}
            >
              {s(farm.whatsapp ? 'on' : 'off')}
              <span />
            </button>
          </div>
          <div className="setting-row">
            <span>
              <Users size={25} />
              {s('neighbours')}
            </span>
            <button
              className={farm.benchmarkConsent ? 'setting-toggle active' : 'setting-toggle'}
              onClick={() => farm.set({ benchmarkConsent: !farm.benchmarkConsent })}
              aria-pressed={farm.benchmarkConsent}
            >
              {s(farm.benchmarkConsent ? 'on' : 'off')}
              <span />
            </button>
          </div>
          <Action icon={Volume2} onClick={() => setLangOpen(true)}>
            {s('language')}
          </Action>
          <Action secondary icon={MessageCircle} onClick={() => go('inbox')}>
            {s('inbox')}
          </Action>
          <p className="small-note">{s('sync')}</p>
          <details className="demo-options">
            <summary>{s('tryDemo')}</summary>
            <div className="chip-row">
              {['pakka', 'shayad', 'expert', 'healthy'].map((mode) => (
                <button
                  key={mode}
                  className={diagnosisMode === mode ? 'active' : ''}
                  onClick={() => farm.set({ resultMode: mode })}
                >
                  <Leaf size={16} />
                  {s(mode as SimpleKey)}
                </button>
              ))}
            </div>
            <p>{s('sample')}</p>
          </details>
        </div>
      );
    if (page === 'inbox')
      return (
        <div className="center-flow">
          <span className="big-friendly-icon whatsapp-friendly">
            <MessageCircle size={60} strokeWidth={1.3} />
          </span>
          {!farm.whatsapp && (
            <Action icon={MessageCircle} onClick={() => go('consent')}>
              {s('optIn')}
            </Action>
          )}
          {farm.messages.length ? (
            <div className="mock-inbox">
              {farm.messages.slice(0, moreItems).map((message) => (
                <article key={message.id}>
                  <span>
                    <MessageCircle size={18} />
                    {message.channel === 'whatsapp' ? 'WhatsApp' : s('inbox')} · {s('demo')}
                  </span>
                  <p>{message.text}</p>
                  <div>
                    <button onClick={() => say(message.text)}>
                      <Play size={19} />
                      {s('listen')}
                    </button>
                    <button onClick={() => go(message.route)}>
                      <ArrowUpRight size={19} />
                      {s('openApp')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="spoken-line">{s('noMessages')}</p>
          )}
          {farm.messages.length > moreItems && (
            <Action icon={Plus} onClick={() => setMoreItems((v) => v + 3)}>
              {s('showMore')}
            </Action>
          )}
          <Action icon={Bell} onClick={() => sendUpdate('demo', s('organicAdvice'), 'care')}>
            {s('sendDemo')}
          </Action>
          {farm.whatsapp && (
            <Action secondary icon={X} onClick={() => setConsent(false)}>
              {s('stopReply')}
            </Action>
          )}
          <p className="small-note">{s('whatsappMock')}</p>
        </div>
      );
    if (page === 'consent')
      return (
        <div className="center-flow consent-panel">
          <span className="big-friendly-icon whatsapp-friendly">
            <MessageCircle size={70} strokeWidth={1.2} />
          </span>
          <h2>{s('optInTitle')}</h2>
          <p>{s('optInHint')}</p>
          <Action
            icon={Check}
            onClick={() => {
              setConsent(true);
              go('inbox');
            }}
          >
            {s('optIn')}
          </Action>
          <Action secondary icon={ArrowLeft} onClick={() => go('more')}>
            {s('notNow')}
          </Action>
        </div>
      );
    return null;
  }
  return (
    <div className={`simple-app ${page === 'home' ? 'at-home' : ''}`}>
      <header className="simple-header">
        <button className="simple-brand" onClick={() => go('home')} aria-label={s('home')}>
          <span>
            <Sprout size={28} strokeWidth={1.6} />
          </span>
          <div>
            <strong>
              खेत <b>Doctor</b>
            </strong>
            <small>Sahi rog. Sahi dawai. Sahi daam.</small>
          </div>
        </button>
        <div className="simple-header-tools">
          <span className="sync-picture" title={s(online ? 'sync' : 'offline')}>
            {online ? <CloudCheck size={20} /> : <CloudOff size={20} />}
            <span>{s('demo')}</span>
          </span>
          <button
            className="simple-language"
            onClick={() => setLangOpen(true)}
            aria-label={s('language')}
          >
            <span>
              अ<span>A</span>
            </span>
            {lang === 'hi'
              ? 'हिन्दी'
              : lang === 'pa'
                ? 'ਪੰਜਾਬੀ'
                : lang === 'mr'
                  ? 'मराठी'
                  : 'English'}
            <ChevronDown size={15} />
          </button>
          <button className="header-speaker" onClick={() => say()} aria-label={s('listen')}>
            <Volume2 size={24} />
          </button>
        </div>
      </header>
      <main className="simple-main" ref={main}>
        {page !== 'home' && (
          <>
            <div className="simple-stepbar">
              <button onClick={primaryBack}>
                <ArrowLeft size={23} />
                {s('back')}
              </button>
              <button onClick={() => say()}>
                <RotateCcw size={20} />
                {s('repeat')}
              </button>
            </div>
            <div className="simple-page-heading">
              <h1>{s(cropsTitle[page] || 'home')}</h1>
              <button onClick={() => say()} aria-label={s('listen')}>
                <Volume2 size={24} />
              </button>
            </div>
          </>
        )}
        {renderScreen()}
      </main>
      {page !== 'home' && (
        <button
          className="simple-floating-mic"
          onClick={() => {
            setVoice(true);
            setVoiceStatus('');
          }}
          aria-label={s('speak')}
        >
          <Mic size={28} />
        </button>
      )}
      <footer className="simple-footer">
        <Leaf size={14} />
        <span>{s('suggestion')}</span>
        <span className="footer-demo">{s('demo')}</span>
      </footer>
      <input
        className="simple-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        ref={file}
        onChange={(e) => void capturePhoto(e.target.files?.[0])}
      />
      <input
        className="simple-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        ref={listingFile}
        onChange={(e) => void capturePhoto(e.target.files?.[0], true)}
      />
      {toast && (
        <div className="simple-toast" role="status">
          <CheckCircle2 size={23} />
          <span>{toast}</span>
          <button onClick={() => setToast('')} aria-label={s('close')}>
            <X size={20} />
          </button>
        </div>
      )}
      {(voice || number || langOpen) && (
        <div
          className="simple-modal-shade"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setVoice(false);
              setNumber(null);
              setLangOpen(false);
            }
          }}
        >
          <div
            className="simple-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="simple-dialog-title"
            tabIndex={-1}
            ref={overlay}
          >
            <button
              className="simple-modal-close"
              onClick={() => {
                setVoice(false);
                setNumber(null);
                setLangOpen(false);
              }}
              aria-label={s('close')}
            >
              <X size={25} />
            </button>
            {langOpen ? (
              <>
                <h2 id="simple-dialog-title">{s('language')}</h2>
                <p>{s('languageHint')}</p>
                <div className="simple-language-grid">
                  {[
                    ['hi', 'हिन्दी'],
                    ['en', 'English'],
                    ['pa', 'ਪੰਜਾਬੀ'],
                    ['mr', 'मराठी'],
                  ].map(([code, native]) => (
                    <button
                      key={code}
                      className={lang === code ? 'active' : ''}
                      onClick={() => changeLanguage(code!, native!)}
                    >
                      <Volume2 size={25} />
                      <strong>{native}</strong>
                      {lang === code && <Check size={21} />}
                    </button>
                  ))}
                </div>
                {['pa', 'mr'].includes(lang) && <p className="small-note">{s('needsReview')}</p>}
              </>
            ) : number ? (
              <>
                <h2 id="simple-dialog-title">{s(numberLabel[number.target] || 'yield')}</h2>
                <output className="number-display">{number.value || '0'}</output>
                {number.target === 'yield' && (
                  <div className="chip-row">
                    {['quintal', 'kg'].map((unit) => (
                      <button
                        className={yieldUnit === unit ? 'active' : ''}
                        key={unit}
                        onClick={() => setYieldUnit(unit)}
                      >
                        <Wheat size={18} />
                        {s(unit as SimpleKey)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="big-number-pad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() =>
                        setNumber((n) =>
                          n
                            ? {
                                ...n,
                                value:
                                  digit === '⌫'
                                    ? n.value.slice(0, -1)
                                    : digit === '.' && n.value.includes('.')
                                      ? n.value
                                      : n.value.length < 9
                                        ? n.value + digit
                                        : n.value,
                              }
                            : n,
                        )
                      }
                      aria-label={digit === '⌫' ? s('clear') : digit}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
                <Action icon={Check} onClick={updateNumber}>
                  {s('save')}
                </Action>
              </>
            ) : (
              <>
                <span className="voice-modal-icon">
                  <AudioLines size={44} />
                </span>
                <h2 id="simple-dialog-title">{s('voiceTitle')}</h2>
                <button
                  className={`record-circle ${voiceStatus === s('listening') ? 'listening' : ''}`}
                  onClick={record}
                  aria-label={s('voiceTry')}
                >
                  <Mic size={37} />
                </button>
                <p role="status">{voiceStatus || s('voiceFailed')}</p>
                <div className="voice-picture-fallback">
                  {core.map(([route, key, , Icon]) => (
                    <PictureChoice
                      icon={Icon}
                      label={s(key)}
                      key={route}
                      onClick={() => go(route)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// A calendar-shaped crop diary marker without adding another icon dependency.
const CalendarIcon: LucideIcon = CalendarDays;

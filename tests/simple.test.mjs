import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareLand,
  confidenceWord,
  filterLand,
  indiaClock,
  planNotification,
} from '../packages/shared/notifications.mjs';
import { MockNotificationProvider, NotificationService } from '../Backend/notifications.mjs';
import { MockLanguageService } from '../Backend/providers.mjs';
import { benchmarkTips, isBlurry, laplacianVarianceRGBA } from '../packages/shared/vision.mjs';
const day = '2026-10-18T05:00:00Z';
test('on-phone blur threshold distinguishes flat and detailed images', () => {
  const width = 32,
    height = 32;
  const flat = new Uint8ClampedArray(width * height * 4).fill(128),
    detailed = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      detailed[i] = detailed[i + 1] = detailed[i + 2] = (x + y) % 2 ? 255 : 0;
      detailed[i + 3] = 255;
    }
  assert.equal(isBlurry(laplacianVarianceRGBA(flat, width, height)), true);
  assert.equal(isBlurry(laplacianVarianceRGBA(detailed, width, height)), false);
  assert.equal(isBlurry(80), false);
  assert.equal(isBlurry(NaN), true);
});
test('benchmark tips are aggregate-only and ranked by associated yield difference', () => {
  const aggregate = {
    consent: true,
    peerCount: 12,
    self: { yield: 18, sowingOffset: 12, fertiliserSplits: 1, irrigations: 8 },
    top: { yield: 25, sowingOffset: 2, fertiliserSplits: 2, irrigations: 7 },
    averageYield: 21.4,
    associations: { sowing: 4, khaad: 3, water: 1 },
  };
  assert.equal(benchmarkTips({ ...aggregate, peerCount: 4 }), null);
  assert.equal(benchmarkTips({ ...aggregate, consent: false }), null);
  const result = benchmarkTips(aggregate);
  assert.deepEqual(
    result.tips.map((t) => t.key),
    ['sowing', 'khaad', 'water'],
  );
  assert.equal(result.tips[0].difference, 10);
  assert.equal('farmers' in result, false);
});
test('Indian quiet hours include 21:00 through 05:59, even for urgent alerts', () => {
  for (const now of ['2026-10-18T15:30:00Z', '2026-10-18T23:59:00Z', '2026-10-19T00:29:00Z'])
    assert.equal(
      planNotification({ consent: { whatsapp: true }, now, urgent: true }).reason,
      'quiet_hours',
    );
  assert.equal(indiaClock('2026-10-19T00:30:00Z').hour, 6);
});
test('WhatsApp opt-in is enforced; fallback has its own consent', () => {
  assert.equal(planNotification({ consent: { whatsapp: false }, now: day }).reason, 'no_consent');
  assert.equal(
    planNotification({ consent: { whatsapp: false, push: true }, now: day }).channel,
    'push',
  );
});
test('non-urgent daily cap uses the India calendar day', () => {
  const history = Array.from({ length: 2 }, () => ({ status: 'sent', urgent: false, sentAt: day }));
  assert.equal(
    planNotification({ consent: { whatsapp: true }, now: day, history, approvedTemplate: true })
      .reason,
    'daily_limit',
  );
  assert.equal(
    planNotification({
      consent: { whatsapp: true },
      now: day,
      history,
      urgent: true,
      approvedTemplate: true,
    }).status,
    'ready',
  );
});
test('outside service window approved template is mandatory', () => {
  assert.equal(
    planNotification({ consent: { whatsapp: true }, now: day }).reason,
    'template_required',
  );
  assert.equal(
    planNotification({ consent: { whatsapp: true }, now: day, approvedTemplate: true }).format,
    'template_audio_link',
  );
  assert.equal(
    planNotification({
      consent: { whatsapp: true },
      now: day,
      lastInboundAt: '2026-10-18T04:00:00Z',
    }).format,
    'text_audio',
  );
});
test('future inbound timestamp cannot open the service window', () => {
  assert.equal(
    planNotification({
      consent: { whatsapp: true },
      now: day,
      lastInboundAt: '2026-10-19T04:00:00Z',
    }).reason,
    'template_required',
  );
});
test('confidence thresholds have explicit expert, uncertain and healthy paths', () => {
  for (const [confidence, expected] of [
    [0.75, 'pakka'],
    [0.5, 'shayad'],
    [0.49, 'expert'],
  ])
    assert.equal(confidenceWord([{ label: 'rust', confidence }]), expected);
  assert.equal(confidenceWord([{ label: 'unknown', confidence: 0.99 }]), 'expert');
  assert.equal(confidenceWord([{ label: 'healthy', confidence: 0.9 }]), 'healthy');
});
const plots = [
  { id: '1', verified: true, distance: 3, rent: 15000, area: 2, waterKey: 'canal' },
  { id: '2', verified: true, distance: 8, rent: 14000, area: 4, waterKey: 'borewell' },
  { id: '3', verified: false, distance: 1, rent: 1, area: 8, waterKey: 'canal' },
];
test('land filters enforce verification, size, water, rent and radius', () => {
  assert.deepEqual(
    filterLand(plots, { radius: 5, water: 'canal', size: 'small', maxRent: 16000 }).map(
      (p) => p.id,
    ),
    ['1'],
  );
  assert.deepEqual(
    filterLand(plots, { radius: 25 }).map((p) => p.id),
    ['2', '1'],
  );
});
test('comparison labels cheapest and nearest without exposing owner contacts', () => {
  const result = compareLand(plots.slice(0, 2));
  assert.equal(result[0].nearest, true);
  assert.equal(result[1].cheapest, true);
  assert.throws(() => compareLand([...plots, plots[0]]));
});
test('mock notification integration enforces consent and STOP', async () => {
  const whatsapp = new MockNotificationProvider(),
    push = new MockNotificationProvider();
  const service = new NotificationService({
    whatsapp,
    push,
    clock: () => new Date(day),
    languageService: new MockLanguageService(),
  });
  const profile = {
    id: 'demo',
    phone: 'not-a-real-number',
    language: 'hi',
    whatsappOptIn: false,
    pushOptIn: true,
  };
  await service.notify(profile, { kind: 'tip', text: 'sample', approvedTemplate: true });
  assert.equal(whatsapp.sent.length, 0);
  assert.equal(push.sent.length, 1);
  profile.whatsappOptIn = true;
  await service.notify(profile, { kind: 'tip', text: 'sample', approvedTemplate: true });
  assert.equal(whatsapp.sent.length, 1);
  assert.equal(
    (await service.inbound(profile, { type: 'text', text: 'STOP' })).processFurther,
    false,
  );
  assert.equal(profile.whatsappOptIn, false);
});
test('mock inbound leaf photo returns a mock diagnosis and a mock reply', async () => {
  const service = new NotificationService({
    clock: () => new Date(day),
    languageService: new MockLanguageService(),
  });
  const p = { id: 'p2', phone: 'demo', language: 'en', whatsappOptIn: true };
  const result = await service.inbound(p, { type: 'image', crop: 'tomato' });
  assert.equal(result.diagnosis.mock, true);
  assert.equal(result.response.channel, 'whatsapp');
  assert.equal(result.response.mock, true);
});
test('failed WhatsApp falls back to consented push', async () => {
  const service = new NotificationService({
    whatsapp: {
      send: async () => {
        throw new Error('Unavailable');
      },
    },
    clock: () => new Date(day),
  });
  const result = await service.notify(
    { id: 'p3', phone: 'demo', language: 'hi', whatsappOptIn: true, pushOptIn: true },
    { kind: 'land', text: 'sample', approvedTemplate: true },
  );
  assert.equal(result.channel, 'push');
});
test('concurrent mock deliveries cannot exceed the daily cap', async () => {
  const provider = new MockNotificationProvider();
  const service = new NotificationService({ whatsapp: provider, clock: () => new Date(day) });
  const profile = { id: 'parallel', phone: 'demo', language: 'en', whatsappOptIn: true };
  const results = await Promise.all(
    [1, 2, 3].map(() =>
      service.notify(profile, { kind: 'tip', text: 'sample', approvedTemplate: true }),
    ),
  );
  assert.equal(provider.sent.length, 2);
  assert.equal(results.filter((r) => r.reason === 'daily_limit').length, 1);
});
test('STOP during speech preparation is honoured before sending', async () => {
  const profile = { id: 'stop-race', phone: 'demo', language: 'hi', whatsappOptIn: true };
  const provider = new MockNotificationProvider();
  const service = new NotificationService({
    whatsapp: provider,
    clock: () => new Date(day),
    languageService: {
      textToSpeech: async () => {
        profile.whatsappOptIn = false;
        return { audioUrl: null };
      },
    },
  });
  const result = await service.notify(profile, {
    kind: 'tip',
    text: 'sample',
    approvedTemplate: true,
  });
  assert.equal(result.reason, 'no_consent');
  assert.equal(provider.sent.length, 0);
});
test('speech outage does not block a consented text update', async () => {
  const service = new NotificationService({
    clock: () => new Date(day),
    languageService: {
      textToSpeech: async () => {
        throw new Error('Speech unavailable');
      },
    },
  });
  const result = await service.notify(
    { id: 'speech-fallback', phone: 'demo', language: 'hi', whatsappOptIn: true },
    { kind: 'tip', text: 'sample', approvedTemplate: true },
  );
  assert.equal(result.status, 'sent');
  assert.equal(result.audioPending, true);
});
test('mock WhatsApp voice note opens the crop doctor intent', async () => {
  const service = new NotificationService({
    clock: () => new Date(day),
    languageService: new MockLanguageService(),
  });
  const result = await service.inbound(
    { id: 'voice', phone: 'demo', language: 'hi', whatsappOptIn: true },
    { type: 'audio', audio: 'mock-recording' },
  );
  assert.equal(result.intent.intent, 'diagnose');
});

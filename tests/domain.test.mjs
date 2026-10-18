import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aboveGovernmentRate,
  benchmark,
  dose,
  irrigationDecision,
  issueCredit,
  matchingBuyers,
  rankInputs,
  redeemCredit,
  splitFare,
  stubbleEstimate,
  waterBalance,
} from '../packages/shared/domain.mjs';

const listings = [
  {
    id: 'a',
    name: 'urea',
    category: 'fertiliser',
    price: 300,
    units: 45,
    verified: true,
    distance: 1,
    rating: 5,
    deliveryHours: 10,
    commission: 100,
  },
  {
    id: 'b',
    name: 'urea',
    category: 'fertiliser',
    price: 266.5,
    units: 45,
    verified: true,
    distance: 5,
    rating: 4,
    deliveryHours: 20,
    commission: 0,
  },
  {
    id: 'c',
    name: 'urea',
    category: 'fertiliser',
    price: 1,
    units: 45,
    verified: false,
    distance: 0,
    rating: 5,
    deliveryHours: 0,
    commission: 1000,
  },
];
test('verified inputs ranked by effective unit price; commission invariant', () => {
  const first = rankInputs(listings).map((x) => x.id);
  assert.deepEqual(first, ['b', 'a']);
  assert.deepEqual(
    rankInputs(listings.map((x) => ({ ...x, commission: Math.random() * 100000 }))).map(
      (x) => x.id,
    ),
    first,
  );
});
test('dose calculator rounds pack count up and rejects invalid values', () => {
  assert.deepEqual(dose(2.5, 0.5, 1), { quantity: 1.25, packs: 2 });
  assert.throws(() => dose(-1, 1, 1));
  assert.throws(() => dose(1, 1, 0));
});
test('government price flags only above reference', () => {
  assert.equal(aboveGovernmentRate(290, 266.5), true);
  assert.equal(aboveGovernmentRate(266.5, 266.5), false);
  assert.equal(aboveGovernmentRate(290, null), false);
});
test('water balance bounded by soil capacity and zero', () => {
  assert.equal(
    waterBalance({ et0: 4, kc: 1.2, rain: 2, irrigation: 10, previous: 40, capacity: 50 }),
    47.2,
  );
  assert.equal(
    waterBalance({ et0: 40, kc: 1, rain: 0, irrigation: 0, previous: 2, capacity: 50 }),
    0,
  );
});
const sensor = {
  telemetryAgeMinutes: 1,
  sessionMinutes: 0,
  dayMinutes: 10,
  moisture: 20,
  target: 45,
  threshold: 30,
  rainProbability: 10,
  insidePowerSlot: true,
};
test('IoT turns on only in suitable conditions', () => {
  assert.equal(irrigationDecision(sensor).valve, 'ON');
  assert.equal(irrigationDecision({ ...sensor, rainProbability: 70 }).valve, 'OFF');
  assert.equal(irrigationDecision({ ...sensor, insidePowerSlot: false }).valve, 'OFF');
});
test('IoT safety wins over manual ON', () => {
  for (const override of [
    { telemetryAgeMinutes: 11 },
    { sessionMinutes: 45 },
    { dayMinutes: 120 },
    { moisture: 45 },
  ])
    assert.equal(irrigationDecision({ ...sensor, ...override, manual: 'ON' }).valve, 'OFF');
  assert.equal(irrigationDecision({ ...sensor, manual: 'OFF' }).valve, 'OFF');
});
test('invalid or missing sensor values always fail OFF', () => {
  for (const invalid of [NaN, Infinity, -1, undefined])
    assert.equal(irrigationDecision({ ...sensor, moisture: invalid, manual: 'ON' }).valve, 'OFF');
});
test('benchmark suppressed below privacy threshold or without opt-in', () => {
  const peers = Array.from({ length: 12 }, (_, i) => ({
    yield: 20 + i,
    sowingDays: i < 9 ? 12 : 2,
    fertiliserSplits: i < 9 ? 1 : 2,
  }));
  assert.equal(benchmark(peers.slice(0, 4), { sowingDays: 12, fertiliserSplits: 1 }, true), null);
  assert.equal(benchmark(peers, { sowingDays: 12, fertiliserSplits: 1 }, false), null);
  const b = benchmark(peers, { sowingDays: 12, fertiliserSplits: 1 }, true);
  assert.equal(b.count, 12);
  assert.equal(b.topYield, 30);
  assert.deepEqual(b.gaps, [
    { key: 'sowingDays', difference: 10 },
    { key: 'fertiliserSplits', difference: 1 },
  ]);
  assert.equal('peers' in b, false);
});
test('price filter respects minimum and ranks by actual net earnings', () => {
  const offers = [
    {
      id: 'a',
      price: 2600,
      capacity: 100,
      verified: true,
      transport: 2000,
      fees: 100,
      loading: 100,
    },
    {
      id: 'b',
      price: 2550,
      capacity: 100,
      verified: true,
      transport: 100,
      fees: 100,
      loading: 100,
    },
    { id: 'c', price: 2500, capacity: 100, verified: true, transport: 0, fees: 0, loading: 0 },
    { id: 'd', price: 9999, capacity: 100, verified: false, transport: 0, fees: 0, loading: 0 },
  ];
  assert.deepEqual(
    matchingBuyers(offers, 2550, 10).map((x) => x.id),
    ['b', 'a'],
  );
  assert.equal(matchingBuyers(offers, 10000, 10).length, 0);
});
test('shared fare conserves money to the paise', () => {
  const fares = splitFare(100, [1, 1, 1]);
  assert.equal(Math.round(fares.reduce((a, b) => a + b, 0) * 100), 10000);
  assert.deepEqual(splitFare(850, [1500, 500]), [637.5, 212.5]);
  assert.throws(() => splitFare(850, []));
});
test('stubble quantity comes from crop reference and carries confidence', () => {
  assert.deepEqual(stubbleEstimate('wheat', 2.5, 18), { quintals: 67.5, confidence: 0.72 });
  assert.throws(() => stubbleEstimate('unknown', 1, 10));
});
const scheme = { active: true, crops: ['wheat'], rate: 40, cap: 4000, version: 1 };
test('credits require confirmed eligible collection and active versioned rule', () => {
  const collection = { id: 'c1', confirmed: true, crop: 'wheat', quintals: 30 };
  const c = issueCredit(collection, scheme, []);
  assert.equal(c.amount, 1200);
  assert.equal(c.schemeVersion, 1);
  assert.throws(() => issueCredit({ ...collection, confirmed: false }, scheme, []));
  assert.throws(() => issueCredit(collection, { ...scheme, active: false }, []));
  assert.throws(() => issueCredit(collection, scheme, [c]));
  assert.equal(Object.isFrozen(c), true);
});
test('redemptions reject overdrafts and duplicate request IDs', () => {
  const ledger = [{ id: 'credit-1', amount: 1200 }];
  const r = redeemCredit(ledger, 500, 'redeem-1');
  assert.equal(r.amount, -500);
  assert.throws(() => redeemCredit([...ledger, r], 1, 'redeem-1'));
  assert.throws(() => redeemCredit(ledger, 1201, 'redeem-2'));
  assert.throws(() => redeemCredit(ledger, -50, 'redeem-2'));
});

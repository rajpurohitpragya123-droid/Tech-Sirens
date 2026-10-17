// All quantities and rankings are deterministic. No LLM or commission enters these functions.
export const cropReference = [
  ['wheat', 120, 1.5, [0.3, 0.7, 1.15, 0.4]],
  ['rice', 130, 1.4, [1.05, 1.1, 1.2, 0.9]],
  ['maize', 110, 1.2, [0.3, 0.8, 1.2, 0.6]],
  ['tomato', 120, 0.5, [0.6, 0.9, 1.15, 0.8]],
  ['potato', 100, 0.4, [0.5, 0.8, 1.15, 0.75]],
  ['onion', 120, 0.3, [0.7, 0.9, 1.05, 0.75]],
  ['cotton', 180, 1.8, [0.35, 0.8, 1.15, 0.5]],
  ['sugarcane', 360, 0.3, [0.4, 0.9, 1.25, 0.75]],
  ['mustard', 110, 1.3, [0.35, 0.75, 1.15, 0.35]],
  ['chilli', 150, 0.5, [0.6, 0.9, 1.05, 0.9]],
].map(([id, duration, residueFactor, kc]) => ({
  id,
  duration,
  residueFactor,
  kc,
  stageDays: [
    Math.round(duration * 0.17),
    Math.round(duration * 0.25),
    Math.round(duration * 0.38),
    duration -
      Math.round(duration * 0.17) -
      Math.round(duration * 0.25) -
      Math.round(duration * 0.38),
  ],
}));
export function rankInputs(listings, need = '') {
  // Match -> verified -> effective unit price -> distance -> rating -> delivery.
  // Commission is deliberately never read. Unverified vendors are never exposed.
  return listings
    .filter(
      (x) =>
        x.verified &&
        (!need || `${x.name} ${x.category}`.toLowerCase().includes(need.toLowerCase())),
    )
    .toSorted(
      (a, b) =>
        a.price / a.units - b.price / b.units ||
        a.distance - b.distance ||
        b.rating - a.rating ||
        a.deliveryHours - b.deliveryHours,
    );
}
export function dose(areaAcres, dosePerAcre, packSize) {
  if (
    ![areaAcres, dosePerAcre, packSize].every(Number.isFinite) ||
    areaAcres <= 0 ||
    dosePerAcre <= 0 ||
    packSize <= 0
  )
    throw new Error('Positive quantities required');
  const quantity = areaAcres * dosePerAcre;
  return { quantity, packs: Math.ceil(quantity / packSize) };
}
export const aboveGovernmentRate = (price, rate) => rate != null && price > rate;
export function netEarning(offer, quantity) {
  return offer.price * quantity - offer.transport - offer.fees - offer.loading;
}
export function matchingBuyers(offers, minPrice, quantity) {
  return offers
    .filter((x) => x.verified && x.price >= minPrice && x.capacity >= quantity)
    .map((x) => ({ ...x, net: netEarning(x, quantity) }))
    .toSorted((a, b) => b.net - a.net);
}
export function waterBalance({ et0, kc, rain, irrigation, previous, capacity }) {
  return Math.max(0, Math.min(capacity, previous + rain + irrigation - et0 * kc));
}
export function irrigationDecision(s) {
  // OFF has priority over ON, including manual mode. The controller also enforces a local watchdog.
  if (
    ![
      'telemetryAgeMinutes',
      'sessionMinutes',
      'dayMinutes',
      'moisture',
      'target',
      'threshold',
      'rainProbability',
    ].every((k) => Number.isFinite(s[k]) && s[k] >= 0) ||
    s.moisture > 100 ||
    s.target > 100 ||
    s.threshold > s.target
  )
    return { valve: 'OFF', reason: 'Invalid sensor or rule data' };
  if (s.telemetryAgeMinutes > 10) return { valve: 'OFF', reason: 'Telemetry lost' };
  if (s.sessionMinutes >= 45 || s.dayMinutes >= 120)
    return { valve: 'OFF', reason: 'Safety runtime limit' };
  if (s.manual === 'OFF') return { valve: 'OFF', reason: 'Manual stop' };
  if (s.moisture >= s.target) return { valve: 'OFF', reason: 'Target moisture reached' };
  if (s.manual === 'ON') return { valve: 'ON', reason: 'Manual start within safety limits' };
  if (s.moisture < s.threshold && s.rainProbability < 60 && s.insidePowerSlot)
    return { valve: 'ON', reason: 'Below moisture threshold' };
  return { valve: 'OFF', reason: 'Field is fine or waiting for power / weather' };
}
export function splitFare(total, weights) {
  if (weights.some((w) => w <= 0) || !weights.length) throw new Error('Positive weights required');
  const sum = weights.reduce((a, b) => a + b, 0);
  const result = weights.map((w) => Math.floor(((total * w) / sum) * 100) / 100);
  result[result.length - 1] += Math.round((total - result.reduce((a, b) => a + b, 0)) * 100) / 100;
  return result;
}
export function stubbleEstimate(cropId, acres, yieldQuintalsPerAcre) {
  const crop = cropReference.find((c) => c.id === cropId);
  if (!crop || acres <= 0 || yieldQuintalsPerAcre <= 0) throw new Error('Invalid crop or quantity');
  return {
    quintals: Math.round(acres * yieldQuintalsPerAcre * crop.residueFactor * 10) / 10,
    confidence: 0.72,
  };
}
export function benchmark(peers, farmer, optIn) {
  if (!optIn || peers.length < 5) return null;
  const sorted = peers.toSorted((a, b) => b.yield - a.yield),
    top = sorted.slice(0, Math.max(1, Math.ceil(peers.length / 4)));
  const avg = (rows, key) => rows.reduce((s, r) => s + r[key], 0) / rows.length;
  return {
    count: peers.length,
    median: sorted[Math.floor(sorted.length / 2)].yield,
    topYield: avg(top, 'yield'),
    gaps: [
      { key: 'sowingDays', difference: farmer.sowingDays - avg(top, 'sowingDays') },
      {
        key: 'fertiliserSplits',
        difference: avg(top, 'fertiliserSplits') - farmer.fertiliserSplits,
      },
    ]
      .filter((x) => x.difference > 0)
      .slice(0, 3),
  };
}
export function issueCredit(collection, scheme, ledger) {
  if (
    !Number.isFinite(collection.quintals) ||
    collection.quintals <= 0 ||
    !Number.isFinite(scheme.rate) ||
    scheme.rate <= 0 ||
    !Number.isFinite(scheme.cap) ||
    scheme.cap <= 0
  )
    throw new Error('Invalid collection or scheme quantity');
  if (!collection.confirmed || !scheme.active || !scheme.crops.includes(collection.crop))
    throw new Error('Confirmed eligible collection and active scheme required');
  if (ledger.some((x) => x.collectionId === collection.id))
    throw new Error('Collection already credited');
  return Object.freeze({
    id: `credit-${collection.id}`,
    collectionId: collection.id,
    amount: Math.min(collection.quintals * scheme.rate, scheme.cap),
    schemeVersion: scheme.version,
    type: 'credit',
  });
}
export function redeemCredit(ledger, amount, id) {
  if (ledger.some((x) => x.id === id)) throw new Error('Already redeemed');
  const balance = ledger.reduce((s, x) => s + x.amount, 0);
  if (!Number.isFinite(amount) || amount <= 0 || amount > balance)
    throw new Error('Insufficient credits');
  return Object.freeze({ id, amount: -amount, type: 'redemption' });
}

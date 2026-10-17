// Pure delivery policy, shared by the mock service and UI. All times use India time.
export function indiaClock(now) {
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid time');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
}
export function planNotification({
  consent,
  now,
  history = [],
  urgent = false,
  lastInboundAt,
  approvedTemplate = false,
}) {
  const clock = indiaClock(now);
  if (clock.hour >= 21 || clock.hour < 6)
    return { status: 'deferred', reason: 'quiet_hours', channel: null };
  const used = history.filter(
    (n) => n.status === 'sent' && !n.urgent && indiaClock(n.sentAt).day === clock.day,
  ).length;
  if (!urgent && used >= 2) return { status: 'deferred', reason: 'daily_limit', channel: null };
  if (!consent.whatsapp) {
    return consent.push
      ? { status: 'ready', channel: 'push', format: 'text' }
      : consent.sms
        ? { status: 'ready', channel: 'sms', format: 'text' }
        : { status: 'blocked', reason: 'no_consent', channel: null };
  }
  const inboundTime = lastInboundAt ? new Date(lastInboundAt).getTime() : NaN;
  const insideWindow =
    Number.isFinite(inboundTime) &&
    new Date(now).getTime() - inboundTime >= 0 &&
    new Date(now).getTime() - inboundTime < 24 * 60 * 60 * 1000;
  if (insideWindow) return { status: 'ready', channel: 'whatsapp', format: 'text_audio' };
  if (!approvedTemplate) return { status: 'blocked', reason: 'template_required', channel: null };
  // Audio is not a supported WhatsApp template header. Use an approved audio-link CTA.
  return { status: 'ready', channel: 'whatsapp', format: 'template_audio_link' };
}
export function confidenceWord(predictions) {
  const first = predictions[0];
  if (
    !first ||
    !Number.isFinite(first.confidence) ||
    first.confidence < 0 ||
    first.confidence > 1 ||
    first.label === 'unknown' ||
    first.confidence < 0.5
  )
    return 'expert';
  if (first.label === 'healthy') return 'healthy';
  return first.confidence >= 0.75 ? 'pakka' : 'shayad';
}
export function filterLand(
  plots,
  { radius = 25, size = 'all', water = 'all', maxRent = Infinity },
) {
  return plots
    .filter(
      (p) =>
        p.verified &&
        p.distance <= radius &&
        p.rent <= maxRent &&
        (water === 'all' || p.waterKey === water) &&
        (size === 'all' ||
          (size === 'small'
            ? p.area < 3
            : size === 'medium'
              ? p.area >= 3 && p.area <= 5
              : p.area > 5)),
    )
    .toSorted((a, b) => a.rent - b.rent || a.distance - b.distance);
}
export function compareLand(plots) {
  if (plots.length > 3) throw new Error('Compare up to three plots');
  return plots.map((p) => ({
    ...p,
    cheapest: p.rent === Math.min(...plots.map((x) => x.rent)),
    nearest: p.distance === Math.min(...plots.map((x) => x.distance)),
  }));
}

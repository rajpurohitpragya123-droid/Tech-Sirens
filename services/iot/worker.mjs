import mqtt from 'mqtt';
import { z } from 'zod';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { irrigationDecision } from '../../packages/shared/domain.mjs';
const url = process.env.MQTT_URL;
if (!url) throw new Error('MQTT_URL required');
if (!url.startsWith('mqtts://') && process.env.IOT_DEMO !== 'true')
  throw new Error('Production MQTT must use TLS');
const schema = z
  .object({
    moisture: z.number().min(0).max(100),
    temperature: z.number().min(-20).max(70),
    humidity: z.number().min(0).max(100),
    battery: z.number().min(0).max(100),
    timestamp: z.number().int().positive(),
  })
  .strict();
const mappings = JSON.parse(process.env.DEVICE_FIELDS || '{}');
if (!Object.keys(mappings).length)
  throw new Error('Provision DEVICE_FIELDS device-to-field mapping before starting worker');
const stateDir = process.env.STATE_DIR || './runtime';
mkdirSync(stateDir, { recursive: true });
const statePath = `${stateDir}/iot-state.json`;
let stored = {};
try {
  stored = JSON.parse(readFileSync(statePath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.info('No saved runtime state. All valves start OFF.');
}
const states = new Map(
  Object.entries(stored).map(([id, s]) => [
    id,
    { ...s, reading: null, lastSeen: 0, valve: 'OFF', startedAt: 0 },
  ]),
);
const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  ca: process.env.MQTT_CA_PATH ? readFileSync(process.env.MQTT_CA_PATH) : undefined,
  rejectUnauthorized: true,
});
const persist = () => writeFileSync(statePath, JSON.stringify(Object.fromEntries(states)));
function publish(field, device, command, reason) {
  const commandId = crypto.randomUUID();
  client.publish(
    `farm/${field}/${device}/command`,
    JSON.stringify({
      commandId,
      command,
      reason,
      expiresAt: Date.now() + 60000,
      maxRuntimeSeconds: 45 * 60,
    }),
    { qos: 1, retain: false },
  );
  console.log(JSON.stringify({ event: 'command', device, command, reason, commandId }));
}
client.on('connect', () => {
  client.subscribe(['farm/+/+/telemetry', 'farm/+/+/ack'], { qos: 1 });
  for (const [device, field] of Object.entries(mappings))
    publish(field, device, 'OFF', 'Worker boot: failsafe OFF');
});
client.on('message', (topic, payload) => {
  const [, field, device, type] = topic.split('/');
  if (mappings[device] !== field) return;
  try {
    const message = JSON.parse(payload.toString());
    if (type === 'ack') {
      if (typeof message.commandId === 'string' && ['ON', 'OFF'].includes(message.valve))
        console.log(JSON.stringify({ event: 'ack', device, ...message }));
      return;
    }
    const parsed = schema.safeParse(message);
    if (!parsed.success || Math.abs(Date.now() - parsed.data.timestamp) > 60000) return;
    const day = new Date().toISOString().slice(0, 10),
      old = states.get(device) || {};
    states.set(device, {
      ...old,
      day,
      dayMinutes: old.day === day ? old.dayMinutes || 0 : 0,
      valve: old.valve || 'OFF',
      startedAt: old.startedAt || 0,
      reading: parsed.data,
      lastSeen: Date.now(),
    });
    persist();
    console.log(JSON.stringify({ event: 'telemetry', device, field, ...parsed.data }));
  } catch {
    console.warn('Rejected invalid MQTT payload');
  }
});
setInterval(() => {
  for (const [device, field] of Object.entries(mappings)) {
    const s = states.get(device);
    if (!s?.reading) continue;
    const now = Date.now(),
      sessionMinutes = s.valve === 'ON' ? (now - s.startedAt) / 60000 : 0;
    // Until a trusted live rain source and per-farm power schedule are wired, automatic ON is disabled.
    const decision = irrigationDecision({
      telemetryAgeMinutes: (now - s.lastSeen) / 60000,
      sessionMinutes,
      dayMinutes: s.dayMinutes + sessionMinutes,
      moisture: s.reading.moisture,
      target: 45,
      threshold: 30,
      rainProbability: 100,
      insidePowerSlot: false,
    });
    if (decision.valve !== s.valve) {
      publish(field, device, decision.valve, decision.reason);
      if (decision.valve === 'ON') s.startedAt = now;
      else {
        s.dayMinutes += sessionMinutes;
        s.startedAt = 0;
      }
      s.valve = decision.valve;
      persist();
    }
  }
}, 1000);
client.on('error', (error) => console.error('MQTT connection error', error.message));
process.on('SIGTERM', () => {
  for (const [device, field] of Object.entries(mappings))
    publish(field, device, 'OFF', 'Worker shutting down');
  persist();
  client.end(false, () => process.exit(0));
});

import mqtt from 'mqtt';
if (process.env.IOT_DEMO !== 'true') throw new Error('Explicit IOT_DEMO=true required');
const mappings = JSON.parse(process.env.DEVICE_FIELDS || '{}');
const client = mqtt.connect(process.env.MQTT_URL || 'mqtt://localhost:1883');
const devices = new Map(
  Object.keys(mappings).map((id) => [
    id,
    { valve: 'OFF', moisture: 28 + Math.random() * 5, offAt: 0 },
  ]),
);
client.on('connect', () => {
  for (const [device, field] of Object.entries(mappings))
    client.subscribe(`farm/${field}/${device}/command`, { qos: 1 });
});
client.on('message', (topic, payload) => {
  try {
    const [, field, id] = topic.split('/'),
      command = JSON.parse(payload.toString()),
      s = devices.get(id);
    if (!s || mappings[id] !== field || command.expiresAt < Date.now()) return;
    if (!['ON', 'OFF'].includes(command.command)) return;
    s.valve = command.command;
    s.offAt = Date.now() + Math.min(command.maxRuntimeSeconds || 60, 2700) * 1000;
    client.publish(
      `farm/${field}/${id}/ack`,
      JSON.stringify({ commandId: command.commandId, valve: s.valve }),
      { qos: 1 },
    );
  } catch {
    console.warn('Discarded invalid simulator command');
  }
});
setInterval(() => {
  for (const [id, s] of devices) {
    if (Date.now() > s.offAt) s.valve = 'OFF';
    s.moisture = Math.min(50, Math.max(15, s.moisture + (s.valve === 'ON' ? 0.7 : -0.02)));
    const field = mappings[id];
    client.publish(
      `farm/${field}/${id}/telemetry`,
      JSON.stringify({
        moisture: Math.round(s.moisture * 10) / 10,
        temperature: 28,
        humidity: 62,
        battery: 93,
        timestamp: Date.now(),
      }),
      { qos: 1 },
    );
  }
}, 5000);

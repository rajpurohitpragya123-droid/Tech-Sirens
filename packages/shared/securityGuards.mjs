/**
 * Telemetry and input security guards for IoT soil sensors and farmer input.
 */

export interface TelemetryPayload {
  deviceId: string;
  moisturePercent: number;
  temperatureCelsius: number;
  phValue: number;
  nitrogenMgKg: number;
  phosphorusMgKg: number;
  potassiumMgKg: number;
  timestamp: string;
}

export function validateTelemetryPayload(data: unknown): TelemetryPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Telemetry payload must be an object');
  }

  const p = data as Record<string, unknown>;

  if (typeof p.deviceId !== 'string' || !p.deviceId.trim()) {
    throw new Error('Invalid or missing deviceId');
  }

  const moisture = Number(p.moisturePercent);
  if (isNaN(moisture) || moisture < 0 || moisture > 100) {
    throw new Error('Moisture must be between 0% and 100%');
  }

  const temp = Number(p.temperatureCelsius);
  if (isNaN(temp) || temp < -20 || temp > 65) {
    throw new Error('Temperature reading out of plausible agricultural range (-20 to 65 C)');
  }

  const ph = Number(p.phValue);
  if (isNaN(ph) || ph < 0 || ph > 14) {
    throw new Error('Soil pH must be between 0 and 14');
  }

  return {
    deviceId: p.deviceId.trim(),
    moisturePercent: moisture,
    temperatureCelsius: temp,
    phValue: ph,
    nitrogenMgKg: Number(p.nitrogenMgKg) || 0,
    phosphorusMgKg: Number(p.phosphorusMgKg) || 0,
    potassiumMgKg: Number(p.potassiumMgKg) || 0,
    timestamp: typeof p.timestamp === 'string' ? p.timestamp : new Date().toISOString(),
  };
}

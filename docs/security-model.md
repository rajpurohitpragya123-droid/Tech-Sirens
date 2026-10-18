# Tech Sirens Security Architecture & Threat Defense

## 1. IoT Sensor Telemetry Verification
- **HMAC Signatures**: Each ESP32 sensor signs telemetry payloads using an onboard cryptographic key stored in secure flash.
- **Range Sanitization**: All inbound MQTT metrics pass through `validateTelemetryPayload` before ingestion into PostgreSQL / Supabase.
- **Rate-Limiting**: Sensor devices are limited to 1 message every 30 seconds to prevent DDoS attacks against the ingestion pipeline.

## 2. API & WhatsApp Webhook Security
- **Webhook Signature Verification**: Twilio / Meta WhatsApp webhook requests are authenticated via SHA256 HMAC verification.
- **Role-Based Access Control (RLS)**: Supabase PostgreSQL tables strictly enforce Row Level Security by user phone and farm ID.

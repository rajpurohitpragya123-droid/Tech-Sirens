# MQTT reference services

`docker compose --profile demo up --build` starts isolated demo MQTT, worker, simulator and mock ML. Broker has no host port. Anonymous MQTT exists only on the isolated demo network; production configuration requires TLS, individual device credentials and per-topic ACLs. No secrets are bundled.

Simulator responds to expiring commands with acknowledgements and changes synthetic moisture. Worker validates topic provisioning, payload ranges and timestamps; logs command/ack/telemetry JSON and persists runtime counters. **Automatic ON is deliberately disabled** until trusted weather, per-farm power slots, authenticated manual control, ack timeout handling and transactional database ingestion are implemented. Unit tests exercise the rule decisions separately. Browser pump controls are a local simulation, not connected to this worker. Daily counters require durable storage and replay/clock-change hardening before production.

Pending: authenticated Supabase ingestion, database command audit, expected-command/ack correlation and timeout, sensor/controller pairing, verified live forecasts, full installation/subscription/maintenance flow and MQTT integration tests. Reference code must not be connected to a real pump yet.

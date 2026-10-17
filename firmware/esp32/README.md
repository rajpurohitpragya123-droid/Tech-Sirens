# ESP32 reference controller

PlatformIO Arduino controller skeleton. Define `WIFI_SSID`, `WIFI_PASSWORD`, `BROKER_CA`, `MQTT_HOST`, `MQTT_USERNAME`, `MQTT_PASSWORD`, `DEVICE_ID`, `COMMAND_TOPIC`, `ACK_TOPIC` in an ignored `src/secrets.h`. Uses certificate verification; never call `setInsecure()`.

Boot, Wi-Fi loss and MQTT loss set active-HIGH GPIO 26 LOW/OFF. ON requires synchronized epoch time and a command expiring within 60 seconds. A 60-second local command watchdog and 45-minute hard timeout protect the reference relay. Each accepted command publishes an acknowledgement. The service must renew valid commands while irrigating, without resetting the session start time.

Not built/flashed here. Pending: hardware watchdog, sensor node with calibrated root-depth probe and real humidity sensor, persistent daily runtime cap, replay protection, QR provisioning, signed updates, acknowledged automatic-stop events and independent electrical commissioning. Use only an isolated low-voltage bench relay until reviewed. Firmware does not by itself satisfy the full production safety specification.

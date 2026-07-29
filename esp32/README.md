# ESP32 Firmware — Poultry Farm

## Setup Instructions

### 1. Install Arduino IDE & Libraries

1. Install [Arduino IDE](https://www.arduino.cc/en/software)
2. Add ESP32 board support:
   - File → Preferences → Additional Boards Manager URLs:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → search "ESP32" → install
3. Install libraries (Tools → Manage Libraries):
   - **DHT sensor library** by Adafruit
   - **Adafruit Unified Sensor**
   - **ArduinoJson** by Benoit Blanchon

### 2. Configure the Sketch

Open `poultry-farm-esp32.ino` and update these values at the top:

```cpp
const char* WIFI_SSID       = "YourWiFiName";
const char* WIFI_PASSWORD   = "YourWiFiPassword";
const char* HOUSE_ID        = "";  // ← get from your database
```

**Get the House UUID:**
1. Open your Supabase dashboard → Table Editor → `houses` table
2. Copy the `id` of your house (looks like `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`)
3. Paste it into `HOUSE_ID` in the sketch
4. If left empty, the `house_id` field won't be sent and Supabase will store `null`

### 3. Wiring

| ESP32 Pin | Connects To |
|-----------|-------------|
| 3.3V      | DHT22 VCC, MQ-135 VCC |
| GND       | DHT22 GND, MQ-135 GND |
| D4        | DHT22 DATA (with 10kΩ pull-up to 3.3V) |
| D36 (ADC) | MQ-135 AOUT |
| D16       | Relay IN1 (Fan) |
| D17       | Relay IN2 (Heater) |

### 4. Upload

1. Select board: Tools → Board → ESP32 → "ESP32 Dev Module"
2. Select port: Tools → Port → COMx
3. Click Upload (→)
4. Open Serial Monitor (Tools → Serial Monitor, 115200 baud) to verify

## How It Works

| Interval | Action |
|----------|--------|
| Every **5 seconds** | Reads temperature, controls relays |
| Every **60 seconds** | POSTs {temperature, humidity, air_quality, fan_status, heater_status} to Supabase |

### Control Logic (matches the web dashboard)

```
Temperature     Fan         Heater
─────────────   ─────────   ─────────
< 30°C          OFF         ON
30°C – 34°C     OFF         Hysteresis (maintain)
> 34°C          ON          OFF
```

## Troubleshooting

| Problem | Check |
|---------|-------|
| No data in database | Serial Monitor shows POST response code; verify `SUPABASE_URL` and `SUPABASE_ANON` |
| DHT reads `nan` | Wiring (10kΩ pull-up required); try DHT11 library mode |
| WiFi won't connect | SSID/password correct? 2.4 GHz band only |
| Relay not switching | Verify relay VCC/GND and signal pin; check external power if relay requires >5V |
| Air quality stuck | MQ-135 needs 24h warm-up; analog pin may need voltage divider (3.3V max) |

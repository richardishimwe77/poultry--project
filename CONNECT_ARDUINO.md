# Connecting ESP32 to Supabase Database

## Architecture

```
ESP32 (sensors) ──HTTPS POST──> Supabase REST API ──> sensor_readings table
                                      │
                            Next.js (reads via API routes)
                                      │
                              Chart.js UI (displays)
```

The ESP32 posts sensor data directly to Supabase's REST API using your existing Arduino code's sensor readings. No intermediate server needed.

---

## Step 1: Create the `sensor_readings` Table in Supabase

Go to your Supabase dashboard → **SQL Editor** → run:

```sql
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  temperature DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  air_quality INTEGER NOT NULL,
  fan_status BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast time-range queries
CREATE INDEX idx_sensor_readings_created_at ON sensor_readings (created_at DESC);
```

## Step 2: Set Row Level Security (RLS)

Enable RLS and create a policy that lets your ESP32 insert rows using the anon key:

```sql
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon key (your ESP32)
CREATE POLICY "Allow anon inserts" ON sensor_readings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon selects for reading data
CREATE POLICY "Allow anon selects" ON sensor_readings
  FOR SELECT
  TO anon
  USING (true);
```

> **Security note**: In production, generate a restricted API key or use service-role key stored in a backend. For a local/personal IoT project, the anon key with RLS limiting inserts is acceptable.

## Step 3: Get Your Supabase Credentials

From your Supabase dashboard → **Project Settings** → **API**:

| Variable | Where to find |
|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Project Settings → API → anon public key |
| `REST_ENDPOINT` | `https://[project-ref].supabase.co/rest/v1/sensor_readings` |

## Step 4: Install Arduino Libraries

You'll need these libraries in the Arduino IDE:

| Library | Purpose |
|---|---|
| **WiFi** (built-in ESP32) | Connect to WiFi |
| **WiFiClientSecure** (built-in ESP32) | HTTPS connection |
| **ArduinoJson** by Benoit Blanchon | Build JSON payload |

Install **ArduinoJson** via Library Manager (Search → Install).

## Step 5: Arduino Code to POST to Supabase

Add this alongside your existing `thingProperties.h`, DHT, and OLED code.

### Configuration

```cpp
// WiFi credentials
const char* WIFI_SSID = "Richard";
const char* WIFI_PASSWORD = "987654321";

// Supabase credentials
const char* SUPABASE_URL = "https://npkvtrlahuigbjsvrwlh.supabase.co";
const char* SUPABASE_ANON_KEY = "sb_publishable_TRRDX4RknRmVdPP6bfQqOA_skzWVuF2";
const char* SUPABASE_TABLE = "sensor_readings";

// HTTPS settings
const char* SUPABASE_HOST = "your-project-ref.supabase.co";
const int HTTPS_PORT = 443;
```

### Helper Function

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

WiFiClientSecure client;

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void sendToSupabase(float temperature, float humidity, int airQuality, bool fanStatus) {
  if (WiFi.status() != WL_CONNECTED) return;

  client.setInsecure();  // Skip certificate validation (simpler for IoT)

  if (!client.connect(SUPABASE_HOST, HTTPS_PORT)) {
    Serial.println("Supabase connection failed");
    return;
  }

  // Build JSON payload
  JsonDocument doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["air_quality"] = airQuality;
  doc["fan_status"] = fanStatus;

  String jsonString;
  serializeJson(doc, jsonString);

  // Build HTTP POST request
  String body = jsonString;
  String request = String("POST /rest/v1/") + SUPABASE_TABLE + " HTTP/1.1\r\n" +
    "Host: " + SUPABASE_HOST + "\r\n" +
    "apikey: " + SUPABASE_ANON_KEY + "\r\n" +
    "Authorization: Bearer " + SUPABASE_ANON_KEY + "\r\n" +
    "Content-Type: application/json\r\n" +
    "Prefer: return=minimal\r\n" +
    "Content-Length: " + body.length() + "\r\n" +
    "Connection: close\r\n\r\n" +
    body;

  client.print(request);

  // Wait for response (optional)
  unsigned long timeout = millis() + 5000;
  while (client.available() == 0 && millis() < timeout) delay(1);

  if (client.available() > 0) {
    String line = client.readStringUntil('\n');
    Serial.print("Supabase response: ");
    Serial.println(line);
  }

  client.stop();
}
```

### Integrate into `loop()`

Call `sendToSupabase()` after reading sensors (but not every 2s — rate-limit to avoid hitting Supabase quotas):

```cpp
unsigned long lastUpload = 0;
const long uploadInterval = 30000;  // Every 30 seconds

void loop() {
  ArduinoCloud.update();

  unsigned long now = millis();

  if (now - previousMillis >= interval) {
    previousMillis = now;
    readSensors();
    updateDisplay();

    // Print to serial (your existing code)
    Serial.print("Temperature: "); Serial.print(temperature); Serial.print(" C");
    Serial.print(" | Humidity: "); Serial.print(humidity); Serial.print(" %");
    Serial.print(" | Air Quality: "); Serial.print(airQuality);
    Serial.print(" | Fan: "); Serial.print(fan ? "ON" : "OFF");
    Serial.print(" | Heater: "); Serial.println(digitalRead(HEATER_PIN) ? "ON" : "OFF");
  }

  // Upload to Supabase every 30 seconds
  if (now - lastUpload >= uploadInterval) {
    lastUpload = now;
    sendToSupabase(temperature, humidity, airQuality, fan);
  }
}
```

### Add `setup()` call

In `setup()`, add `connectWiFi()` after the serial and display init:

```cpp
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(HEATER_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(HEATER_PIN, LOW);
  dht.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED allocation failed");
    while (true);
  }
  display.clearDisplay();
  display.display();

  connectWiFi();  // <-- add this

  initProperties();
  ArduinoCloud.begin(ArduinoIoTPreferredConnection);
  setDebugMessageLevel(2);
  ArduinoCloud.printDebugInfo();
}
```

---

## Step 6: Verify Data Flow

1. Upload the sketch to your ESP32
2. Open Serial Monitor (115200 baud)
3. Watch for:
   ```
   WiFi connected
   IP: 192.168.x.x
   Supabase response: HTTP/1.1 201 Created
   ```
4. Check Supabase Table Editor — rows should appear in `sensor_readings`
5. Visit your Next.js app at `/graph` — pick a filter and data should display

---

## Step 7: Configure `sensor_readings` in Your Next.js App

Edit the `.env.local` in `C:\Users\user\Documents\Paultry_IoT`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkFub24ifQ...
```

Restart the dev server:

```
npm run dev
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| ESP32 can't connect to WiFi | Check SSID/password, router range |
| Supabase connection fails | Verify `SUPABASE_HOST` (from URL), check internet |
| `HTTP/1.1 401 Unauthorized` | Anon key is wrong or RLS policy missing |
| `HTTP/1.1 404 Not Found` | Table name mismatch (`sensor_readings`) |
| No data in Next.js charts | Refresh page, check `.env.local` values |
| Certificate error | `client.setInsecure()` skips SSL verify (ok for testing) |
| Data shows but delayed | Increase `uploadInterval` or check WiFi stability |

## Optional: Use a Next.js API Route as Proxy

If you prefer not to expose Supabase anon key on the ESP32, POST to a Next.js API route instead:

```cpp
String request = String("POST /api/sensor/reading HTTP/1.1\r\n") +
  "Host: your-nextjs-app.vercel.app\r\n" +  // or your local IP
  "Content-Type: application/json\r\n" +
  "Content-Length: " + body.length() + "\r\n" +
  "Connection: close\r\n\r\n" +
  body;
```

Then create `src/app/api/sensor/reading/route.ts` in Next.js to receive and insert into Supabase using the service-role key (safer).

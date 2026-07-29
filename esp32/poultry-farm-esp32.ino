/*
 * Poultry Farm — ESP32 Firmware
 *
 * Reads DHT11 (temp/humidity) and MQ-135 (air quality),
 * controls Fan (pin 19) and Heater (pin 14) relays,
 * displays on OLED (SSD1306, I2C), and posts readings
 * to Supabase REST API every 60 seconds.
 *
 * Also polls Supabase every 10 seconds for manual
 * fan/heater commands from the web dashboard.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ===================== CONFIGURATION =====================

// WiFi
const char* WIFI_SSID     = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";

// Supabase
const char* SUPABASE_URL    = "https://npkvtrlahuigbjsvrwlh.supabase.co";
const char* SUPABASE_ANON   = "sb_publishable_TRRDX4RknRmVdPP6bfQqOA_skzWVuF2";
const char* SUPABASE_TABLE  = "sensor_readings";

// House UUID — get from your Supabase "houses" table
const char* HOUSE_ID        = "your-house-uuid-here";

// Pin assignments (your existing wiring)
#define DHTPIN          15
#define DHTTYPE         DHT11
#define MQ_PIN          34
#define FAN_PIN         19
#define HEATER_PIN      14
#define OLED_SDA        21
#define OLED_SCL        22

// Timing (milliseconds)
#define SEND_INTERVAL     60000   // POST to Supabase every 60s
#define POLL_INTERVAL     10000   // Check web commands every 10s
#define CONTROL_INTERVAL   2000   // Control logic + display every 2s

// Temperature thresholds (matching your existing logic)
#define TEMP_HIGH         34.0
#define TEMP_LOW          30.0

// ==========================================================

// OLED
#define SCREEN_WIDTH  128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// DHT
DHT dht(DHTPIN, DHTTYPE);

// Sensor values (local copies, replacing Arduino IoT Cloud variables)
float temperature = 0.0;
float humidity    = 0.0;
int   airQuality  = 0;
bool  fan         = false;   // current physical relay state
bool  heater      = false;   // current physical relay state

// Timing
unsigned long lastSend    = 0;
unsigned long lastPoll    = 0;
unsigned long lastControl = 0;

// Auto/manual state tracking
bool fanAutoOverride    = false;
bool heaterAutoOverride = false;

void setup() {
  Serial.begin(115200);

  Wire.begin(OLED_SDA, OLED_SCL);

  pinMode(FAN_PIN, OUTPUT);
  pinMode(HEATER_PIN, OUTPUT);
  digitalWrite(FAN_PIN, LOW);
  digitalWrite(HEATER_PIN, LOW);

  dht.begin();

  // Init OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED allocation failed");
    // Continue without display
  }
  display.clearDisplay();
  display.display();

  // Connect WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi failed — running offline");
  }
}

void loop() {
  unsigned long now = millis();

  // ──── Control logic + display (every 2s) ────
  if (now - lastControl >= CONTROL_INTERVAL) {
    lastControl = now;
    readSensors();
    runControlLogic();
    updateDisplay();
  }

  // ──── POST reading to Supabase (every 60s) ────
  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    sendReading();
  }

  // ──── Poll for web commands (every 10s) ────
  if (now - lastPoll >= POLL_INTERVAL) {
    lastPoll = now;
    pollWebCommands();
  }
}

// ============= READ SENSORS =============
void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (!isnan(t)) temperature = t;
  if (!isnan(h)) humidity    = h;

  int raw = analogRead(MQ_PIN);
  airQuality = map(raw, 0, 4095, 0, 800);

  Serial.printf("Sensors — Temp: %.1f°C  Hum: %.1f%%  AirQ: %d\n",
    temperature, humidity, airQuality);
}

// ============= CONTROL LOGIC =============
void runControlLogic() {
  bool prevFan    = fan;
  bool prevHeater = heater;

  // ── Automatic thresholds (override if conditions are met) ──
  if (temperature > TEMP_HIGH) {
    // Too hot: fan ON, heater OFF
    fan    = true;
    heater = false;
    fanAutoOverride    = true;
    heaterAutoOverride = true;
  } else if (temperature < TEMP_LOW) {
    // Too cold: fan OFF, heater ON
    fan    = false;
    heater = true;
    fanAutoOverride    = true;
    heaterAutoOverride = true;
  } else {
    // Normal range: respect manual state from web (no auto-override)
    fanAutoOverride    = false;
    heaterAutoOverride = false;
    // fan and heater keep their current values (set by web or previous state)
  }

  // ── Safety: never have both fan and heater ON simultaneously ──
  if (fan && heater) {
    heater = false;
  }

  // Apply to relays
  digitalWrite(FAN_PIN,    fan    ? HIGH : LOW);
  digitalWrite(HEATER_PIN, heater ? HIGH : LOW);

  if (fan != prevFan || heater != prevHeater) {
    Serial.printf("Relays changed — Fan: %s  Heater: %s  (auto: %s/%s)\n",
      fan    ? "ON" : "OFF",
      heater ? "ON" : "OFF",
      fanAutoOverride    ? "yes" : "no",
      heaterAutoOverride ? "yes" : "no");
  }
}

// ============= POST READING TO SUPABASE =============
void sendReading() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi down — skipping send");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["house_id"]       = HOUSE_ID;
  doc["temperature"]    = round(temperature * 10) / 10.0;
  doc["humidity"]       = round(humidity * 10) / 10.0;
  doc["air_quality"]    = airQuality;
  doc["fan_status"]     = fan;
  doc["heater_status"]  = heater;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + SUPABASE_TABLE;
  http.begin(url);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON));
  http.addHeader("Prefer",        "return=minimal");

  int code = http.POST(body);
  Serial.printf("POST /rest/v1/%s → %d\n", SUPABASE_TABLE, code);
  http.end();
}

// ============= POLL WEB COMMANDS =============
void pollWebCommands() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (fanAutoOverride || heaterAutoOverride) {
    // Auto-override active — don't apply web commands until temp normalizes
    return;
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/" + SUPABASE_TABLE
    + "?select=fan_status,heater_status"
    + "&house_id=eq." + String(HOUSE_ID)
    + "&order=created_at.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey",        SUPABASE_ANON);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON));

  int code = http.GET();
  if (code == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (!err && doc.size() > 0) {
      bool webFan    = doc[0]["fan_status"]    | fan;
      bool webHeater = doc[0]["heater_status"] | heater;

      // Only apply if different and no auto-override is active
      if (webFan != fan && !fanAutoOverride) {
        fan = webFan;
        digitalWrite(FAN_PIN, fan ? HIGH : LOW);
        Serial.printf("Web command — Fan set to %s\n", fan ? "ON" : "OFF");
      }
      if (webHeater != heater && !heaterAutoOverride) {
        // Safety: don't turn heater ON if fan is ON
        if (!webHeater || !fan) {
          heater = webHeater;
          digitalWrite(HEATER_PIN, heater ? HIGH : LOW);
          Serial.printf("Web command — Heater set to %s\n", heater ? "ON" : "OFF");
        }
      }
    }
  }
  http.end();
}

// ============= OLED DISPLAY =============
void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println(" Poultry Farm");

  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  display.setCursor(0, 18);
  display.print("Temp : ");
  display.print(temperature, 1);
  display.println(" C");

  display.setCursor(0, 30);
  display.print("Hum  : ");
  display.print(humidity, 1);
  display.println(" %");

  display.setCursor(0, 42);
  display.print("AirQ : ");
  display.print(airQuality);

  display.setCursor(0, 54);
  display.print("Fan:");
  display.print(fan ? "ON" : "OFF");
  if (fanAutoOverride) display.print("*");

  display.setCursor(65, 54);
  display.print("Heat:");
  display.print(heater ? "ON" : "OFF");
  if (heaterAutoOverride) display.print("*");

  display.display();
}

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// --- Replace with your WiFi Credentials ---
const char* ssid = "MLDEV";
const char* password = "Aysyw2ch?";
// --- ------------------------------------ ---

// --- Replace with your Cloudflare Worker Endpoint URL ---
const char* serverUrl = "YOUR_CLOUDFLARE_WORKER_URL";
// --- ------------------------------------------------ ---

unsigned long lastRequestTime = 0;
const long requestInterval = 30000; // Send request every 30 seconds

void setup() {
  Serial.begin(115200);
  delay(10);

  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Check WiFi status and reconnect if necessary
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Disconnected. Reconnecting...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      Serial.print(".");
    }
    Serial.println("WiFi reconnected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  }

  unsigned long currentTime = millis();
  if (currentTime - lastRequestTime >= requestInterval) {
    lastRequestTime = currentTime;

    // Use WiFiClient class to create TCP connections
    WiFiClient client;
    HTTPClient http;

    Serial.print("[HTTP] begin...
");
    // configure target server and url
    if (http.begin(client, serverUrl)) { // HTTP

      Serial.print("[HTTP] POST...
");
      // start connection and send HTTP header
      http.addHeader("Content-Type", "application/json"); // Specify content type

      // --- Prepare your data payload (e.g., JSON) ---
      // For complex JSON, consider using the ArduinoJson library
      String payload = "{\"sensor\":\"esp8266\", \"value\":";
      payload += random(100); // Example: send a random value
      payload += "}";
      // --- -------------------------------------- ---

      int httpCode = http.POST(payload);

      // httpCode will be negative on error
      if (httpCode > 0) {
        // HTTP header has been send and Server response header has been handled
        Serial.printf("[HTTP] POST... code: %d
", httpCode);

        // file found at server
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String response = http.getString();
          Serial.println("[HTTP] Response:");
          Serial.println(response);
        } else {
            Serial.printf("[HTTP] POST... failed, error: %s
", http.errorToString(httpCode).c_str());
        }
      } else {
        Serial.printf("[HTTP] POST... failed, error: %s
", http.errorToString(httpCode).c_str());
      }

      http.end();
    } else {
      Serial.printf("[HTTP] Unable to connect
");
    }
  }
} 
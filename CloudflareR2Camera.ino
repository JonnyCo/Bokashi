#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <SPIFFS.h>

// Camera model
#define CAMERA_MODEL_XIAO_ESP32S3 // Has PSRAM

#include "camera_pins.h"

// WiFi credentials
const char* ssid = "MLDEV";
const char* password = "Aysyw2ch?";

// API endpoint configuration
const char* api_endpoint = "https://cloudflare-server.kyeshimizu.workers.dev/image";

// Time settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

// Function prototypes
void initCamera();
bool captureImage(const char* filename);
bool uploadToApi(const char* filename);
String getTimestamp();

unsigned long lastCaptureTime = 0;
const unsigned long captureInterval = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  while(!Serial);
  Serial.println("XIAO ESP32S3 Camera Upload");

  // Initialize SPIFFS for temporary file storage
  if(!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed");
    return;
  }
  
  // Check SPIFFS status
  uint32_t totalBytes = SPIFFS.totalBytes();
  uint32_t usedBytes = SPIFFS.usedBytes();
  Serial.println("SPIFFS Status:");
  Serial.printf("Total space: %u bytes\n", totalBytes);
  Serial.printf("Space used: %u bytes\n", usedBytes);
  Serial.printf("Free space: %u bytes\n", totalBytes - usedBytes);

  // Initialize camera
  initCamera();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Init and get the time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Waiting for NTP time sync");
  delay(2000);
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  Serial.println("Time synchronized");
}

void loop() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastCaptureTime >= captureInterval) {
    lastCaptureTime = currentMillis;
    
    String filename = "/img_" + String(currentMillis) + ".jpg";
    
    if (captureImage(filename.c_str())) {
      if (uploadToApi(filename.c_str())) {
        Serial.println("Upload successful");
      } else {
        Serial.println("Upload failed");
      }
    } else {
      Serial.println("Failed to capture image");
    }
  }
}

void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.frame_size = FRAMESIZE_VGA;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  
  // Check for PSRAM
  if(psramFound()) {
    config.jpeg_quality = 10;
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.fb_location = CAMERA_FB_IN_DRAM;
  }

  // Initialize the camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  
  Serial.println("Camera initialized");
  
  // Configure camera settings
  sensor_t * s = esp_camera_sensor_get();
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);
    s->set_brightness(s, 1);
    s->set_saturation(s, -2);
  }
  
  // Set frame size for better image quality
  s->set_framesize(s, FRAMESIZE_VGA);
}

bool captureImage(const char* filename) {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return false;
  }
  
  Serial.printf("Captured image: %d bytes\n", fb->len);
  
  // Save the image to SPIFFS with the provided filename
  Serial.printf("Saving image to: %s\n", filename);
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file for writing");
    esp_camera_fb_return(fb);
    return false;
  }
  
  size_t bytesWritten = file.write(fb->buf, fb->len);
  Serial.printf("Bytes written to file: %d\n", bytesWritten);
  
  // Make sure to flush and close the file properly
  file.flush();
  file.close();
  
  // Verify file was written correctly
  File checkFile = SPIFFS.open(filename, FILE_READ);
  if (!checkFile) {
    Serial.println("ERROR: Could not reopen file for verification!");
    esp_camera_fb_return(fb);
    return false;
  }
  
  size_t fileSize = checkFile.size();
  Serial.printf("File size after writing: %d bytes\n", fileSize);
  checkFile.close();
  
  // Return the frame buffer back to the camera
  esp_camera_fb_return(fb);
  
  if (fileSize > 0) {
    return true;
  } else {
    Serial.println("ERROR: File was saved but appears to be empty!");
    return false;
  }
}

bool uploadToApi(const char* filename) {
  Serial.println("Starting upload to API...");
  
  // Check if file exists
  if (!SPIFFS.exists(filename)) {
    Serial.printf("ERROR: File %s does not exist!\n", filename);
    return false;
  }
  
  // Open the file
  Serial.printf("Opening file for reading: %s\n", filename);
  File file = SPIFFS.open(filename, FILE_READ);
  if (!file) {
    Serial.println("Failed to open file for reading");
    return false;
  }
  
  // Get file size
  size_t fileSize = file.size();
  Serial.printf("File size from SPIFFS: %d bytes\n", fileSize);
  
  if (fileSize == 0) {
    Serial.println("File is empty");
    file.close();
    return false;
  }
  
  // Read the entire file into a buffer
  uint8_t *fileBuffer = (uint8_t*)malloc(fileSize);
  if (!fileBuffer) {
    Serial.println("Failed to allocate memory for file");
    file.close();
    return false;
  }
  
  size_t bytesRead = file.read(fileBuffer, fileSize);
  file.close();
  
  if (bytesRead != fileSize) {
    Serial.println("Failed to read entire file");
    free(fileBuffer);
    return false;
  }
  
  // Create a timestamped file name for the API
  String timestamp = getTimestamp();
  String apiFilename = timestamp + ".jpg";
  Serial.printf("Using filename: %s\n", apiFilename.c_str());
  
  // Generate a random boundary string for the multipart form
  String boundary = "----WebKitFormBoundary";
  for (int i = 0; i < 16; i++) {
    boundary += char('a' + random(26));
  }
  
  Serial.printf("Using boundary: %s\n", boundary.c_str());
  
  // Calculate the total request size
  String startBoundary = "--" + boundary + "\r\n";
  String disposition = "Content-Disposition: form-data; name=\"image\"; filename=\"" + apiFilename + "\"\r\n";
  String contentType = "Content-Type: image/jpeg\r\n\r\n";
  String endBoundary = "\r\n--" + boundary + "--\r\n";
  
  size_t totalSize = startBoundary.length() + disposition.length() + contentType.length() + fileSize + endBoundary.length();
  
  Serial.printf("Total request size: %d bytes\n", totalSize);
  
  // Allocate memory for the full multipart request
  uint8_t *requestBuffer = (uint8_t*)malloc(totalSize);
  if (!requestBuffer) {
    Serial.println("Failed to allocate memory for request");
    free(fileBuffer);
    return false;
  }
  
  // Build the multipart request
  size_t pos = 0;
  
  // Copy start boundary
  memcpy(requestBuffer + pos, startBoundary.c_str(), startBoundary.length());
  pos += startBoundary.length();
  
  // Copy content disposition
  memcpy(requestBuffer + pos, disposition.c_str(), disposition.length());
  pos += disposition.length();
  
  // Copy content type
  memcpy(requestBuffer + pos, contentType.c_str(), contentType.length());
  pos += contentType.length();
  
  // Copy file data
  memcpy(requestBuffer + pos, fileBuffer, fileSize);
  pos += fileSize;
  
  // Copy end boundary
  memcpy(requestBuffer + pos, endBoundary.c_str(), endBoundary.length());
  
  // Free the file buffer as we don't need it anymore
  free(fileBuffer);
  
  // Creating HTTP client
  HTTPClient http;
  
  // Set the target URL
  Serial.printf("Sending to endpoint: %s\n", api_endpoint);
  http.begin(api_endpoint);
  
  // Set headers
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  
  // Send the POST request with the multipart data
  Serial.println("Sending POST request...");
  int httpCode = http.POST(requestBuffer, totalSize);
  
  // Free the request buffer as we don't need it anymore
  free(requestBuffer);
  
  // Get the response
  String payload = http.getString();
  
  // Close the connection
  http.end();
  
  if (httpCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpCode);
    Serial.printf("Response: %s\n", payload.c_str());
    return (httpCode == 200 || httpCode == 201);
  } else {
    Serial.printf("Error on sending POST: %d\n", httpCode);
    return false;
  }
}

String getTimestamp() {
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return String(millis());
  }
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y%m%d_%H%M%S", &timeinfo);
  return String(buffer);
} 
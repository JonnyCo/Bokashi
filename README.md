# XIAO ESP32S3 Camera to API Uploader

This project captures images from the XIAO ESP32S3's camera module and uploads them to an API endpoint using multipart/form-data every 10 seconds.

## Hardware Requirements

- Seeed Studio XIAO ESP32S3 Sense with camera module
- WiFi connection
- Micro USB cable for programming

## Software Requirements

- Arduino IDE
- ESP32 board support package
- Required libraries:
  - ESP32 Camera
  - WiFi
  - HTTPClient
  - SPIFFS

## Setup Instructions

1. **API Endpoint Setup**

   - Ensure your API endpoint accepts multipart/form-data POST requests
   - Verify the API can receive and process image files
   - Note the API key or authentication method if required

2. **Arduino IDE Setup**

   - Install the ESP32 board support package via Boards Manager
   - Set the board to "XIAO_ESP32S3"
   - Enable PSRAM in the Tools menu
   - Set partition scheme to "Huge APP (3MB No OTA/1MB SPIFFS)"

3. **Code Configuration**

   - Edit the `CloudflareR2Camera.ino` file
   - Update WiFi credentials (`ssid` and `password`)
   - Update API settings:
     ```
     const char* api_endpoint = "https://your-api-endpoint.com/upload";
     const char* api_key = "YOUR_API_KEY"; // Optional - if your API requires authentication
     ```

4. **Upload Code**
   - Connect the XIAO ESP32S3 to your computer
   - Select the correct COM port
   - Upload the sketch

## How It Works

1. The camera is initialized and connects to WiFi
2. Every 10 seconds, the camera captures an image
3. The image is saved temporarily to SPIFFS storage
4. The image is uploaded to the API endpoint using multipart/form-data
5. The file is named with a timestamp (YYYYMMDD_HHMMSS.jpg)

## Troubleshooting

- Make sure PSRAM is enabled in Arduino IDE
- Verify WiFi credentials are correct
- Check that your API endpoint is correctly configured to receive multipart/form-data
- Monitor Serial output for debugging information at 115200 baud

## Notes

- The default image quality is set to VGA resolution
- Image quality and capture settings can be adjusted in the `initCamera()` function
- The upload interval can be changed by modifying the `captureInterval` constant
- The form field name for the image file is "image" - change this in the code if your API requires a different field name

import type { SensorData } from "../types"; // Import shared type

/**
 * Service for handling Web Bluetooth API interactions.
 */

// Type definition for the callback function that handles incoming sensor data
export type SensorDataCallback = (data: Partial<SensorData>) => void;

// TODO: Define constants for Bluetooth Service and Characteristic UUIDs
// These UUIDs must match the ones exposed by your sensor device.
// Example: const SENSOR_SERVICE_UUID = '0000abcd-0000-1000-8000-00805f9b34fb';
// Example: const TEMPERATURE_CHARACTERISTIC_UUID = '00002a6e-0000-1000-8000-00805f9b34fb';

let bluetoothDevice: BluetoothDevice | null = null;
let sensorService: BluetoothRemoteGATTService | null = null;
let dataCallback: SensorDataCallback | null = null;

/**
 * Requests access to a Bluetooth device, connects to it, and discovers services.
 * @param onDataReceived Callback function to handle incoming data.
 * @throws Error if Bluetooth is not available or connection fails.
 */
export const connect = async (
  onDataReceived: SensorDataCallback
): Promise<void> => {
  if (!navigator.bluetooth) {
    throw new Error("Web Bluetooth API is not available in this browser.");
  }

  dataCallback = onDataReceived;

  try {
    console.log("Requesting Bluetooth device...");
    // TODO: Update filters to match your specific sensor device
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      // filters: [{ services: [SENSOR_SERVICE_UUID] }],
      acceptAllDevices: true, // Use acceptAllDevices initially for easier testing
      // optionalServices: [SENSOR_SERVICE_UUID] // Add needed service UUIDs
    });

    if (!bluetoothDevice) {
      throw new Error("No device selected.");
    }

    console.log("Connecting to GATT Server...");
    const server = await bluetoothDevice.gatt?.connect();
    if (!server) {
      throw new Error("Could not connect to GATT Server.");
    }

    bluetoothDevice.addEventListener("gattserverdisconnected", onDisconnected);

    console.log("Getting Primary Service...");
    // TODO: Replace with your actual service UUID
    // sensorService = await server.getPrimaryService(SENSOR_SERVICE_UUID);
    // if (!sensorService) {
    //   throw new Error('Could not find the specified sensor service.');
    // }

    console.log("Connection successful. Ready to read characteristics.");
    // TODO: Implement characteristic reading/subscription here
  } catch (error) {
    console.error("Bluetooth connection failed:", error);
    disconnect(); // Clean up on failure
    throw error; // Re-throw the error for the caller (App.tsx) to handle
  }
};

/**
 * Handles device disconnection events.
 */
const onDisconnected = () => {
  console.log("Bluetooth device disconnected.");
  bluetoothDevice = null;
  sensorService = null;
  dataCallback = null;
  // TODO: Notify the UI about the disconnection
};

/**
 * Disconnects from the currently connected Bluetooth device.
 */
export const disconnect = (): void => {
  if (!bluetoothDevice) {
    return;
  }
  console.log("Disconnecting from Bluetooth device...");
  if (bluetoothDevice.gatt?.connected) {
    bluetoothDevice.removeEventListener(
      "gattserverdisconnected",
      onDisconnected
    );
    bluetoothDevice.gatt.disconnect();
  } else {
    console.log("Device already disconnected.");
  }
  onDisconnected(); // Ensure state is cleaned up
};

/**
 * Reads a specific characteristic value.
 * @param characteristicUuid The UUID of the characteristic to read.
 * @returns The DataView containing the characteristic value.
 * @throws Error if not connected or characteristic not found.
 */
// export const readCharacteristic = async (characteristicUuid: string): Promise<DataView> => {
//   if (!sensorService || !bluetoothDevice?.gatt?.connected) {
//     throw new Error('Not connected to a device or service not found.');
//   }
//   try {
//     const characteristic = await sensorService.getCharacteristic(characteristicUuid);
//     console.log(`Reading characteristic: ${characteristicUuid}`);
//     return await characteristic.readValue();
//   } catch (error) {
//     console.error(`Error reading characteristic ${characteristicUuid}:`, error);
//     throw error;
//   }
// };

/**
 * Subscribes to notifications for a specific characteristic.
 * @param characteristicUuid The UUID of the characteristic to subscribe to.
 * @param handleNotification Callback function to process incoming notifications.
 * @throws Error if not connected or characteristic not found/notifiable.
 */
// export const subscribeToCharacteristic = async (
//   characteristicUuid: string,
//   handleNotification: (event: Event) => void
// ): Promise<void> => {
//   if (!sensorService || !bluetoothDevice?.gatt?.connected) {
//     throw new Error('Not connected to a device or service not found.');
//   }
//   try {
//     const characteristic = await sensorService.getCharacteristic(characteristicUuid);
//     characteristic.addEventListener('characteristicvaluechanged', handleNotification);
//     await characteristic.startNotifications();
//     console.log(`Subscribed to notifications for: ${characteristicUuid}`);
//   } catch (error) {
//     console.error(`Error subscribing to characteristic ${characteristicUuid}:`, error);
//     throw error;
//   }
// };

// --- Data Parsing ---
// Add functions here to parse the DataView received from characteristics
// into meaningful values (temperature, humidity, CO2, etc.).
// Example:
// export const parseTemperature = (value: DataView): number => {
//   // Assuming temperature is a 16-bit unsigned integer in Celsius * 100
//   const temperature = value.getUint16(0, /* littleEndian */ true) / 100;
//   return temperature;
// };

// --- Placeholder for handling camera data ---
// Accessing cameras typically uses the MediaDevices API (getUserMedia), not Web Bluetooth.
// You would integrate camera access separately.

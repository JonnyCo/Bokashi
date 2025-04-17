import type { SensorData } from "../types"; // Import shared type
import type { SensorDataCallback } from "./bluetoothService"; // Import callback type

let simulationInterval: number | null = null;

// Generates somewhat realistic random data for a sensor
const generateRandomValue = (
  min: number,
  max: number,
  fluctuation: number = 0.1
): number => {
  const base = min + Math.random() * (max - min);
  const noise = (Math.random() - 0.5) * (max - min) * fluctuation;
  return base + noise;
};

/**
 * Starts sending simulated sensor data updates via the callback.
 * @param callback Function to call with new data.
 * @param intervalMs Update interval in milliseconds (default: 2000ms).
 */
export const startSimulation = (
  callback: SensorDataCallback,
  intervalMs: number = 2000
): void => {
  if (simulationInterval) {
    console.warn("Simulation already running.");
    return;
  }

  console.log(`Starting data simulation with ${intervalMs}ms interval.`);

  const sendUpdate = () => {
    const simulatedData: Partial<SensorData> = {
      timestamp: Date.now(),
      temperature: generateRandomValue(15, 30, 0.05), // °C
      humidity: generateRandomValue(40, 70, 0.1),
      co2: generateRandomValue(400, 1500, 0.2),
      o2: generateRandomValue(19, 21, 0.02),
      ph: generateRandomValue(5.5, 7.5, 0.05),
      pressure: generateRandomValue(980, 1030, 0.01),
      moisture: generateRandomValue(30, 80, 0.15),
      ir: generateRandomValue(100, 1000, 0.3),
      conductivity: generateRandomValue(500, 2500, 0.2),
      camera: Math.random() > 0.9 ? "Error: Timeout" : "Status: OK", // Simulate occasional camera issue
    };
    callback(simulatedData);
  };

  // Send initial update immediately
  sendUpdate();

  // Start interval for subsequent updates
  simulationInterval = window.setInterval(sendUpdate, intervalMs);
};

/**
 * Stops the data simulation.
 */
export const stopSimulation = (): void => {
  if (simulationInterval) {
    window.clearInterval(simulationInterval);
    simulationInterval = null;
    console.log("Simulation stopped.");
  }
};

/**
 * Shared type definitions
 */

export interface SensorData {
  timestamp?: number; // Optional timestamp for logging/display
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  o2: number | null;
  ph: number | null;
  pressure: number | null;
  moisture: number | null;
  ir: number | null;
  conductivity: number | null;
  camera?: string | null; // Optional camera status/data
  imageUrl?: string | null; // Add nullable text column for image URL
}

// Type for historical data points used in charts
export interface HistoricalDataPoint extends SensorData {
  time: string; // Formatted time string for chart labels
}

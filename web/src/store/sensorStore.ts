import { create } from "zustand";
import type { SensorData, HistoricalDataPoint } from "../types";
import { generateHistoricalData } from "../utils/mockData"; // Assuming generateHistoricalData is moved

// Define the state shape
interface SensorState {
  currentSensorData: SensorData;
  historicalData: HistoricalDataPoint[];
  isConnected: boolean;
  isSimulating: boolean;
  isLoading: boolean;
  error: string | null;
  activeFilter: string;

  // Actions
  setData: (data: Partial<SensorData>) => void;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  setConnected: (status: boolean) => void;
  setSimulating: (status: boolean) => void;
  setActiveFilter: (filter: string) => void;
  resetState: () => void; // Optional: Action to reset state
}

const initialSensorState: Omit<
  SensorState,
  | "setData"
  | "startLoading"
  | "stopLoading"
  | "setError"
  | "setConnected"
  | "setSimulating"
  | "setActiveFilter"
  | "resetState"
> = {
  currentSensorData: {
    temperature: null,
    humidity: null,
    co2: null,
    o2: null,
    ph: null,
    pressure: null,
    moisture: null,
    ir: null,
    conductivity: null,
    camera: null,
    timestamp: undefined,
  },
  historicalData: generateHistoricalData(), // Generate initial historical data
  isConnected: false,
  isSimulating: false,
  isLoading: false,
  error: null,
  activeFilter: "all",
};

export const useSensorStore = create<SensorState>((set, get) => ({
  ...initialSensorState,

  setData: (newData) => {
    const now = new Date();
    const currentTimestamp = newData.timestamp ?? now.getTime();

    // Update current data
    const updatedCurrentData = {
      ...get().currentSensorData,
      ...newData,
      timestamp: currentTimestamp,
    };
    set({
      currentSensorData: updatedCurrentData,
      error: null,
      isLoading: false,
    }); // Clear error on new data

    // Update historical data
    const newHistoricalPoint: HistoricalDataPoint = {
      ...updatedCurrentData, // Use the merged data
      // Ensure all fields potentially needed by chart are present
      temperature: updatedCurrentData.temperature ?? null,
      humidity: updatedCurrentData.humidity ?? null,
      co2: updatedCurrentData.co2 ?? null,
      o2: updatedCurrentData.o2 ?? null,
      ph: updatedCurrentData.ph ?? null,
      pressure: updatedCurrentData.pressure ?? null,
      moisture: updatedCurrentData.moisture ?? null,
      ir: updatedCurrentData.ir ?? null,
      conductivity: updatedCurrentData.conductivity ?? null,
      camera: updatedCurrentData.camera ?? null, // Should be null if not provided
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: currentTimestamp,
    };

    set((state) => ({
      historicalData: [
        ...state.historicalData.slice(-1440 + 1),
        newHistoricalPoint,
      ], // Keep approx last 24h assuming 1min interval, adjust as needed
    }));
  },

  startLoading: () => set({ isLoading: true, error: null }), // Clear error when starting load
  stopLoading: () => set({ isLoading: false }),
  setError: (error) => set({ error, isLoading: false }), // Stop loading on error
  setConnected: (status) =>
    set({
      isConnected: status,
      isSimulating: status ? false : get().isSimulating,
      isLoading: false,
    }), // Can't be connected and simulating
  setSimulating: (status) =>
    set({
      isSimulating: status,
      isConnected: status ? false : get().isConnected,
      isLoading: false,
    }), // Can't be simulating and connected
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  resetState: () => set(initialSensorState), // Reset to initial values
}));

// Helper function - move generateHistoricalData here or to a dedicated utils file
// For now, assuming it's moved to '../utils/mockData'
// You'll need to create 'web/src/utils/mockData.ts' and move the function there.

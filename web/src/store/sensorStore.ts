import { create } from "zustand";
import type { SensorData, HistoricalDataPoint } from "../types";

// Define the state shape
interface SensorState {
  currentSensorData: SensorData;
  historicalData: HistoricalDataPoint[];
  isSimulating: boolean;
  isLoading: boolean; // Loading state for polling/simulation
  isInitialLoading: boolean; // Separate loading state for initial historical fetch
  error: string | null;
  activeFilter: string;

  // Actions
  setData: (data: Partial<SensorData>) => void; // For polled/simulated single updates
  setHistoricalData: (data: HistoricalDataPoint[]) => void; // For initial bulk load
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  setSimulating: (status: boolean) => void;
  setActiveFilter: (filter: string) => void;
  resetState: () => void;
}

// Calculate max points based on 5-second polling over 24 hours
const POLLING_INTERVAL_SECONDS = 5;
const SECONDS_IN_DAY = 24 * 60 * 60;
const MAX_HISTORICAL_POINTS = Math.ceil(
  SECONDS_IN_DAY / POLLING_INTERVAL_SECONDS
);

const initialSensorState: Omit<
  SensorState,
  | "setData"
  | "setHistoricalData" // Add new action
  | "startLoading"
  | "stopLoading"
  | "setError"
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
    imageUrl: null, // Ensure imageUrl is here
    timestamp: undefined,
  },
  historicalData: [], // Start with empty historical data
  isSimulating: false,
  isLoading: false,
  isInitialLoading: true, // Start in initial loading state
  error: null,
  activeFilter: "all",
};

export const useSensorStore = create<SensorState>((set, get) => ({
  ...initialSensorState,

  // Action for individual updates (polling/simulation)
  setData: (newData) => {
    const now = new Date();
    const currentTimestamp = newData.timestamp ?? now.getTime();

    // 1. Update current data only
    const updatedCurrentData = {
      ...get().currentSensorData,
      ...newData,
      timestamp: currentTimestamp,
    };
    set({
      currentSensorData: updatedCurrentData,
      error: null, // Clear error on new data
      isLoading: false, // Stop polling loading indicator
    });

    // 2. Prepare and append to historical data
    const newHistoricalPoint: HistoricalDataPoint = {
      temperature: updatedCurrentData.temperature ?? null,
      humidity: updatedCurrentData.humidity ?? null,
      co2: updatedCurrentData.co2 ?? null,
      o2: updatedCurrentData.o2 ?? null,
      ph: updatedCurrentData.ph ?? null,
      pressure: updatedCurrentData.pressure ?? null,
      moisture: updatedCurrentData.moisture ?? null,
      ir: updatedCurrentData.ir ?? null,
      conductivity: updatedCurrentData.conductivity ?? null,
      camera: updatedCurrentData.camera ?? null,
      imageUrl: updatedCurrentData.imageUrl ?? null,
      // Generate time string for the chart
      time: new Date(currentTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: currentTimestamp,
    };

    set((state) => ({
      historicalData: [
        ...state.historicalData.slice(-MAX_HISTORICAL_POINTS + 1), // Limit size
        newHistoricalPoint,
      ],
    }));
  },

  // Action for setting the initial historical data load
  setHistoricalData: (data) => {
    // Also set the most recent point from historical as the initial current data
    const latestPoint = data.length > 0 ? data[data.length - 1] : null;
    set({
      historicalData: data.slice(-MAX_HISTORICAL_POINTS), // Limit initial load too
      isInitialLoading: false,
      error: null,
      // Set current data based on the latest historical point if available
      currentSensorData: latestPoint
        ? { ...get().currentSensorData, ...latestPoint }
        : get().currentSensorData,
    });
  },

  startLoading: () => set({ isLoading: true, error: null }),
  stopLoading: () => set({ isLoading: false }),
  // setError should perhaps differentiate between initial load error and polling error?
  // For now, it sets the general error and stops the polling loading indicator.
  setError: (error) =>
    set({ error, isLoading: false, isInitialLoading: false }),
  setSimulating: (status) =>
    set({
      isSimulating: status,
      isLoading: false, // Stop polling loading when simulating
      isInitialLoading: false, // Ensure initial loading stops if simulation starts before it finishes
    }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  resetState: () => set(initialSensorState), // Reset to initial values
}));

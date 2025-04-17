import type { HistoricalDataPoint } from "../types";

// Mock historical data generation
export const generateHistoricalData = (hours = 24): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: Math.round((22 + Math.sin(i / 3) * 4) * 10) / 10,
      humidity: Math.round((65 + Math.sin(i / 4) * 15) * 10) / 10,
      co2: Math.round((400 + Math.sin(i / 6) * 100) * 10) / 10,
      o2: Math.round((20.9 + Math.sin(i / 8) * 0.5) * 10) / 10,
      ph: Math.round((6.5 + Math.sin(i / 5) * 0.5) * 10) / 10,
      pressure: Math.round((1013 + Math.sin(i / 7) * 10) * 10) / 10,
      moisture: Math.round((40 + Math.sin(i / 4) * 20) * 10) / 10,
      ir: Math.round((500 + Math.sin(i / 3) * 200) * 10) / 10,
      conductivity: Math.round((1.2 + Math.sin(i / 5) * 0.4) * 100) / 100,
      timestamp: time.getTime(),
      camera: null,
    });
  }

  return data;
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Droplets,
  Leaf,
  RefreshCw,
  Thermometer,
  Wind,
  Zap,
  FlaskRoundIcon as Flask,
  Gauge,
  Sun,
  Camera,
  Clock,
} from "lucide-react";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";

import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import CameraModule from "~/components/camera-module";
import SensorChart from "~/components/sensor-chart";
import { useSensorStore } from "~/store/sensorStore";
import type { SensorData, HistoricalDataPoint } from "~/types";

// Define the actual API response structure
interface ApiSensorReading
  extends Omit<Partial<SensorData>, "timestamp" | "imageUrl"> {
  timestamp: string; // Timestamp is initially an ISO string
  imageUrl?: string | null; // Add imageUrl here as well
}

interface ApiResponse {
  success: boolean;
  data: ApiSensorReading[];
}

// --- API Fetch Functions ---

// Define the base URL using an environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"; // Fallback for local dev if needed

// Fetch *latest* sensor data for polling
const fetchLatestSensorData = async (): Promise<Partial<SensorData>> => {
  try {
    // Use the correct '/readings/latest' endpoint relative to the base URL
    const response = await fetch(
      `${API_BASE_URL}/readings/latest` // Use the variable
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiResponse: ApiResponse = await response.json();

    if (
      !apiResponse.success ||
      !apiResponse.data ||
      apiResponse.data.length === 0
    ) {
      console.warn(
        "API request for latest data failed or returned empty",
        apiResponse
      );
      return {}; // Return empty if no data
    }

    // Assume the first entry in the array is the latest/merged one from the server
    // Or adapt if the /readings endpoint returns a single object directly
    const latestReading = apiResponse.data[0];
    const mergedData: Partial<SensorData> = {};
    let latestTimestamp = 0;

    try {
      latestTimestamp = Date.parse(latestReading.timestamp);
      if (isNaN(latestTimestamp)) {
        console.warn("Invalid timestamp format:", latestReading.timestamp);
        latestTimestamp = 0;
      }
    } catch (e) {
      console.warn("Error parsing timestamp:", latestReading.timestamp, e);
    }

    // Map non-null values from the latest reading
    if (
      latestReading.temperature !== null &&
      latestReading.temperature !== undefined
    )
      mergedData.temperature = latestReading.temperature;
    if (latestReading.humidity !== null && latestReading.humidity !== undefined)
      mergedData.humidity = latestReading.humidity;
    if (latestReading.co2 !== null && latestReading.co2 !== undefined)
      mergedData.co2 = latestReading.co2;
    if (latestReading.o2 !== null && latestReading.o2 !== undefined)
      mergedData.o2 = latestReading.o2;
    if (latestReading.ph !== null && latestReading.ph !== undefined)
      mergedData.ph = latestReading.ph;
    if (latestReading.pressure !== null && latestReading.pressure !== undefined)
      mergedData.pressure = latestReading.pressure;
    if (latestReading.moisture !== null && latestReading.moisture !== undefined)
      mergedData.moisture = latestReading.moisture;
    if (latestReading.ir !== null && latestReading.ir !== undefined)
      mergedData.ir = latestReading.ir;
    if (
      latestReading.conductivity !== null &&
      latestReading.conductivity !== undefined
    )
      mergedData.conductivity = latestReading.conductivity;
    if (latestReading.imageUrl !== null && latestReading.imageUrl !== undefined)
      mergedData.imageUrl = latestReading.imageUrl;

    if (latestTimestamp > 0) {
      mergedData.timestamp = latestTimestamp;
    }

    return mergedData;
  } catch (error) {
    console.error("Failed to fetch latest sensor data:", error);
    throw error;
  }
};

// --- Camera Feeds (Keep as is) ---
const cameraFeeds = [
  {
    id: "main",
    name: "Main Growing Area",
  },
];

export async function loader({ request }: { request: Request }) {
  try {
    // Get time range from URL params (default to 24h)
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "24h";

    // Calculate timestamps based on selected time range
    const endTime = new Date();
    const startTime = new Date(endTime);

    // Apply different time ranges
    switch (timeRange) {
      case "7d":
        // 7 days back
        startTime.setDate(startTime.getDate() - 7);
        break;
      case "all":
        // For "all" we'll set a far past date (1 year)
        startTime.setFullYear(startTime.getFullYear() - 1);
        break;
      case "24h":
      default:
        // Default: 24 hours back
        startTime.setHours(startTime.getHours() - 24);
        break;
    }

    // Format times as ISO strings for the API
    const startTimeIso = startTime.toISOString();
    const endTimeIso = endTime.toISOString();

    // Fetch both sensor data and camera image in parallel with time-bounded readings
    const [sensorResponse, cameraResponse] = await Promise.all([
      fetch(
        `${API_BASE_URL}/readings/all?StartTime=${encodeURIComponent(
          startTimeIso
        )}&EndTime=${encodeURIComponent(endTimeIso)}`
      ),
      fetch(`${API_BASE_URL}/images/latest`),
    ]);

    // Process sensor data
    if (!sensorResponse.ok) {
      throw new Error(`HTTP error! status: ${sensorResponse.status}`);
    }

    const apiResponse = await sensorResponse.json();

    // Process camera data
    let cameraData = null;
    if (cameraResponse.ok) {
      const cameraResult = await cameraResponse.json();
      if (cameraResult.success && cameraResult.data) {
        cameraData = cameraResult.data;
      }
    }

    if (!apiResponse.success || !apiResponse.data) {
      console.warn("API request failed or returned empty", apiResponse);
      return new Response(JSON.stringify({ historicalData: [], cameraData }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60",
        },
      });
    }

    // Map the response data to HistoricalDataPoint format
    const historicalPoints = apiResponse.data
      .map((reading: ApiSensorReading) => {
        try {
          const timestamp = Date.parse(reading.timestamp);
          if (isNaN(timestamp)) {
            console.warn(
              "Invalid timestamp, skipping reading:",
              reading.timestamp
            );
            return null;
          }

          return {
            temperature: reading.temperature ?? null,
            humidity: reading.humidity ?? null,
            co2: reading.co2 ?? null,
            o2: reading.o2 ?? null,
            ph: reading.ph ?? null,
            pressure: reading.pressure ?? null,
            moisture: reading.moisture ?? null,
            ir: reading.ir ?? null,
            conductivity: reading.conductivity ?? null,
            imageUrl: reading.imageUrl ?? null,
            camera: null,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        } catch (e) {
          console.warn("Error processing historical reading:", reading, e);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    // Return both sensor data and camera data with a 60 second cache header
    return new Response(
      JSON.stringify({
        historicalData: historicalPoints,
        cameraData,
        timeRange, // Include selected time range in response
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return new Response(
      JSON.stringify({
        historicalData: [],
        cameraData: null,
        error: "Failed to fetch data",
        timeRange: "24h", // Default even in error case
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=60",
        },
      }
    );
  }
}

// Add this utility function before the Dashboard component
const downsampleData = (
  data: HistoricalDataPoint[],
  maxPoints = 50,
  filterNulls = true
): HistoricalDataPoint[] => {
  if (!data || data.length === 0) return [];

  // First sort the data by timestamp
  const sortedData = [...data].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  // If we have fewer points than maxPoints, return all data
  if (sortedData.length <= maxPoints) return sortedData;

  // Filter out null values first if requested
  const filteredData = filterNulls
    ? sortedData.filter((point) => {
        // Keep point if it has at least one non-null sensor value
        return Object.entries(point).some(([key, value]) => {
          return (
            key !== "timestamp" &&
            key !== "time" &&
            value !== null &&
            value !== undefined
          );
        });
      })
    : sortedData;

  // Calculate how many points to skip
  const skipFactor = Math.ceil(filteredData.length / maxPoints);

  // Take every nth point to reduce the dataset
  // Always include the first and last point for proper time range display
  const result: HistoricalDataPoint[] = [];

  // Always add the first point
  if (filteredData.length > 0) {
    result.push(filteredData[0]);
  }

  // Add the middle points using the skip factor
  for (
    let i = skipFactor;
    i < filteredData.length - skipFactor;
    i += skipFactor
  ) {
    result.push(filteredData[i]);
  }

  // Always add the last point
  if (filteredData.length > 1) {
    result.push(filteredData[filteredData.length - 1]);
  }

  return result;
};

// Add this utility function to summarize data for 7-day view
const summarizeData = (
  data: HistoricalDataPoint[],
  timeRange: string
): HistoricalDataPoint[] => {
  // Only summarize for 7d view
  if (timeRange !== "7d" || !data || data.length === 0) {
    return data;
  }

  // Create a full 7-day date range (today and 6 days prior)
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // 6 days ago
  startDate.setHours(0, 0, 0, 0); // Start of that day

  // Generate all 7 days we want to display
  const daysToDisplay: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    daysToDisplay.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Sort data by timestamp
  const sortedData = [...data].sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  // Group data points by day
  const dailyGroups: { [key: string]: HistoricalDataPoint[] } = {};

  // Initialize all day buckets
  daysToDisplay.forEach((day) => {
    const dayKey = day.toISOString().split("T")[0];
    dailyGroups[dayKey] = [];
  });

  // Add data points to their respective day buckets
  sortedData.forEach((point) => {
    if (point.timestamp) {
      const date = new Date(point.timestamp);
      const dayKey = date.toISOString().split("T")[0];

      if (dailyGroups[dayKey]) {
        dailyGroups[dayKey].push(point);
      }
    }
  });

  // Create summary points for each day (even days with no data)
  const result: HistoricalDataPoint[] = [];

  daysToDisplay.forEach((day) => {
    const dayKey = day.toISOString().split("T")[0];
    const dayPoints = dailyGroups[dayKey] || [];

    // Format the date for display
    const dateLabel = day.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Create a summary point for this day
    const summary: HistoricalDataPoint = {
      timestamp: new Date(day).setHours(12, 0, 0, 0), // Noon
      time: dateLabel,
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
      imageUrl:
        dayPoints.length > 0 ? dayPoints[dayPoints.length - 1].imageUrl : null,
    };

    // Only calculate averages if we have data for this day
    if (dayPoints.length > 0) {
      // Calculate averages for each sensor
      [
        "temperature",
        "humidity",
        "co2",
        "o2",
        "ph",
        "pressure",
        "moisture",
        "ir",
        "conductivity",
      ].forEach((key) => {
        const typedKey = key as keyof typeof summary;
        if (
          typedKey === "time" ||
          typedKey === "timestamp" ||
          typedKey === "camera" ||
          typedKey === "imageUrl"
        ) {
          return; // Skip non-numeric fields
        }

        const values = dayPoints
          .map((p) => p[typedKey] as number | null)
          .filter((val) => val !== null && val !== undefined) as number[];

        if (values.length > 0) {
          // Calculate average
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          summary[typedKey] = parseFloat(avg.toFixed(2));
        }
      });
    }

    result.push(summary);
  });

  return result;
};

export default function Dashboard() {
  // Get loader data for initial historical data and camera data
  const loaderData = useLoaderData<{
    historicalData: HistoricalDataPoint[];
    cameraData: {
      id: number;
      imageUrl: string;
      imageBase64: string;
      timestamp: string;
    } | null;
    timeRange: string;
    error?: string;
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentTimeRange = loaderData.timeRange || "24h";

  // --- State from Zustand Store ---
  const {
    currentSensorData,
    historicalData,
    isSimulating,
    isLoading,
    isInitialLoading,
    error,
    activeFilter,
    setData,
    setHistoricalData,
    startLoading,
    stopLoading,
    setError,
    setSimulating,
    setActiveFilter,
  } = useSensorStore((state) => state);

  // Add a state to track loading during time range changes
  const [isChangingTimeRange, setIsChangingTimeRange] = useState(false);

  // Add state for notification of completed fetch and caching info
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info";
  }>({ show: false, message: "", type: "success" });

  // Add state to track loaded time ranges
  const [loadedTimeRanges, setLoadedTimeRanges] = useState<Set<string>>(
    new Set([currentTimeRange])
  );

  // Function to change time range
  const changeTimeRange = useCallback(
    (newTimeRange: string) => {
      // Don't do anything if it's the current time range
      if (newTimeRange === currentTimeRange) return;

      // Only show loading state if we don't have this time range cached
      if (!loadedTimeRanges.has(newTimeRange)) {
        setIsChangingTimeRange(true);
      } else {
        // Show a notification that we're using cached data
        setNotification({
          show: true,
          message: "Using cached data for this time range",
          type: "info",
        });

        // Hide after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "info" });
        }, 3000);
      }

      // Navigate to the same page with new search params
      const newParams = new URLSearchParams(searchParams);
      newParams.set("timeRange", newTimeRange);
      navigate(`?${newParams.toString()}`);
    },
    [navigate, searchParams, loadedTimeRanges, currentTimeRange]
  );

  // --- Initialize store with loader data ---
  useEffect(() => {
    // Add current time range to loaded ranges
    setLoadedTimeRanges((prev) => {
      const updated = new Set(prev);
      updated.add(currentTimeRange);
      return updated;
    });

    // Reset time range loading state whenever loader data changes
    if (isChangingTimeRange) {
      setIsChangingTimeRange(false);

      // Show success notification briefly
      setNotification({
        show: true,
        message: "New data loaded successfully",
        type: "success",
      });

      const timer = setTimeout(() => {
        setNotification({ show: false, message: "", type: "success" });
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }

    // Set historical data from loader
    if (loaderData.historicalData && loaderData.historicalData.length > 0) {
      setHistoricalData(loaderData.historicalData);

      // Get the most recent data point to use as current sensor data
      const latestPoint = [...loaderData.historicalData].sort(
        (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
      )[0];

      if (latestPoint) {
        setData({
          temperature: latestPoint.temperature,
          humidity: latestPoint.humidity,
          co2: latestPoint.co2,
          o2: latestPoint.o2,
          ph: latestPoint.ph,
          pressure: latestPoint.pressure,
          moisture: latestPoint.moisture,
          ir: latestPoint.ir,
          conductivity: latestPoint.conductivity,
          imageUrl: latestPoint.imageUrl,
          timestamp: latestPoint.timestamp,
        });
      }

      // Since we now have data from the loader, we're no longer in initial loading state
      stopLoading();
    }

    // Handle loader error if any
    if (loaderData.error) {
      setError(loaderData.error);
    }
  }, [
    loaderData,
    setHistoricalData,
    setData,
    stopLoading,
    setError,
    isChangingTimeRange,
    currentTimeRange,
  ]);

  // --- State for Countdown Timer ---
  const [secondsUntilRefetch, setSecondsUntilRefetch] = useState<number | null>(
    null
  );

  // Adjust polling interval based on time range
  const refetchIntervalMs = useMemo(() => {
    switch (currentTimeRange) {
      case "24h":
        return 1000 * 60 * 5; // 5 minutes for 24h view
      case "7d":
        return 1000 * 60 * 30; // 30 minutes for 7d view
      case "all":
        return 1000 * 60 * 60; // 1 hour for all time view
      default:
        return 1000 * 60 * 10; // 10 minutes default
    }
  }, [currentTimeRange]);

  // --- React Query: Polling for Latest Data ---
  const {
    data: latestQueryData,
    error: pollingError,
    isLoading: pollingIsLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["latestSensorData", currentTimeRange],
    queryFn: fetchLatestSensorData,
    refetchInterval: refetchIntervalMs,
    enabled: !isSimulating,
    staleTime: refetchIntervalMs,
  });

  // --- Effect to update Zustand store from Polling Query ---
  useEffect(() => {
    if (latestQueryData) {
      // Minimal check, just ensure timestamp exists before updating
      if (latestQueryData.timestamp !== undefined) {
        // Check if the new data timestamp is actually newer than the current one
        if (
          !currentSensorData.timestamp ||
          latestQueryData.timestamp > currentSensorData.timestamp
        ) {
          setData(latestQueryData); // Call setData for polling updates
        }
      }
    }
  }, [latestQueryData, setData, currentSensorData.timestamp]);

  // --- Effect to Handle Polling Errors ---
  useEffect(() => {
    if (pollingError) {
      setError(
        pollingError instanceof Error
          ? pollingError.message
          : "Failed to fetch latest data"
      );
    }
  }, [pollingError, setError]);

  // --- Effect for Countdown Timer (Adjusted dependencies) ---
  useEffect(() => {
    // Only run timer if polling is active (initial load success, no simulation)
    if (isSimulating || !dataUpdatedAt) {
      setSecondsUntilRefetch(null);
      return;
    }

    const calculateRemaining = () => {
      const nextFetchTime = dataUpdatedAt + refetchIntervalMs;
      const remainingMs = Math.max(0, nextFetchTime - Date.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setSecondsUntilRefetch(remainingSeconds);
      return remainingMs;
    };

    const initialRemainingMs = calculateRemaining();
    if (initialRemainingMs <= 0) {
      setSecondsUntilRefetch(null);
      return;
    }

    const intervalId = setInterval(() => {
      const remainingMs = calculateRemaining();
      if (remainingMs <= 0) {
        clearInterval(intervalId);
        setSecondsUntilRefetch(null);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // Depend on dataUpdatedAt, initial status, and simulation status
  }, [dataUpdatedAt, isSimulating]);

  // Process data based on time range - either downsample or summarize
  const processedData = useMemo(() => {
    // First summarize the data if needed
    const summarized = summarizeData(historicalData, currentTimeRange);

    // For 7d, we want to show exactly 7 data points (one per day), so don't downsample
    if (currentTimeRange === "7d") {
      return summarized;
    }

    // Then downsample if necessary for other views
    let maxPoints = 48; // default for 24h
    if (currentTimeRange === "all") maxPoints = 52; // all time = roughly weekly points

    return downsampleData(summarized, maxPoints);
  }, [historicalData, currentTimeRange]);

  // Combined loading state for UI feedback (show loading if initial, polling, or changing time range)
  const showLoading =
    isInitialLoading ||
    (pollingIsLoading && !isSimulating) ||
    isChangingTimeRange;

  // Updated function to get a display label for chart based on timeRange
  const getTimeRangeLabel = useCallback((range: string) => {
    switch (range) {
      case "7d":
        return "Last 7 Days";
      case "all":
        return "All Time";
      case "24h":
      default:
        return "Last 24 Hours";
    }
  }, []);

  // Function to force refresh the current time range
  const forceRefresh = useCallback(() => {
    // Remove current time range from loaded ranges
    setLoadedTimeRanges((prev) => {
      const updated = new Set(prev);
      updated.delete(currentTimeRange);
      return updated;
    });

    // Show loading state
    setIsChangingTimeRange(true);

    // Navigate to the same page with the same parameters to trigger a refetch
    const newParams = new URLSearchParams(searchParams);
    // Add a timestamp to force a new load
    newParams.set("t", Date.now().toString());
    navigate(`?${newParams.toString()}`);
  }, [currentTimeRange, navigate, searchParams]);

  // --- UI --- (Adjust status message and loading indicators)
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 max-w-md p-3 ${
            notification.type === "success"
              ? "bg-green-100 border-green-200 text-green-800"
              : "bg-blue-100 border-blue-200 text-blue-800"
          } border rounded-md z-50 flex items-center shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <div
            className={`${
              notification.type === "success" ? "bg-green-200" : "bg-blue-200"
            } rounded-full p-1 mr-2`}
          >
            {notification.type === "success" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="text-sm font-medium">{notification.message}</div>
        </div>
      )}

      <div className="flex-1">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                FoodCam2Farm
              </h1>

              <p className="text-muted-foreground"></p>
              {/* Updated Status Line */}
              <p className="text-xs text-muted-foreground mt-1">
                Status:{" "}
                {isSimulating
                  ? "Simulating"
                  : error
                  ? "Initial load failed"
                  : "Polling API"}
                {/* Countdown Timer (only when polling) */}
                {!isSimulating &&
                  secondsUntilRefetch !== null &&
                  secondsUntilRefetch > 0 && (
                    <span className="ml-1">
                      (Next refresh in {secondsUntilRefetch}s)
                    </span>
                  )}
                {/* Polling Refresh Indicator */}
                {!isSimulating && pollingIsLoading && !pollingError && (
                  <span className="ml-1">(Refreshing...)</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Time Range Selector - More visible section */}
              <div
                className={`flex items-center mr-4 border rounded-md p-1 bg-background shadow-sm ${
                  isChangingTimeRange ? "border-primary" : ""
                }`}
              >
                <div className="flex items-center px-2 border-r">
                  {isChangingTimeRange ? (
                    <RefreshCw className="h-4 w-4 mr-1.5 text-primary animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isChangingTimeRange ? "text-primary" : ""
                    }`}
                  >
                    {isChangingTimeRange ? "Loading..." : "Time Range:"}
                  </span>
                </div>
                <div className="flex items-center px-1">
                  <Button
                    variant={currentTimeRange === "24h" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => changeTimeRange("24h")}
                    className={`text-xs h-7 rounded-sm ${
                      loadedTimeRanges.has("24h") && currentTimeRange !== "24h"
                        ? "border-blue-300 border"
                        : ""
                    }`}
                    disabled={isChangingTimeRange || currentTimeRange === "24h"}
                  >
                    {isChangingTimeRange && currentTimeRange !== "24h" ? (
                      <span className="flex items-center">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        24h
                      </span>
                    ) : (
                      <>
                        {loadedTimeRanges.has("24h") &&
                          currentTimeRange !== "24h" && (
                            <span
                              className="mr-1 text-blue-500 h-2 w-2 rounded-full bg-blue-500 inline-block"
                              title="Data cached"
                            />
                          )}
                        24h
                      </>
                    )}
                  </Button>
                  <Button
                    variant={currentTimeRange === "7d" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => changeTimeRange("7d")}
                    className={`text-xs h-7 rounded-sm relative ${
                      loadedTimeRanges.has("7d") && currentTimeRange !== "7d"
                        ? "border-blue-300 border"
                        : ""
                    }`}
                    disabled={isChangingTimeRange || currentTimeRange === "7d"}
                  >
                    {isChangingTimeRange && currentTimeRange !== "7d" ? (
                      <span className="flex items-center">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />7
                        Days
                      </span>
                    ) : (
                      <>
                        {loadedTimeRanges.has("7d") &&
                          currentTimeRange !== "7d" && (
                            <span
                              className="mr-1 text-blue-500 h-2 w-2 rounded-full bg-blue-500 inline-block"
                              title="Data cached"
                            />
                          )}
                        7 Days
                      </>
                    )}
                  </Button>
                  <Button
                    variant={currentTimeRange === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => changeTimeRange("all")}
                    className={`text-xs h-7 rounded-sm ${
                      loadedTimeRanges.has("all") && currentTimeRange !== "all"
                        ? "border-blue-300 border"
                        : ""
                    }`}
                    disabled={isChangingTimeRange || currentTimeRange === "all"}
                  >
                    {isChangingTimeRange && currentTimeRange !== "all" ? (
                      <span className="flex items-center">
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        All
                      </span>
                    ) : (
                      <>
                        {loadedTimeRanges.has("all") &&
                          currentTimeRange !== "all" && (
                            <span
                              className="mr-1 text-blue-500 h-2 w-2 rounded-full bg-blue-500 inline-block"
                              title="Data cached"
                            />
                          )}
                        All
                      </>
                    )}
                  </Button>
                </div>

                {/* Force refresh button */}
                <div className="flex items-center pl-2 border-l ml-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={forceRefresh}
                    className="text-xs h-7 w-7 p-0 rounded-full"
                    disabled={isChangingTimeRange}
                    title="Force refresh current time range"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sensor Type Filters */}
              <Badge
                variant={activeFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Badge>
              <Badge
                variant={activeFilter === "environment" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("environment")}
              >
                Environment
              </Badge>
              <Badge
                variant={activeFilter === "soil" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("soil")}
              >
                Soil
              </Badge>
              <Badge
                variant={activeFilter === "cameras" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("cameras")}
              >
                Cameras
              </Badge>
            </div>
          </div>

          {/* Display general error from store (could be initial or polling) */}
          {error && <p className="text-red-600 mb-4">Error: {error}</p>}

          {/* Always render the main content structure */}
          {/* Key Metrics Section - Conditionally render content inside */}
          {(activeFilter === "all" ||
            activeFilter === "environment" ||
            activeFilter === "soil") && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Environment Sensors */}
              {(activeFilter === "all" || activeFilter === "environment") && (
                <>
                  {/* Temp card... */}
                  <Card
                    className={
                      activeFilter === "environment" ? "border-primary" : ""
                    }
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Temperature
                      </CardTitle>
                      <Thermometer className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.temperature !== null &&
                          currentSensorData.temperature !== undefined ? (
                          `${currentSensorData.temperature}°C`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 18-26°C
                      </p>
                    </CardContent>
                  </Card>
                  {/* Humidity card... */}
                  <Card
                    className={
                      activeFilter === "environment" ? "border-primary" : ""
                    }
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Humidity
                      </CardTitle>
                      <Droplets className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.humidity !== null &&
                          currentSensorData.humidity !== undefined ? (
                          `${currentSensorData.humidity}%`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 50-80%
                      </p>
                    </CardContent>
                  </Card>
                  {/* CO2 card... */}
                  <Card
                    className={
                      activeFilter === "environment" ? "border-primary" : ""
                    }
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        CO₂ Level
                      </CardTitle>
                      <Wind className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.co2 !== null &&
                          currentSensorData.co2 !== undefined ? (
                          `${currentSensorData.co2} ppm`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 350-500 ppm
                      </p>
                    </CardContent>
                  </Card>
                  {/* O2 card... */}
                  <Card
                    className={
                      activeFilter === "environment" ? "border-primary" : ""
                    }
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        O₂ Level
                      </CardTitle>
                      <Zap className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.o2 !== null &&
                          currentSensorData.o2 !== undefined ? (
                          `${currentSensorData.o2}%`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 20-21%
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
              {/* Soil Sensors */}
              {(activeFilter === "all" || activeFilter === "soil") && (
                <>
                  {/* Moisture card... */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Soil Moisture
                      </CardTitle>
                      <Leaf className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.moisture !== null &&
                          currentSensorData.moisture !== undefined ? (
                          `${currentSensorData.moisture}%`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 30-60%
                      </p>
                    </CardContent>
                  </Card>
                  {/* pH card... */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Soil pH
                      </CardTitle>
                      <Flask className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.ph !== null &&
                          currentSensorData.ph !== undefined ? (
                          `${currentSensorData.ph}`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 6.0-7.0
                      </p>
                    </CardContent>
                  </Card>
                  {/* Conductivity card... */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Conductivity
                      </CardTitle>
                      <Gauge className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.conductivity !== null &&
                          currentSensorData.conductivity !== undefined ? (
                          `${currentSensorData.conductivity} mS/cm`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 0.8-1.6 mS/cm
                      </p>
                    </CardContent>
                  </Card>
                  {/* IR card... */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        IR Radiation
                      </CardTitle>
                      <Sun className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent className="min-h-[4.5rem] flex flex-col justify-center">
                      <div className="text-2xl font-bold">
                        {showLoading ? (
                          <span className="text-muted-foreground text-sm">
                            Loading...
                          </span>
                        ) : currentSensorData.ir !== null &&
                          currentSensorData.ir !== undefined ? (
                          `${currentSensorData.ir} W/m²`
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 300-700 W/m²
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Charts Section - Conditionally render content inside */}
          {/* Environment Sensor Charts */}
          {(activeFilter === "all" || activeFilter === "environment") && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Environment Sensors</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Temperature ({getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center relative">
                    {showLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                          <span className="text-sm text-muted-foreground">
                            {isChangingTimeRange
                              ? "Fetching historical data..."
                              : "Loading..."}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    <SensorChart
                      data={processedData}
                      dataKeys={["temperature"]}
                      colors={["#10b981"]}
                      units={["°C"]}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Humidity ({getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center relative">
                    {showLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary mb-2" />
                          <span className="text-sm text-muted-foreground">
                            {isChangingTimeRange
                              ? "Fetching historical data..."
                              : "Loading..."}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    <SensorChart
                      data={processedData}
                      dataKeys={["humidity"]}
                      colors={["#3b82f6"]}
                      units={["%"]}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      CO₂ Level ({getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <span className="text-muted-foreground text-sm">
                        Loading...
                      </span>
                    ) : (
                      <SensorChart
                        data={processedData}
                        dataKeys={["co2"]}
                        colors={["#6b7280"]}
                        units={["ppm"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      O₂ Level ({getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <span className="text-muted-foreground text-sm">
                        Loading...
                      </span>
                    ) : (
                      <SensorChart
                        data={processedData}
                        dataKeys={["o2"]}
                        colors={["#0ea5e9"]}
                        units={["%"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Atmospheric Pressure (
                      {getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <span className="text-muted-foreground text-sm">
                        Loading...
                      </span>
                    ) : (
                      <SensorChart
                        data={processedData}
                        dataKeys={["pressure"]}
                        colors={["#8b5cf6"]}
                        units={["hPa"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      IR Radiation ({getTimeRangeLabel(currentTimeRange)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <span className="text-muted-foreground text-sm">
                        Loading...
                      </span>
                    ) : (
                      <SensorChart
                        data={processedData}
                        dataKeys={["ir"]}
                        colors={["#f59e0b"]}
                        units={["W/m²"]}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Camera Feeds - These don't typically have a loading state tied to sensor data */}
          {(activeFilter === "all" || activeFilter === "cameras") && (
            <div>
              <h2 className="text-xl font-bold mb-4">Camera Feeds</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {cameraFeeds.map((camera) => (
                  <Card key={camera.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        {camera.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <CameraModule
                        location={camera.name}
                        initialCameraData={loaderData.cameraData}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

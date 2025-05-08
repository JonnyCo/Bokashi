"use client";

import { useCallback, useEffect, useState } from "react";
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
  Play,
  Square,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SensorChart from "@/components/sensor-chart";
import CameraModule from "@/components/camera-module";

import type { SensorData, HistoricalDataPoint } from "./types";
import { useSensorStore } from "./store/sensorStore";
import * as simService from "./services/simulationService";

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

// Fetch *all* historical data (e.g., last 24h) for initial load
const fetchAllSensorData = async (): Promise<HistoricalDataPoint[]> => {
  try {
    // Use the correct '/readings/all' endpoint relative to the base URL
    const response = await fetch(
      `${API_BASE_URL}/readings/all` // Use the variable
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const apiResponse: ApiResponse = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      console.warn(
        "API request for all data failed or returned empty",
        apiResponse
      );
      return []; // Return empty array on failure
    }

    // Map the response data to HistoricalDataPoint format
    const historicalPoints = apiResponse.data
      .map((reading): HistoricalDataPoint | null => {
        // Map directly to HistoricalDataPoint or null
        try {
          const timestamp = Date.parse(reading.timestamp);
          if (isNaN(timestamp)) {
            console.warn(
              "Invalid timestamp, skipping reading:",
              reading.timestamp
            );
            return null;
          }

          // Construct the full HistoricalDataPoint, ensuring all fields exist (with null defaults)
          const point: HistoricalDataPoint = {
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
            camera: null, // Default camera to null if not present
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          return point;
        } catch (e) {
          console.warn("Error processing historical reading:", reading, e);
          return null;
        }
      })
      .filter((p): p is HistoricalDataPoint => p !== null) // Type predicate should now work correctly
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    console.log("Fetched Historical Data Points:", historicalPoints.length);
    return historicalPoints;
  } catch (error) {
    console.error("Failed to fetch all sensor data:", error);
    throw error; // Re-throw to be caught by useQuery
  }
};

// --- Camera Feeds (Keep as is) ---
const cameraFeeds = [
  {
    id: "main",
    name: "Main Growing Area",
  },
];

export default function Dashboard() {
  // --- State from Zustand Store ---
  const {
    currentSensorData,
    historicalData,
    isSimulating,
    isLoading, // Polling/Simulation loading
    isInitialLoading, // Initial historical data loading
    error,
    activeFilter,
    setData, // Action for polling updates
    setHistoricalData, // Action for initial load
    startLoading,
    stopLoading,
    setError,
    setSimulating,
    setActiveFilter,
  } = useSensorStore((state) => state);

  // --- State for Countdown Timer ---
  const [secondsUntilRefetch, setSecondsUntilRefetch] = useState<number | null>(
    null
  );
  const refetchIntervalMs = 5000;

  // --- React Query: Initial Data Load ---
  const {
    data: initialData,
    error: initialError,
    status: initialStatus, // Use status for more granular control
  } = useQuery({
    queryKey: ["allSensorData"],
    queryFn: fetchAllSensorData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });

  // --- Effect for Initial Data Load Success/Error ---
  useEffect(() => {
    if (initialStatus === "success" && initialData) {
      console.log("Initial data fetch successful, setting historical data.");
      setHistoricalData(initialData);
    } else if (initialStatus === "error" && initialError) {
      console.error("Initial data fetch failed:", initialError);
      setError(
        initialError instanceof Error
          ? initialError.message
          : "Failed to load initial data"
      );
    }
    // Only depend on status, data, and error objects themselves
  }, [initialStatus, initialData, initialError, setHistoricalData, setError]);

  // --- React Query: Polling for Latest Data ---
  const {
    data: latestQueryData,
    error: pollingError,
    isLoading: pollingIsLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["latestSensorData"],
    queryFn: fetchLatestSensorData,
    refetchInterval: refetchIntervalMs,
    enabled: !isSimulating && initialStatus === "success",
    staleTime: refetchIntervalMs - 1000,
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
    if (isSimulating || initialStatus !== "success" || !dataUpdatedAt) {
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
  }, [dataUpdatedAt, isSimulating, initialStatus]);

  // --- Callback for Simulation ---
  const handleDataUpdate = useCallback(
    (newData: Partial<SensorData>) => {
      setData(newData); // Simulation also uses setData
    },
    [setData]
  );

  // --- Simulation Handlers (No change needed) ---
  const handleStartSimulation = () => {
    setError(null);
    startLoading(); // Uses the polling isLoading flag
    try {
      simService.startSimulation(handleDataUpdate, 1500);
      setSimulating(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start simulation"
      );
      setSimulating(false);
      stopLoading();
    }
  };

  const handleStopSimulation = () => {
    simService.stopSimulation();
    setSimulating(false);
  };

  // Combined loading state for UI feedback (show loading if initial OR polling is loading)
  const showLoading = isInitialLoading || (pollingIsLoading && !isSimulating);

  // --- UI --- (Adjust status message and loading indicators)
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex-1">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                FoodCam2Farm
              </h1>
              <p className="text-muted-foreground">
                The FoodCam2Farm system democratizes sustainable waste
                management by making advanced fermentation technology accessible
                to everyday citizens. By transforming food waste processing from
                an industrial operation to a community-scale activity, it
                creates new opportunities for direct citizen participation in
                climate solutions.
              </p>

              <p className="text-muted-foreground"></p>
              {/* Updated Status Line */}
              <p className="text-xs text-muted-foreground mt-1">
                Status:{" "}
                {initialStatus === "pending"
                  ? "Loading initial data..."
                  : isSimulating
                  ? "Simulating"
                  : initialError
                  ? "Initial load failed"
                  : "Polling API"}
                {/* Countdown Timer (only when polling) */}
                {initialStatus !== "pending" &&
                  !initialError &&
                  !isSimulating &&
                  secondsUntilRefetch !== null &&
                  secondsUntilRefetch > 0 && (
                    <span className="ml-1">
                      (Next refresh in {secondsUntilRefetch}s)
                    </span>
                  )}
                {/* Polling Refresh Indicator */}
                {initialStatus !== "pending" &&
                  !initialError &&
                  !isSimulating &&
                  pollingIsLoading &&
                  !pollingError && (
                    <span className="ml-1">(Refreshing...)</span>
                  )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* ... Badges ... */}
              <Badge
                variant={activeFilter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveFilter("all")}
              >
                All
              </Badge>
              {/* ... other badges ... */}
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
          {error && initialStatus !== "pending" && (
            <p className="text-red-600 mb-4">Error: {error}</p>
          )}

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
                    <CardTitle>Temperature (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["temperature"]}
                        colors={["#10b981"]}
                        units={["°C"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Humidity (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["humidity"]}
                        colors={["#3b82f6"]}
                        units={["%"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>CO₂ Level (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["co2"]}
                        colors={["#6b7280"]}
                        units={["ppm"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>O₂ Level (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["o2"]}
                        colors={["#0ea5e9"]}
                        units={["%"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Atmospheric Pressure (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["pressure"]}
                        colors={["#8b5cf6"]}
                        units={["hPa"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>IR Radiation (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
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

          {/* Soil Sensor Charts */}
          {(activeFilter === "all" || activeFilter === "soil") && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Soil Sensors</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Soil Moisture (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["moisture"]}
                        colors={["#65a30d"]}
                        units={["%"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Soil pH (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["ph"]}
                        colors={["#ec4899"]}
                        units={["pH"]}
                      />
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Electrical Conductivity (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    {showLoading ? (
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <SensorChart
                        data={historicalData}
                        dataKeys={["conductivity"]}
                        colors={["#f97316"]}
                        units={["mS/cm"]}
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
                      <CameraModule location={camera.name} />
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

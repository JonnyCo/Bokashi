"use client";

import { useCallback, useEffect } from "react";
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
  X,
  Square,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SensorChart from "@/components/sensor-chart";
import CameraModule from "@/components/camera-module";

import type { SensorData } from "./types";
import { useSensorStore } from "./store/sensorStore"; // Import Zustand store
import * as simService from "./services/simulationService";
// import * as btService from './services/bluetoothService'; // Keep for future implementation

// --- Mock API Fetch --- (Replace with actual fetch later)
const fetchSensorData = async (): Promise<Partial<SensorData>> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Simulate fetching data from an API endpoint
  // In a real scenario, this would be: `fetch('/api/sensor-data').then(res => res.json())`
  // For now, let's return a mock data point similar to the simulation
  const now = new Date();
  return {
    temperature: Math.round((22 + Math.random() * 8) * 10) / 10,
    humidity: Math.round((65 + Math.random() * 30) * 10) / 10,
    co2: Math.round((400 + Math.random() * 200) * 10) / 10,
    // Add other fields as needed for the API response
    timestamp: now.getTime(),
  };
};

// --- Camera Feeds (Keep as is) ---
const cameraFeeds = [
  {
    id: "main",
    name: "Main Growing Area",
    url: "/placeholder.svg?height=360&width=640&text=Main+Growing+Area",
  },
  {
    id: "seedling",
    name: "Seedling Station",
    url: "/placeholder.svg?height=360&width=640&text=Seedling+Station",
  },
  {
    id: "irrigation",
    name: "Irrigation System",
    url: "/placeholder.svg?height=360&width=640&text=Irrigation+System",
  },
  {
    id: "exterior",
    name: "Exterior View",
    url: "/placeholder.svg?height=360&width=640&text=Exterior+View",
  },
];

export default function Dashboard() {
  // --- State from Zustand Store ---
  const {
    currentSensorData,
    historicalData,
    isConnected,
    isSimulating,
    isLoading,
    error,
    activeFilter,
    setData,
    startLoading,
    stopLoading,
    setError,
    setConnected,
    setSimulating,
    setActiveFilter,
  } = useSensorStore((state) => state);

  // --- React Query for Data Polling ---
  const {
    data: queryData,
    error: queryError,
    isLoading: queryIsLoading,
  } = useQuery({
    queryKey: ["sensorData"],
    queryFn: fetchSensorData,
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: !(isConnected || isSimulating), // Only poll if not connected via BT or simulating
    staleTime: 4000, // Consider data fresh for 4 seconds
  });

  // --- Effect to update Zustand store from React Query ---
  useEffect(() => {
    if (queryData) {
      // Check if the timestamp is newer than the current one to avoid stale updates
      // Also ensure queryData.timestamp is not undefined
      if (
        queryData.timestamp !== undefined &&
        (!currentSensorData.timestamp ||
          queryData.timestamp > currentSensorData.timestamp)
      ) {
        setData(queryData);
      }
    }
  }, [queryData, setData, currentSensorData.timestamp]);

  useEffect(() => {
    if (queryError) {
      setError(
        queryError instanceof Error
          ? queryError.message
          : "Failed to fetch data"
      );
    }
  }, [queryError, setError]);

  // --- Callback for Simulation/Bluetooth --- (Now uses Zustand actions)
  const handleDataUpdate = useCallback(
    (newData: Partial<SensorData>) => {
      setData(newData);
    },
    [setData] // Dependency on the Zustand action setter
  );

  // --- Connection and Simulation Handlers (Use Zustand actions) ---

  const handleStartSimulation = () => {
    setError(null);
    startLoading();
    try {
      simService.startSimulation(handleDataUpdate, 1500);
      setSimulating(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start simulation"
      );
      setSimulating(false); // Ensure simulation state is false on error
      stopLoading(); // Ensure loading is stopped on error
    }
  };

  const handleStopSimulation = () => {
    simService.stopSimulation();
    setSimulating(false);
    // Optionally reset sensor data via Zustand action if needed
    // resetState();
  };

  const handleConnect = async () => {
    setError(null);
    startLoading();
    alert(
      "Actual Bluetooth connection not implemented yet. Use Simulation or Polling."
    );
    // Placeholder: In real implementation, update Zustand based on btService result
    // try {
    //   await btService.connect(handleDataUpdate);
    //   setConnected(true);
    // } catch (err) {
    //   setError(err instanceof Error ? err.message : 'Failed to connect');
    //   setConnected(false);
    // } finally {
    //   stopLoading();
    // }
    stopLoading(); // Remove this line when implementing real connection
  };

  const handleDisconnect = () => {
    // if (isConnected) btService.disconnect(); // Call when implemented
    setConnected(false);
  };

  // Combined loading state (can show loading from query or manual actions)
  const showLoading =
    isLoading || (queryIsLoading && !isConnected && !isSimulating);

  // --- UI --- (Remains largely the same, reads from Zustand state)
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex-1">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Farm Monitoring Dashboard
              </h1>
              <p className="text-muted-foreground">
                Real-time sensor data and camera feeds from your automated farm
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status:{" "}
                {isConnected
                  ? "Connected (BT)"
                  : isSimulating
                  ? "Simulating"
                  : "Polling API"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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

              <div className="ml-auto flex gap-2">
                {!(isConnected || isSimulating) ? (
                  <>
                    {/* Connect Button remains for future BT implementation */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnect}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      Connect BT
                    </Button>
                    {/* Simulate Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartSimulation}
                      disabled={isLoading}
                      className="flex items-center gap-1"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Simulate
                    </Button>
                    {/* Display Loading indicator for polling if applicable */}
                    {queryIsLoading && !isLoading && (
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </>
                ) : (
                  <>
                    {isConnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Disconnect
                      </Button>
                    )}
                    {isSimulating && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStopSimulation}
                        className="flex items-center gap-1"
                      >
                        <Square className="h-4 w-4" />
                        Stop Sim
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 mb-4">Error: {error}</p>}

          {/* Key Metrics Section - Reads from currentSensorData (Zustand) */}
          {(activeFilter === "all" ||
            activeFilter === "environment" ||
            activeFilter === "soil") && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Environment Sensors */}
              {(activeFilter === "all" || activeFilter === "environment") && (
                <>
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
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.temperature !== null &&
                        currentSensorData.temperature !== undefined
                          ? `${currentSensorData.temperature}°C`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 18-26°C
                      </p>
                    </CardContent>
                  </Card>

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
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.humidity !== null &&
                        currentSensorData.humidity !== undefined
                          ? `${currentSensorData.humidity}%`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 50-80%
                      </p>
                    </CardContent>
                  </Card>

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
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.co2 !== null &&
                        currentSensorData.co2 !== undefined
                          ? `${currentSensorData.co2} ppm`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 350-500 ppm
                      </p>
                    </CardContent>
                  </Card>

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
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.o2 !== null &&
                        currentSensorData.o2 !== undefined
                          ? `${currentSensorData.o2}%`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 20-21%
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
              {/* Soil Sensors */} {/* Read from currentSensorData */}
              {(activeFilter === "all" || activeFilter === "soil") && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Soil Moisture
                      </CardTitle>
                      <Leaf className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.moisture !== null &&
                        currentSensorData.moisture !== undefined
                          ? `${currentSensorData.moisture}%`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 30-60%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Soil pH
                      </CardTitle>
                      <Flask className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.ph !== null &&
                        currentSensorData.ph !== undefined
                          ? `${currentSensorData.ph}`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 6.0-7.0
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Conductivity
                      </CardTitle>
                      <Gauge className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.conductivity !== null &&
                        currentSensorData.conductivity !== undefined
                          ? `${currentSensorData.conductivity} mS/cm`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Optimal range: 0.8-1.6 mS/cm
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        IR Radiation
                      </CardTitle>
                      <Sun className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {currentSensorData.ir !== null &&
                        currentSensorData.ir !== undefined
                          ? `${currentSensorData.ir} W/m²`
                          : showLoading
                          ? "Loading..."
                          : "N/A"}
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

          {/* Charts Section - Reads from historicalData (Zustand) */}
          {/* Environment Sensor Charts */}
          {(activeFilter === "all" || activeFilter === "environment") && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Environment Sensors</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Pass historicalData from Zustand store to charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Temperature (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["temperature"]}
                      colors={["#10b981"]}
                      units={["°C"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Humidity (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["humidity"]}
                      colors={["#3b82f6"]}
                      units={["%"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CO₂ Level (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["co2"]}
                      colors={["#6b7280"]}
                      units={["ppm"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>O₂ Level (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["o2"]}
                      colors={["#0ea5e9"]}
                      units={["%"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Atmospheric Pressure (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["pressure"]}
                      colors={["#8b5cf6"]}
                      units={["hPa"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>IR Radiation (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["ir"]}
                      colors={["#f59e0b"]}
                      units={["W/m²"]}
                    />
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
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["moisture"]}
                      colors={["#65a30d"]}
                      units={["%"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Soil pH (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["ph"]}
                      colors={["#ec4899"]}
                      units={["pH"]}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Electrical Conductivity (24h)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <SensorChart
                      data={historicalData}
                      dataKeys={["conductivity"]}
                      colors={["#f97316"]}
                      units={["mS/cm"]}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Camera Feeds */}
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
                        imageUrl={camera.url}
                        location={camera.name}
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

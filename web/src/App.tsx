"use client";

import { useState, useCallback } from "react";
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

import type { SensorData, HistoricalDataPoint } from "./types";
import * as simService from "./services/simulationService";

// Mock historical data generation
const generateHistoricalData = (hours = 24): HistoricalDataPoint[] => {
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

// Camera feed URLs - these would be your actual remote JPG URLs
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
  // State for current sensor readings
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: null,
    humidity: null,
    co2: null,
    o2: null,
    ph: null,
    pressure: null,
    moisture: null,
    ir: null,
    conductivity: null,
    camera: null, // Initialize camera state
    timestamp: null, // Initialize timestamp state
  });

  // State for historical chart data
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    generateHistoricalData()
  );
  // State for connection/simulation status
  const [isConnected, setIsConnected] = useState(false); // For actual Bluetooth
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Keep for UI feedback during connect/sim start
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  /**
   * Callback to handle incoming data (from BT or Simulation).
   * Updates current sensor state and historical data array.
   */
  const handleDataUpdate = useCallback(
    (newData: Partial<SensorData>) => {
      const now = new Date();
      const updatedData: SensorData = {
        // Ensure all fields are present, merging new data over previous
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
        ...sensorData, // Spread previous state first
        ...newData, // Spread new incoming data
        timestamp: newData.timestamp ?? now.getTime(), // Use provided timestamp or generate one
      };

      setSensorData(updatedData);

      // Update historical data for charts
      setHistoricalData((prev) => {
        const newPoint: HistoricalDataPoint = {
          ...updatedData, // Use the fully populated updatedData
          time: now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        // Keep the last ~24 hours (adjust length as needed)
        return [...prev.slice(1), newPoint];
      });

      // TODO: Add call to backend API for logging here if needed
      // fetch('/api/log', { method: 'POST', body: JSON.stringify(updatedData), ... });
    },
    [sensorData]
  ); // Dependency on sensorData to ensure closure has latest state

  // --- Connection and Simulation Handlers ---

  const handleStartSimulation = () => {
    setError(null);
    setIsLoading(true);
    try {
      // Use the simService, providing the update handler
      simService.startSimulation(handleDataUpdate, 1500); // Update every 1.5 seconds
      setIsSimulating(true);
      setIsConnected(false); // Can't simulate and be connected
      setIsLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start simulation"
      );
      setIsSimulating(false);
      setIsLoading(false);
    }
  };

  const handleStopSimulation = () => {
    simService.stopSimulation();
    setIsSimulating(false);
    // Optionally reset sensor data to null
    // setSensorData({ ...initialSensorState });
  };

  // Placeholder for actual Bluetooth connection
  const handleConnect = async () => {
    setError(null);
    setIsLoading(true);
    alert("Actual Bluetooth connection not implemented yet. Use Simulation.");
    // try {
    //   await btService.connect(handleDataUpdate);
    //   setIsConnected(true);
    //   setIsSimulating(false);
    // } catch (err) {
    //   setError(err instanceof Error ? err.message : 'Failed to connect');
    //   setIsConnected(false);
    // } finally {
    //    setIsLoading(false);
    // }
    setIsLoading(false); // Remove this line when implementing real connection
  };

  const handleDisconnect = () => {
    // if (isConnected) btService.disconnect(); // Call when implemented
    setIsConnected(false);
  };

  // REMOVED: fetchData simulation and related useEffect
  // The simulation is now handled by simService and triggered by buttons

  // --- UI Related ---

  // Define sensor categories for filtering - KEEPING, needed for UI logic
  // const sensorCategories = {
  //   environment: ["temperature", "humidity", "co2", "o2", "pressure", "ir"],
  //   soil: ["moisture", "ph", "conductivity"],
  // };

  // Helper function to check if a section should be visible based on the active filter
  // Commented out as it is not used in the current JSX filtering logic
  // const isVisible = (section: string): boolean => {
  //   if (activeFilter === "all") return true;
  //   // Add check for camera filter
  //   if (activeFilter === 'cameras' && section === 'cameras') return true;
  //   // Check against sensor categories
  //   if (activeFilter === 'environment' && sensorCategories.environment.some(s => section.toLowerCase().includes(s))) return true;
  //   if (activeFilter === 'soil' && sensorCategories.soil.some(s => section.toLowerCase().includes(s))) return true;

  //   // A simple check based on top-level card sections might be needed depending on exact structure
  //   // This is a basic implementation, might need refinement based on how sections are defined in the JSX
  //   return activeFilter === section;
  // };

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

          {/* Key Metrics Section */}
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
                        {sensorData.temperature !== null
                          ? `${sensorData.temperature}°C`
                          : "Loading..."}
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
                        {sensorData.humidity !== null
                          ? `${sensorData.humidity}%`
                          : "Loading..."}
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
                        {sensorData.co2 !== null
                          ? `${sensorData.co2} ppm`
                          : "Loading..."}
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
                        {sensorData.o2 !== null
                          ? `${sensorData.o2}%`
                          : "Loading..."}
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
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Soil Moisture
                      </CardTitle>
                      <Leaf className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {sensorData.moisture !== null
                          ? `${sensorData.moisture}%`
                          : "Loading..."}
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
                        {sensorData.ph !== null
                          ? `${sensorData.ph}`
                          : "Loading..."}
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
                        {sensorData.conductivity !== null
                          ? `${sensorData.conductivity} mS/cm`
                          : "Loading..."}
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
                        {sensorData.ir !== null
                          ? `${sensorData.ir} W/m²`
                          : "Loading..."}
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

          {/* Environment Sensor Charts */}
          {(activeFilter === "all" || activeFilter === "environment") && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Environment Sensors</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

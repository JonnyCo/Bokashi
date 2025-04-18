"use client";

import { useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Define API base URL the same way as in App.tsx
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"; // Fallback for local dev if needed

interface CameraModuleProps {
  location: string;
}

// Define the expected API response structure
interface ImageResponse {
  success: boolean;
  data: {
    id: number;
    imageUrl: string; // URL to image instead of base64 data
    imageBase64: string;
    timestamp: string;
  };
}

// Function to fetch the latest camera image data
const fetchLatestImage = async (): Promise<ImageResponse["data"]> => {
  const response = await fetch(`${API_BASE_URL}/images/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const data: ImageResponse = await response.json();
  console.log("Camera API response:", data);

  if (!data.success || !data.data) {
    throw new Error("Invalid image data received");
  }

  return data.data;
};

export default function CameraModule({ location }: CameraModuleProps) {
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);

  // Use React Query to manage the image data, loading state, and refresh
  const {
    data: imageData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["cameraImage", location],
    queryFn: fetchLatestImage,
    refetchInterval: 10000, // Poll every 10 seconds
    refetchOnWindowFocus: false,
    staleTime: 9000, // Consider data stale after 9 seconds
  });

  // Create a date object from the last updated timestamp or use the data timestamp
  const lastUpdated = imageData?.timestamp
    ? new Date(imageData.timestamp)
    : dataUpdatedAt
    ? new Date(dataUpdatedAt)
    : new Date();

  // Handle image load success
  const handleImageLoad = () => {
    setImgLoadError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setImgLoadError(true);
  };

  // Determine if we should show an error
  const showError = error || imgLoadError;

  // Format the base64 string into a proper data URL
  const formatBase64Image = (base64: string | undefined) => {
    if (!base64) return "/placeholder.svg";

    // Check if the base64 already includes the data URL prefix
    if (base64.startsWith("data:image")) {
      return base64;
    }

    // Add the proper data URL prefix for images
    return `data:image/jpeg;base64,${base64}`;
  };

  // Use the properly formatted base64 data
  const imageSrc = imageData
    ? formatBase64Image(imageData.imageBase64)
    : "/placeholder.svg";
  console.log("Using image source:", imageSrc?.substring(0, 50) + "...");

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="relative flex-1 bg-muted rounded-md overflow-hidden border">
        {/* The actual camera image */}
        <div
          className={`relative h-full w-full ${
            isLoading || showError ? "opacity-50" : "opacity-100"
          } transition-opacity`}
        >
          {/* Use standard img tag with the URL */}
          <img
            key={dataUpdatedAt?.toString()} // Force re-render when data updates
            src={imageSrc}
            alt={`Camera feed from ${location}`}
            style={{ position: "absolute", height: "100%", width: "100%" }}
            className="object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Timestamp overlay */}
          {!showError && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-right">
              {lastUpdated.toLocaleString()}
            </div>
          )}

          {/* Location overlay */}
          {!showError && (
            <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
              {location}
            </div>
          )}
        </div>
        {/* Loading overlay */}
        {isLoading && !showError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Error overlay */}
        {showError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 pointer-events-none">
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Failed to load camera feed"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-7 px-2"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

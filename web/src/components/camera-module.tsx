"use client";

import { useEffect, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraModuleProps {
  imageUrl: string;
  location: string;
}

export default function CameraModule({
  imageUrl,
  location,
}: CameraModuleProps) {
  const [currentUrl, setCurrentUrl] = useState(imageUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to refresh the camera feed
  const refreshFeed = () => {
    setIsLoading(true);
    setError(null);

    // In a real implementation, you would add a timestamp or random parameter
    // to force a fresh image from the server
    const timestamp = new Date().getTime();
    const refreshedUrl = imageUrl.includes("?")
      ? `${imageUrl}&t=${timestamp}`
      : `${imageUrl}?t=${timestamp}`;

    // Simulate a network request
    setTimeout(() => {
      setCurrentUrl(refreshedUrl);
      setLastUpdated(new Date());
      // Don't set isLoading to false here, let the image onLoad/onError handle it
    }, 500); // Short delay just to show spinner potentially
  };

  // Initialize camera feed and set up interval
  useEffect(() => {
    refreshFeed(); // Initial refresh call

    // Set up auto-refresh interval (every 30 seconds)
    const interval = setInterval(refreshFeed, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [imageUrl]); // Rerun effect if imageUrl changes

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null); // Clear any previous error
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setError("Failed to load camera feed");
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="relative flex-1 bg-muted rounded-md overflow-hidden border">
        {" "}
        {/* Added border */}
        {/* The actual camera image */}
        <div
          className={`relative h-full w-full ${
            isLoading || error ? "opacity-50" : "opacity-100"
          } transition-opacity`}
        >
          {/* Use standard img tag instead of next/image */}
          <img
            key={currentUrl} // Force re-render when URL changes
            src={currentUrl || "/placeholder.svg"}
            alt={`Camera feed from ${location}`}
            // Use style for fill behavior, className for object-cover
            style={{ position: "absolute", height: "100%", width: "100%" }}
            className="object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Timestamp overlay */}
          {!error && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-right">
              {lastUpdated.toLocaleString()}
            </div>
          )}

          {/* Location overlay */}
          {!error && (
            <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-xs p-1">
              {location}
            </div>
          )}
        </div>
        {/* Loading overlay */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 pointer-events-none">
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-center text-muted-foreground">{error}</p>
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
          onClick={refreshFeed}
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

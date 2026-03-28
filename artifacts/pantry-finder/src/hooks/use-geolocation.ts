import { useState, useEffect } from "react";

export interface Coordinates {
  lat: number;
  lng: number;
}

// Default to Temple Square, SLC
export const DEFAULT_COORDS: Coordinates = {
  lat: 40.7707,
  lng: -111.8911,
};

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setCoords(DEFAULT_COORDS);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setError("Location access denied or unavailable. Using default location.");
        setCoords(DEFAULT_COORDS);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes
      }
    );
  }, []);

  return { coords, setCoords, error, loading };
}

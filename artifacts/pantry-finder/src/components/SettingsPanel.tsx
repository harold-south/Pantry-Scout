import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarDays, Navigation, Moon, Search, Loader2 } from "lucide-react";
import type { Coordinates } from "@/hooks/use-geolocation";

interface SettingsPanelProps {
  isOpen: boolean;
  coords: Coordinates;
  days: number;
  darkMode: boolean;
  onCoordsChange: (coords: Coordinates) => void;
  onDaysChange: (days: number) => void;
  onResetLocation: () => void;
  onDarkModeToggle: () => void;
}

export function SettingsPanel({
  isOpen,
  coords,
  days,
  darkMode,
  onCoordsChange,
  onDaysChange,
  onResetLocation,
  onDarkModeToggle,
}: SettingsPanelProps) {
  const [zipCode, setZipCode] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  async function handleZipLookup() {
    const zip = zipCode.trim();
    if (!/^\d{5}$/.test(zip)) {
      setZipError("Please enter a valid 5-digit ZIP code");
      return;
    }
    setZipLoading(true);
    setZipError(null);
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) {
        setZipError("ZIP code not found. Please try another.");
        return;
      }
      const data = await res.json() as { places?: Array<{ latitude: string; longitude: string; "place name": string }> };
      const place = data.places?.[0];
      if (!place) {
        setZipError("Could not find coordinates for this ZIP code.");
        return;
      }
      onCoordsChange({
        lat: parseFloat(place.latitude),
        lng: parseFloat(place.longitude),
      });
      setZipCode("");
    } catch {
      setZipError("Failed to look up ZIP code. Please check your connection.");
    } finally {
      setZipLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginBottom: 0 }}
          animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
          exit={{ height: 0, opacity: 0, marginBottom: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-lg shadow-black/5 space-y-5">
            <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Search Settings
            </h3>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between pt-1 pb-2 border-b border-border/50">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                Dark Mode
              </label>
              <button
                role="switch"
                aria-checked={darkMode}
                onClick={onDarkModeToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  darkMode ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* ZIP Code Lookup */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                Search by ZIP Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 84101"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value.replace(/\D/g, ""));
                    setZipError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleZipLookup()}
                  className="flex-1 bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button
                  onClick={handleZipLookup}
                  disabled={zipLoading || zipCode.length !== 5}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90 flex items-center gap-1.5"
                >
                  {zipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
                </button>
              </div>
              {zipError && (
                <p className="text-xs text-destructive ml-1">{zipError}</p>
              )}
            </div>

            {/* Lat/Lng Inputs */}
            <div className="space-y-3 pt-1 border-t border-border/50">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Custom Coordinates
                </label>
                <button
                  onClick={onResetLocation}
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded-md"
                >
                  Reset to GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground ml-1">Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={coords.lat}
                    onChange={(e) => onCoordsChange({ ...coords, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground ml-1">Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={coords.lng}
                    onChange={(e) => onCoordsChange({ ...coords, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Days Slider */}
            <div className="space-y-3 pt-2 border-t border-border/50">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                Look Ahead (Days)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={days}
                  onChange={(e) => onDaysChange(parseInt(e.target.value))}
                  className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="w-12 text-center font-bold text-primary bg-primary/10 py-1.5 rounded-lg">
                  {days}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CalendarDays, Navigation } from "lucide-react";
import type { Coordinates } from "@/hooks/use-geolocation";

interface SettingsPanelProps {
  isOpen: boolean;
  coords: Coordinates;
  days: number;
  onCoordsChange: (coords: Coordinates) => void;
  onDaysChange: (days: number) => void;
  onResetLocation: () => void;
}

export function SettingsPanel({ 
  isOpen, 
  coords, 
  days, 
  onCoordsChange, 
  onDaysChange,
  onResetLocation 
}: SettingsPanelProps) {
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
          <div className="bg-white dark:bg-card border border-border/60 rounded-2xl p-5 shadow-lg shadow-black/5">
            <h3 className="font-display font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Search Settings
            </h3>
            
            <div className="space-y-5">
              {/* Location Overrides */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Custom Location
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

              {/* Days Override */}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

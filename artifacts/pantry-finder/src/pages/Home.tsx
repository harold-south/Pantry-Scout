import { useState, useMemo, useEffect } from "react";
import { useGetPantryEvents, type PantryEvent } from "@workspace/api-client-react";
import { useGeolocation, DEFAULT_COORDS } from "@/hooks/use-geolocation";
import { EventCard } from "@/components/EventCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Settings2, RefreshCw, Calendar as CalendarIcon, Leaf, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { coords: geoCoords, loading: geoLoading, setCoords: setGeoCoords } = useGeolocation();
  const [coords, setCoords] = useState(geoCoords || DEFAULT_COORDS);
  const [days, setDays] = useState(5);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync geoCoords when they arrive and user hasn't manually changed them
  useEffect(() => {
    if (geoCoords && coords.lat === DEFAULT_COORDS.lat && coords.lng === DEFAULT_COORDS.lng) {
      setCoords(geoCoords);
    }
  }, [geoCoords]);

  const { data, isLoading, isError, refetch, isRefetching } = useGetPantryEvents(
    { lat: coords.lat, lng: coords.lng, days },
    { query: { enabled: true } }
  );

  // Group events by date
  const groupedEvents = useMemo(() => {
    if (!data?.events) return [];
    
    const groups = data.events.reduce((acc, event) => {
      const key = event.date;
      if (!acc[key]) {
        acc[key] = {
          date: event.date,
          day: event.day,
          events: []
        };
      }
      acc[key].events.push(event);
      return acc;
    }, {} as Record<string, { date: string, day: string, events: PantryEvent[] }>);

    // Convert to array and sort by date string (assuming MM-DD-YYYY sorts okay for near future, or API returns sorted)
    // The API is expected to return them in chronological order. We'll trust the insertion order.
    return Object.values(groups);
  }, [data?.events]);

  const handleRefresh = () => {
    refetch();
  };

  const handleResetLocation = () => {
    setCoords(geoCoords || DEFAULT_COORDS);
  };

  const headerDateRange = data?.windowStart && data?.windowEnd 
    ? `${data.windowStart} - ${data.windowEnd}` 
    : "Loading upcoming events...";

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Optional decorative background image imported via Vite */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)` }}
      />

      <div className="max-w-xl mx-auto min-h-screen shadow-2xl shadow-black/5 bg-background relative z-10 sm:border-x border-border/40 pb-20">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border/50 pt-6 pb-4 px-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Pantry Finder
                <Leaf className="w-6 h-6 text-primary fill-primary/20" />
              </h1>
              <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {headerDateRange}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all disabled:opacity-50"
                aria-label="Refresh events"
              >
                <RefreshCw className={`w-5 h-5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2.5 rounded-full transition-all ${isSettingsOpen ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}
                aria-label="Settings"
              >
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner */}
          {!isLoading && data && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary to-emerald-600 text-white rounded-xl p-3.5 flex justify-between items-center shadow-lg shadow-primary/20"
            >
              <div className="flex items-center gap-2 font-semibold">
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">{data.totalCount}</span>
                <span>distributions found</span>
              </div>
              <span className="text-xs font-medium text-white/80 hidden xs:inline-block">
                Long-press to save
              </span>
            </motion.div>
          )}
        </header>

        <main className="px-5 pt-6">
          <SettingsPanel 
            isOpen={isSettingsOpen}
            coords={coords}
            days={days}
            onCoordsChange={setCoords}
            onDaysChange={setDays}
            onResetLocation={handleResetLocation}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="w-32 h-6 bg-muted rounded-md animate-pulse ml-2" />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center mt-10">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-bold text-destructive mb-2">Unable to load events</h3>
              <p className="text-sm text-destructive/80 mb-4">We couldn't reach the pantry database. Please check your connection and try again.</p>
              <button 
                onClick={handleRefresh}
                className="bg-destructive text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-destructive/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && data?.events.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center px-4"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Leaf className="w-12 h-12 text-primary opacity-50" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">No events found</h2>
              <p className="text-muted-foreground max-w-[280px]">
                There are no mobile pantry distributions scheduled near this location for the next {days} days.
              </p>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-8 text-primary font-semibold hover:underline"
              >
                Expand search settings
              </button>
            </motion.div>
          )}

          {/* Events List */}
          {!isLoading && !isError && groupedEvents.length > 0 && (
            <div className="space-y-10 pb-10">
              {groupedEvents.map((group, groupIndex) => (
                <div key={group.date} className="space-y-4">
                  {/* Section Header */}
                  <div className="sticky top-[140px] z-30 bg-background/95 backdrop-blur-md py-2 -mx-2 px-2 border-l-4 border-primary rounded-r-md flex items-baseline gap-2 shadow-sm">
                    <h2 className="font-display text-xl font-bold text-foreground capitalize">
                      {group.day}
                    </h2>
                    <span className="text-sm font-medium text-muted-foreground">
                      {group.date}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-4">
                    {group.events.map((event, index) => (
                      <EventCard 
                        key={`${event.isoDate}-${event.name}`} 
                        event={event} 
                        index={groupIndex * 2 + index} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

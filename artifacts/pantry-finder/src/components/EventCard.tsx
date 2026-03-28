import { motion } from "framer-motion";
import { Building2, Clock, MapPin } from "lucide-react";
import type { PantryEvent } from "@workspace/api-client-react";

interface EventCardProps {
  event: PantryEvent;
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  // Simple check for "Today" - in a real app, you'd compare with user's local date properly.
  // We'll use a basic string comparison for demonstration, assuming the API returns current local dates.
  const todayDateStr = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date()).replace(/\//g, '-');
  
  const isToday = event.date === todayDateStr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -2, scale: 0.995 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-all relative overflow-hidden group cursor-pointer"
      // Add standard long-press handlers or context menu here in a full app
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Decorative gradient blur in background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      {/* Top Row: Building & Distance */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {event.buildingName || "Mobile Location"}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-500/20 shadow-sm shadow-amber-100/50">
          <MapPin className="w-3 h-3" />
          <span className="text-xs font-bold">{event.distanceMiles.toFixed(1)} mi</span>
        </div>
      </div>

      {/* Event Title */}
      <h3 className="font-display text-xl font-bold text-foreground leading-tight mb-3 relative z-10 group-hover:text-primary transition-colors">
        {event.name}
      </h3>

      {/* Details List */}
      <div className="space-y-2.5 relative z-10">
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/60" />
          <span className="leading-snug">{event.address}</span>
        </div>

        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 shrink-0 text-primary" />
            <span>{event.time}</span>
          </div>
          
          {isToday && (
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm shadow-primary/25 animate-pulse">
              Today
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

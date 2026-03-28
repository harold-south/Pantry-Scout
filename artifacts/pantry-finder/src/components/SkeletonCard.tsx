import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border relative overflow-hidden">
      {/* Shimmer effect */}
      <motion.div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-10"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div className="w-32 h-6 bg-muted rounded-full" />
        <div className="w-16 h-6 bg-muted rounded-full" />
      </div>
      
      <div className="w-3/4 h-7 bg-muted rounded-lg mb-4" />
      
      <div className="space-y-3">
        <div className="flex gap-2.5">
          <div className="w-4 h-4 rounded-full bg-muted shrink-0" />
          <div className="w-full h-4 bg-muted rounded-md" />
        </div>
        <div className="flex gap-2.5">
          <div className="w-4 h-4 rounded-full bg-muted shrink-0" />
          <div className="w-24 h-4 bg-muted rounded-md" />
        </div>
      </div>
    </div>
  );
}

import { motion } from "motion/react";
import { useState } from "react";

export function GridPattern() {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  
  // Calculate number of cells based on viewport
  const cellSize = 80;
  const cols = Math.ceil(window.innerWidth / cellSize) + 2;
  const rows = Math.ceil(window.innerHeight / cellSize) + 2;

  return (
    <div className="fixed inset-0 z-0">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at top left, rgba(8, 145, 165, 0.04) 0%, rgba(242, 243, 243, 0.06) 50%, rgba(22, 39, 63, 0.03) 100%)',
        }}
      />
      
      {/* Interactive Grid Cells */}
      <div 
        className="absolute inset-0"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: cols * rows }).map((_, index) => {
          const cellId = `cell-${index}`;
          const isHovered = hoveredCell === cellId;
          
          return (
            <motion.div
              key={cellId}
              className="relative"
              style={{
                borderRightWidth: '0',
                borderBottomWidth: '0',
              }}
              onHoverStart={() => setHoveredCell(cellId)}
              onHoverEnd={() => setHoveredCell(null)}
              animate={{
                backgroundColor: isHovered 
                  ? 'rgba(8, 145, 165, 0.08)' 
                  : 'rgba(255, 255, 255, 0)',
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Inner subdivision lines - only small grid */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#D5D5D4" strokeWidth="0.25" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#D5D5D4" strokeWidth="0.25" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#D5D5D4" strokeWidth="0.25" />
                <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#D5D5D4" strokeWidth="0.25" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#D5D5D4" strokeWidth="0.25" />
                <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#D5D5D4" strokeWidth="0.25" />
              </svg>
            </motion.div>
          );
        })}
      </div>
      
      {/* Gradient overlay for fade effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.3) 100%)',
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
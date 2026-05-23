import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import O1 from "@/imports/O1";
import O2 from "@/imports/O2";
import KeyText from "@/imports/Light-79-1120";

export function AnimatedLogo() {
  const [showO2, setShowO2] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowO2((prev) => !prev);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="flex items-center" style={{ gap: '0px', height: '77px' }}>
        {/* O animada */}
        <div className="relative" style={{ width: '52px', height: '52px', flexShrink: 0 }}>
          <AnimatePresence>
            {showO2 ? (
              <motion.div
                key="o2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <O2 />
              </motion.div>
            ) : (
              <motion.div
                key="o1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <O1 />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Texto "key!" del SVG - mismo alto que la O */}
        <div style={{ width: '177px', height: '77px', flexShrink: 0, marginLeft: '-40px' }}>
          <KeyText />
        </div>
      </div>
    </div>
  );
}
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface LoaderProps {
  onComplete: () => void;
  key?: string | number;
}

export default function Loader({ onComplete }: LoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-dark-bg"
    >
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* 3D Coin Animation */}
        <motion.div
          animate={{
            rotateY: 360,
            y: [0, -15, 0],
          }}
          transition={{
            rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FF9800] via-[#FFA726] to-[#E65100] shadow-[0_0_50px_rgba(255,152,0,0.4)] flex items-center justify-center border-4 border-[#FFB74D]/30"
        >
          <span className="text-white font-display font-extrabold text-2xl tracking-tighter drop-shadow-md">
            GTC
          </span>
          
          {/* Reflective Edge */}
          <div className="absolute inset-0 rounded-full border-r-4 border-primary/40 blur-[1px]" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
        </motion.div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/10 rounded-full blur-[60px]" />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/60 font-display text-sm tracking-widest uppercase"
        >
          Loading Experience
        </motion.div>
        
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        
        <motion.span 
          className="text-accent font-mono text-xs"
          key={progress}
        >
          {progress}%
        </motion.span>
      </div>
    </motion.div>
  );
}

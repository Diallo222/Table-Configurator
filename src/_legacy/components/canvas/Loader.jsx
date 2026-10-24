import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { motion } from "framer-motion";

export const Loader = ({ started, setStarted }) => {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setStarted(true);
      }, 1100);
    }
  }, [progress, setStarted]);

  // Progress bar animation variants
  const progressVariants = {
    initial: { width: 0 },
    animate: { width: `${progress}%` },
  };

  // Text animation variants
  const textVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-white to-gray-100 z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: started ? 0 : 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
      style={{ pointerEvents: started ? "none" : "auto" }}
    >
      <div className="flex flex-col items-center max-w-md w-full px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full mb-8"
        >
          <motion.h1
            className="text-3xl md:text-5xl font-light text-gray-800 mb-3 text-center"
            initial="initial"
            animate="animate"
            variants={textVariants}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Preparing Your Table
          </motion.h1>
          <motion.p
            className="text-base md:text-lg text-gray-500 text-center"
            initial="initial"
            animate="animate"
            variants={textVariants}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Creating an immersive experience just for you
          </motion.p>
        </motion.div>

        {/* Progress container */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            variants={progressVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Percentage */}
        <motion.div
          className="flex justify-between items-center w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-sm text-gray-500">Loading 3D assets</p>
          <p className="text-sm font-medium text-gray-700">
            {Math.floor(progress)}%
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="mt-10 flex justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 mx-1 rounded-full bg-indigo-400"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{
                repeat: Infinity,
                repeatType: "loop",
                duration: 1.5,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

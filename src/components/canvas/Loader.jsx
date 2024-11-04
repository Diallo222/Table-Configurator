import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { motion } from "framer-motion";

export const Loader = (props) => {
  const { started, setStarted } = props;
  const { progress, total, loaded, item } = useProgress();

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setStarted(true);
      }, 1100);
    }
  }, [progress, total, loaded, item]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200"
      initial={{ opacity: 1 }}
      animate={{ opacity: started ? 0 : 1 }}
      transition={{ duration: 1 }}
    >
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-2xl md:text-7xl text-black mt-4">Loading</p>
        <p className="text-lg md:text-3xl text-black mt-2">
          {Math.floor(progress)}%
        </p>
      </div>
    </motion.div>
  );
};

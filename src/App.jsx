import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PiHandGrabbingBold } from "react-icons/pi";
import { Scene, Loader } from "./components/canvas";
import { Configurator } from "./components/UI";
import { motion } from "motion/react";

function App() {
  const [started, setStarted] = useState(false);
  return (
    <div className="relative z-0 w-screen h-screen overscroll-none overflow-y-hidden scrollbar-thin -ms-overflow-y-hidden">
      <Loader started={started} setStarted={setStarted} />
      <Canvas shadows camera={{ position: [4, 4, -12], fov: 35 }}>
        <Suspense>{started && <Scene />}</Suspense>
      </Canvas>
      <Configurator />
      {started && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center gap-3 text-gray-800"
        >
          <motion.div
            animate={{
              y: [0, -5, 0],
              rotate: [0, -10, 0, 10, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
            className="text-black"
          >
            <PiHandGrabbingBold size={26} />
          </motion.div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Drag to rotate</span>
            <span className="text-xs text-gray-500">Scroll to zoom</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;

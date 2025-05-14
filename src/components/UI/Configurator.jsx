import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaAngleDown, FaAngleUp, FaInfoCircle } from "react-icons/fa";
import { useConfiguratorStore } from "../../store/hooks";
import { styles } from "../../styles";

const Configurator = () => {
  const { legs, setLegs, legsColor, setLegsColor, tableWidth, setTableWidth } =
    useConfiguratorStore();

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Using arrow function per requirements
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 md:absolute md:top-4 md:right-4 md:bottom-auto md:left-auto 
                p-4 md:p-6 rounded-t-2xl md:rounded-2xl w-full md:w-80 lg:w-96 
                bg-white/90 backdrop-blur-sm shadow-lg border border-gray-100 
                z-10 max-h-[80vh] md:max-h-[90vh] overflow-y-auto"
      initial={{ opacity: 0, y: 100, x: 0 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Heading */}
      <div className="flex flex-row justify-between items-center gap-2 mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-black">
          Table Configurator
        </h2>
        <button
          onClick={toggleMenu}
          className="rounded-full bg-black text-white p-2 hover:bg-gray-700 transition-colors"
        >
          {isMenuOpen ? <FaAngleUp /> : <FaAngleDown />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-y-auto"
          >
            {/* Radio Buttons for Leg Styles */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <p className={`${styles.label} text-md font-medium`}>
                  Legs Style
                </p>
                <button
                  className="text-gray-400 hover:text-black"
                  onMouseEnter={() => setActiveTooltip("legs")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <FaInfoCircle />
                </button>
              </div>
              {activeTooltip === "legs" && (
                <motion.p
                  className="text-xs text-gray-500 mb-2 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Choose the style that best fits your interior design
                </motion.p>
              )}
              <div className={`${styles.container} grid grid-cols-3 gap-2`}>
                {["Classic", "Minimal", "Design"].map((style, index) => (
                  <motion.label
                    key={index}
                    className={`text-black flex flex-col items-center justify-center p-2 md:p-3 rounded-lg transition-all cursor-pointer
                      ${
                        legs === index
                          ? "bg-black text-white shadow-md"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <input
                      type="radio"
                      name="legs-style"
                      value={index}
                      checked={legs === index}
                      onChange={() => setLegs(index)}
                      className="sr-only"
                    />
                    <div className="mb-2 h-12 md:h-16 flex items-center justify-center">
                      {index === 0 && (
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={legs === index ? "white" : "black"}
                          strokeWidth="1.5"
                        >
                          <rect x="4" y="2" width="2" height="20" />
                          <rect x="18" y="2" width="2" height="20" />
                          <rect x="2" y="4" width="20" height="2" />
                        </svg>
                      )}
                      {index === 1 && (
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={legs === index ? "white" : "black"}
                          strokeWidth="1.5"
                        >
                          <path d="M6 2L4 6v14h2V6M18 2l2 4v14h-2V6" />
                          <rect x="2" y="6" width="20" height="2" />
                        </svg>
                      )}
                      {index === 2 && (
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={legs === index ? "white" : "black"}
                          strokeWidth="1.5"
                        >
                          <path d="M5 2c-1 3-1 18 0 20M19 2c1 3 1 18 0 20" />
                          <rect x="2" y="4" width="20" height="2" rx="1" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${styles.options} text-xs md:text-sm ${
                        legs === index ? "font-medium text-white" : ""
                      }`}
                    >
                      {style}
                    </span>
                    {legs === index && (
                      <motion.div
                        className="absolute bottom-1 w-5 h-1 bg-white rounded-full"
                        layoutId="activeIndicator"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Color Picker for Legs Color */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <p className={`${styles.label} text-md font-medium`}>
                  Legs Color
                </p>
                <button
                  className="text-gray-400 hover:text-black transition-colors"
                  onMouseEnter={() => setActiveTooltip("color")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <FaInfoCircle />
                </button>
              </div>
              {activeTooltip === "color" && (
                <motion.p
                  className="text-xs text-gray-500 mb-2 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Select a color for the table legs
                </motion.p>
              )}
              <div className={`${styles.container} flex flex-col space-y-4`}>
                {/* Large color preview with hex code */}
                <motion.div
                  className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="w-16 h-16 rounded-lg shadow-inner"
                    style={{ backgroundColor: legsColor }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600">
                      Current Color
                    </span>
                    <span className="text-black font-mono px-2 py-1 bg-gray-100 rounded text-xs md:text-sm mt-1">
                      {legsColor.toUpperCase()}
                    </span>
                  </div>
                </motion.div>

                {/* Color picker input */}
                <div className="relative">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Custom Color
                  </label>
                  <input
                    type="color"
                    value={legsColor}
                    onChange={(e) => setLegsColor(e.target.value)}
                    className="w-full h-10 rounded-md cursor-pointer"
                  />
                </div>

                {/* Named color presets */}
                <div className="pt-2">
                  <label className="text-xs text-gray-500 mb-2 block">
                    Presets
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { color: "#000000", name: "Black" },
                      { color: "#964B00", name: "Wood" },
                      { color: "#808080", name: "Gray" },
                      { color: "#C0C0C0", name: "Silver" },
                      { color: "#FFFFFF", name: "White" },
                    ].map((preset) => (
                      <motion.button
                        key={preset.color}
                        onClick={() => setLegsColor(preset.color)}
                        className={`flex flex-col items-center rounded-lg p-2
                          ${legsColor === preset.color ? "bg-gray-100" : ""}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div
                          className="w-8 h-8 rounded-full mb-1 border border-gray-200"
                          style={{ backgroundColor: preset.color }}
                        >
                          {legsColor === preset.color && (
                            <motion.div
                              className="flex items-center justify-center h-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  preset.color === "#FFFFFF"
                                    ? "bg-black"
                                    : "bg-white"
                                }`}
                              />
                            </motion.div>
                          )}
                        </div>
                        <span className="text-xs text-center text-black">
                          {preset.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Slider for Table Width */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <p className={`${styles.label} text-md font-medium`}>
                  Table Width
                </p>
                <button
                  className="text-gray-400 hover:text-black transition-colors"
                  onMouseEnter={() => setActiveTooltip("width")}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <FaInfoCircle />
                </button>
              </div>
              {activeTooltip === "width" && (
                <motion.p
                  className="text-xs text-gray-500 mb-2 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Adjust the width from 70cm to 200cm
                </motion.p>
              )}
              <div className={`${styles.container}`}>
                {/* Visual representation of table width */}
                <motion.div
                  className="h-8 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
                  initial={{ width: "50%" }}
                  animate={{ width: `${((tableWidth - 70) / 130) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                    <div
                      className="h-0.5 bg-black"
                      style={{ width: `${tableWidth / 4}px` }}
                    ></div>
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                  </div>
                </motion.div>

                {/* Measurement scale */}
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>70cm</span>
                  <span className="text-black font-medium">{tableWidth}cm</span>
                  <span>200cm</span>
                </div>

                {/* Enhanced slider */}
                <div className="relative">
                  <div className="absolute top-1/2 w-full flex justify-between px-1 -z-10">
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <div key={tick} className="h-2 w-0.5 bg-gray-300" />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="200"
                    value={tableWidth}
                    onChange={(e) => setTableWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black 
                              hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                {/* Value bubble */}
                <div className="flex justify-center mt-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full"
                  >
                    <span className="font-medium text-sm">{tableWidth}cm</span>
                    <span className="text-xs text-gray-300">
                      {tableWidth < 100
                        ? "Compact"
                        : tableWidth < 150
                        ? "Standard"
                        : "Large"}
                    </span>
                  </motion.div>
                </div>

                {/* Quick presets */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {["Small (80cm)", "Medium (120cm)", "Large (180cm)"].map(
                    (preset, idx) => {
                      const presetValue =
                        idx === 0 ? 80 : idx === 1 ? 120 : 180;
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => setTableWidth(presetValue)}
                          className={`text-xs py-1.5 rounded-md border ${
                            tableWidth === presetValue
                              ? "border-black bg-black text-white"
                              : "border-gray-200 hover:border-gray-400 text-gray-600"
                          }`}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {preset}
                        </motion.button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Configurator;

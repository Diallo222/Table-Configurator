import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { useConfiguratorStore } from "../../store/hooks";
import { styles } from "../../styles";

const Configurator = () => {
  const { legs, setLegs, legsColor, setLegsColor, tableWidth, setTableWidth } =
    useConfiguratorStore();

  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // Function to toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  return (
    <motion.div
      className="absolute top-4 right-4 p-6 rounded-2xl w-72 bg-white"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Heading */}
      <div className="flex flex-row justify-between items-center gap-2">
        <h2 className="text-lg text-center text-black">Configurator</h2>
        <button
          onClick={toggleMenu}
          className="rounded-full bg-black text-white px-2"
        >
          {isMenuOpen ? <FaAngleUp /> : <FaAngleDown />}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.5 }}
        className={`${isMenuOpen ? "block" : "hidden"}`}
      >
        {/* Radio Buttons for Leg Styles */}
        <p className={styles.label}>Legs Style</p>
        <div className={`${styles.container} flex justify-between mb-4`}>
          {["Classic", "Minimal", "Design"].map((style, index) => (
            <label
              key={index}
              className="text-black flex flex-col items-center space-x-2"
            >
              <input
                type="radio"
                name="legs-style"
                value={index}
                checked={legs === index}
                onChange={() => setLegs(index)}
                className="radio-input cursor-pointer focus:ring-0 border-none checked:bg-black checked:border-black"
              />
              <span className={styles.options}>{style}</span>
            </label>
          ))}
        </div>

        {/* Color Picker for Legs Color */}
        <p className={styles.label}>Legs Color</p>
        <div className={`${styles.container} flex items-center space-x-3 mb-4`}>
          <input
            type="color"
            value={legsColor}
            onChange={(e) => setLegsColor(e.target.value)}
            className={`w-10 h-10 bg-transparent border-none cursor-pointer`}
          />
          <span className="text-black text-sm">{legsColor}</span>
        </div>

        {/* Slider for Table Width */}
        <p className={styles.label}>Table Width</p>
        <div
          className={`${styles.container} flex flex-col items-center justify-center`}
        >
          <input
            type="range"
            min="70"
            max="200"
            value={tableWidth}
            onChange={(e) => setTableWidth(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg mb-2"
          />
          <p className="text-black">{tableWidth}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Configurator;

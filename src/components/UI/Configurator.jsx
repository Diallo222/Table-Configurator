import React from 'react';
import { useConfiguratorStore } from '../../store/hooks';
import { motion } from 'framer-motion';

const Configurator = () => {
  const { legs, setLegs, legsColor, setLegsColor, tableWidth, setTableWidth } = useConfiguratorStore();

  return (
    <motion.div
      className="absolute top-4 right-4 bg-zinc-900 p-6 rounded-2xl shadow-xl w-72"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Heading */}
      <h2 className="text-lg text-center text-white mb-4">Configurator</h2>

      {/* Radio Buttons for Leg Styles */}
      <p className="text-gray-400 mb-2">Legs Style:</p>
      <div className="flex justify-between mb-4">
        {['Style 1', 'Style 2', 'Style 3'].map((style, index) => (
          <label key={index} className="text-white flex flex-col items-center space-x-2">
            <input
              type="radio"
              name="legs-style"
              value={index}
              checked={legs === index}
              onChange={() => setLegs(index)}
              className="radio-input cursor-pointer"
            />
            <span className="text-sm">{style}</span>
          </label>
        ))}
      </div>

      {/* Color Picker for Legs Color */}
      <p className="text-gray-400 mb-2">Legs Color:</p>
      <div className="flex items-center space-x-3 mb-4">
        <input
          type="color"
          value={legsColor}
          onChange={(e) => setLegsColor(e.target.value)}
          className="w-12 h-12 bg-transparent p-1 rounded-full cursor-pointer"
        />
        <span className="text-white text-sm">{legsColor}</span>
      </div>

      {/* Slider for Table Width */}
      <p className="text-gray-400 mb-2">Table Width: <span className="text-white">{tableWidth}px</span></p>
      <input
        type="range"
        min="70"
        max="200"
        value={tableWidth}
        onChange={(e) => setTableWidth(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg mb-6"
      />
    </motion.div>
  );
};

export default Configurator;

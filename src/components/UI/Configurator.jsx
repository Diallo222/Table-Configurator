import React from 'react';
import { useConfiguratorStore } from '../../store/hooks';
import { motion } from 'framer-motion';

const Configurator = () => {
  const { legs, setLegs, legsColor, setLegsColor, tableWidth, setTableWidth } = useConfiguratorStore();

  return (
    <motion.div
      className="absolute top-2 right-2 bg-black p-4 rounded-md"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radio Buttons for Leg Styles */}
      <p className="text-white mb-2">Legs Style:</p>
      <div className="flex space-x-4 mb-4">
        <label className="text-white flex items-center space-x-2">
          <input
            type="radio"
            name="legs-style"
            value="0"
            checked={legs === 0}
            onChange={() => setLegs(0)}
            className="radio-input"
          />
          <span>Style 1</span>
        </label>
        <label className="text-white flex items-center space-x-2">
          <input
            type="radio"
            name="legs-style"
            value="1"
            checked={legs === 1}
            onChange={() => setLegs(1)}
            className="radio-input"
          />
          <span>Style 2</span>
        </label>
        <label className="text-white flex items-center space-x-2">
          <input
            type="radio"
            name="legs-style"
            value="2"
            checked={legs === 2}
            onChange={() => setLegs(2)}
            className="radio-input"
          />
          <span>Style 3</span>
        </label>
      </div>

      {/* Color Picker for Legs Color */}
      <p className="text-white mb-2">Legs Color:</p>
      <input
        type="color"
        value={legsColor}
        onChange={(e) => setLegsColor(e.target.value)}
        className="mb-4 w-full h-10 p-1 rounded cursor-pointer"
      />

      {/* Slider for Table Width */}
      <p className="text-white mb-2">Table Width: {tableWidth}</p>
      <input
        type="range"
        min="70"
        max="200"
        value={tableWidth}
        onChange={(e) => setTableWidth(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg mb-4"
      />
    </motion.div>
  );
};

export default Configurator;

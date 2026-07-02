/* eslint-disable no-unused-vars */
// src/components/DarkModeToggle.jsx
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const DarkModeToggle = ({ className = '', showLabel = false }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      onClick={toggleDarkMode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300
        ${isDarkMode 
          ? 'bg-slate-800 text-yellow-300 hover:bg-slate-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        ${className}
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDarkMode ? 360 : 0,
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          rotate: { duration: 0.5 },
          scale: { duration: 0.3 }
        }}
      >
        {isDarkMode ? (
          <Moon size={20} className="text-yellow-400" />
        ) : (
          <Sun size={20} className="text-gray-600" />
        )}
      </motion.div>
      {showLabel && (
        <span className="text-sm font-medium">
          {isDarkMode ? 'Dark mode' : 'Light mode'}
        </span>
      )}
    </motion.button>
  );
};

export default DarkModeToggle;
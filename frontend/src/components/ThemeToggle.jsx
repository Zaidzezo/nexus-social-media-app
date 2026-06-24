import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#1c1c1f] border border-zinc-200 dark:border-zinc-800/80 rounded-xl transition-all duration-200">
      <div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Interface Appearance
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Switch between a clean, bright aesthetic or our signature dark workspace.
        </p>
      </div>

      {/* Modern Pill Switch Mechanism */}
      <button
        type="button"
        onClick={toggleTheme}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-300 dark:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none"
      >
        <span className="sr-only">Toggle App Theme Layout</span>
        <span
          className={`${
            theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center`}
        >
          {theme === 'dark' ? (
            <span className="text-[10px]">🌙</span>
          ) : (
            <span className="text-[10px]">☀️</span>
          )}
        </span>
      </button>
    </div>
  );
};

export default ThemeToggle;
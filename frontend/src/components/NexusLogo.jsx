import React from 'react';

const NexusLogo = ({ className = "h-7" }) => {
  return (
    <div className={`flex items-center gap-3 ${className} select-none`}>
      <svg 
        viewBox="0 0 24 24" 
        className="h-full w-auto aspect-square"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="nexusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" /> {/* Sky Blue */}
            <stop offset="50%" stopColor="#2563eb" /> {/* Royal Blue */}
            <stop offset="100%" stopColor="#1d4ed8" /> {/* Deep Blue */}
          </linearGradient>
        </defs>
        
        <path 
          d="M4.5 17.5V7.5C4.5 5.29 6.29 3.5 8.5 3.5C10.28 3.5 11.79 4.67 12.28 6.38L14.72 14.62C15.21 16.33 16.72 17.5 18.5 17.5C20.71 17.5 22.5 15.71 22.5 13.5V6.5" 
          stroke="url(#nexusGradient)" 
          strokeWidth="3.2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
        <span className="font-extrabold text-xl tracking-wide text-zinc-900 dark:text-white transition-colors duration-200 font-logo">
        Nexus
        </span>
    </div>
  );
};

export default NexusLogo;
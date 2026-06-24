import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

const Settings = () => {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#121214] p-6 transition-colors duration-250">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your interface configuration and preferences for Z-Social.
          </p>
        </div>

        {/* Settings Group Box */}
        <div className="bg-white dark:bg-[#1c1c1f] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm overflow-hidden p-6 space-y-6 transition-all duration-250">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              Interface Customization
            </h3>
            {/* Embedded Theme Switch */}
            <ThemeToggle />
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800/60" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              Account Preferences
            </h3>
            <div className="p-4 bg-zinc-50 dark:bg-[#161618] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-center">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Advanced profile options will appear here.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
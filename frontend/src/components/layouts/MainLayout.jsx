import React from 'react';

const MainLayout = ({ sidebar, stream, chat }) => {
    return (
        <div className="w-full h-full overflow-hidden">
            {/* 12-Column Responsive Board View */}
            <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-12 h-full overflow-hidden">
                
                {/* Left-Sub Component Flow (Optional Section context) */}
                <aside className="hidden md:block md:col-span-1 xl:col-span-3 border-r border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-950 h-full overflow-y-auto">
                    {sidebar}
                </aside>

                {/* Primary Content Stream Target */}
                <main className="col-span-1 md:col-span-3 xl:col-span-5 border-r border-slate-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-950 h-full overflow-y-auto">
                    {stream}
                </main>

                {/* Contextual Conversation/Chat Widget Panel */}
                <section className="hidden xl:block xl:col-span-4 bg-slate-50/50 dark:bg-zinc-900/20 h-full overflow-hidden">
                    {chat}
                </section>
                
            </div>
        </div>
    );
};

export default MainLayout;
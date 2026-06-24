import React from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import NexusLogo from './NexusLogo';

const SidebarNav = ({ currentUser }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
    };

    const navItems = [
        {
            path: "/",
            label: "Home",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            path: "/explore",
            label: "Explore",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
            )
        },
        {
            path: "/messages",
            label: "Messages",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            )
        },
        {
            path: "/account",
            label: "Account",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            path: "/settings",
            label: "Settings",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col justify-between fixed top-0 left-0 h-screen w-64 p-6 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-sans antialiased transition-colors">
                <div className="space-y-8">
                    <div className="px-2">
                        <NexusLogo className="h-9" />
                    </div>

                    {/* Nav Links - Upgraded to clean geometric tracking */}
                    <nav className="space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm tracking-tight transition-all group ${
                                        isActive
                                            ? "bg-slate-100 dark:bg-zinc-900 text-blue-600 dark:text-blue-500"
                                            : "text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-900 dark:hover:text-zinc-100"
                                    }`}
                                >
                                    <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-zinc-500"}`}>
                                        {item.icon}
                                    </div>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom User / Logout Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center font-bold text-white uppercase text-sm flex-shrink-0">
                            {currentUser?.username?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 truncate tracking-tight">
                                {currentUser?.fullName || "Active User"}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 truncate">
                                @{currentUser?.username || "user"}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors"
                        title="Log Out"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAVIGATION */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-900 px-2 py-1 flex justify-around items-center z-40 font-sans antialiased transition-colors">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
                                isActive ? "text-blue-600 dark:text-blue-500" : "text-slate-400 dark:text-zinc-500"
                            }`}
                        >
                            {item.icon}
                            <span className="text-[10px] font-semibold tracking-tight">{item.label.split(" ")[0]}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
};

export default SidebarNav;
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SidebarNav from "../SidebarNav";
import UtilitySidebar from "../UtilitySidebar";
import api from '../../api';

const RootLayout = () => {
    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith("/messages");
    
    // 1. Initialise tracking flags for profile cache state
    const [currentUser, setCurrentUser] = useState(() => {
        const cached = localStorage.getItem("userProfile");
        return cached ? JSON.parse(cached) : null; // Start at null if not cached to avoid mock leaks
    });
    
    // 2. Add an explicit profiling sync loader
    const currentUserId = localStorage.getItem("userId");
    const [profileLoading, setProfileLoading] = useState(!currentUser && !!currentUserId);
    
    // Shared Suggestions States
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Sync Current User Auth Data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/users/me");
                const userData = res.data.user || res.data;
                if (userData && userData._id) {
                    const structuredUser = { ...userData, following: userData.following || [] };
                    setCurrentUser(structuredUser);
                    localStorage.setItem("userProfile", JSON.stringify(structuredUser));
                }
            } catch (err) {
                console.error("Layout context sync failed:", err);
            } finally {
                setProfileLoading(false); // Turn off the splash screen when data arrives
            }
        };
        
        if (currentUserId) {
            fetchUser();
        } else {
            setProfileLoading(false);
        }
    }, [currentUserId]);

    // Shared Suggestions Data Fetch
    useEffect(() => {
        const loadSuggestions = async () => {
            if (!currentUserId) return;
            
            const cachedData = sessionStorage.getItem("followSuggestions");
            if (cachedData) {
                setSuggestions(JSON.parse(cachedData));
                return;
            }

            setSuggestionsLoading(true);
            try {
                const res = await api.get("/users/suggestions");
                setSuggestions(res.data);
                sessionStorage.setItem("followSuggestions", JSON.stringify(res.data));
            } catch (err) {
                console.error("Failed to load follow suggestions:", err);
            } finally {
                setSuggestionsLoading(false);
            }
        };

        loadSuggestions();
    }, [currentUserId]);

    // 3. Render a beautiful loading guard if the application is fetching fresh data
    if (profileLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
                <div className="animate-pulse flex flex-col items-center gap-3 select-none">
                    <svg 
                        viewBox="0 0 24 24" 
                        className="h-12 w-auto aspect-square"
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <linearGradient id="nexusLayoutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="50%" stopColor="#2563eb" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>
                        <path 
                            d="M4.5 17.5V7.5C4.5 5.29 6.29 3.5 8.5 3.5C10.28 3.5 11.79 4.67 12.28 6.38L14.72 14.62C15.21 16.33 16.72 17.5 18.5 17.5C20.71 17.5 22.5 15.71 22.5 13.5V6.5" 
                            stroke="url(#nexusLayoutGradient)" 
                            strokeWidth="3.2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span className="font-logo font-extrabold text-2xl tracking-wide text-zinc-900 dark:text-white transition-colors duration-200">
                        Nexus
                    </span>
                </div>
            </div>
        );
    }

    // 4. Render main layout safely when profile state is synchronized
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-50 transition-colors duration-200">
            <div className={`mx-auto md:pl-64 min-h-screen relative transition-all duration-150 ${
                isMessagesPage ? "max-w-full pr-0 lg:pr-0" : "max-w-7xl lg:pr-80"
            }`}>
                
                <SidebarNav currentUser={currentUser || { username: "user", fullName: "Active User", following: [] }} />

                {/* Pass suggestions down to center page via context */}
                <main className={`w-full min-h-screen ${
                    isMessagesPage 
                        ? "px-0 py-0 md:py-0 pb-0 md:pb-0" 
                        : "px-4 py-4 md:py-6 pb-24 md:pb-6 border-x border-slate-100 dark:border-zinc-900/60"
                }`}>
                    <Outlet context={{ currentUser, setCurrentUser, suggestions, setSuggestions, suggestionsLoading }} />
                </main>

                {/* Pass suggestions down to right sidebar via standard props */}
                {!isMessagesPage && (
                    <UtilitySidebar 
                        currentUser={currentUser || { username: "user", fullName: "Active User", following: [] }} 
                        setCurrentUser={setCurrentUser} 
                        suggestions={suggestions}
                        setSuggestions={setSuggestions}
                        loading={suggestionsLoading}
                    />
                )}
                
            </div>
        </div>
    );
};

export default RootLayout;
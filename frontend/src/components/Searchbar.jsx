import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { Link } from 'react-router-dom';
import api from '../api';

const Searchbar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef(null);

    const debouncedSearch = useDebounce(searchTerm, 300);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!debouncedSearch.trim()) {
                setResults([]); 
                return;
            }

            setLoading(true);
            try {
                const { data } = await api.get(`/users/search?q=${debouncedSearch}`);
                
                if (Array.isArray(data)) {
                    setResults(data);
                } else if (data && Array.isArray(data.users)) {
                    setResults(data.users);
                } else {
                    setResults([]);
                }
            } catch (err) {
                console.error("Search error:", err);
                setResults([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [debouncedSearch]);

    return (
        <div ref={searchRef} className="relative w-full max-w-md mx-auto">
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Input Element */}
            <input
                type="text"
                placeholder="Search platform..."
                className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-transparent bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:bg-white dark:focus:bg-zinc-950 focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />

            {/* Loading Spinner */}
            {loading && (
                <div className="absolute right-3.5 top-3">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}

            {/* Dropdown Menu Result Panel */}
            {isFocused && Array.isArray(results) && results.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white dark:bg-zinc-900 shadow-xl rounded-xl mt-2 z-50 border border-slate-200 dark:border-zinc-800/80 max-h-80 overflow-y-auto overflow-x-hidden">
                    {results.map((user) => (
                        <Link 
                            key={user._id} 
                            to={`/profile/${user._id}`}
                            onClick={() => {
                                setResults([]); 
                                setSearchTerm(""); 
                                setIsFocused(false);
                            }}
                            className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-slate-100 dark:border-zinc-800/40 last:border-b-0 group"
                        >
                            {/* Avatar Sub-logic */}
                            {user.profilePic ? (
                                <img 
                                    src={user.profilePic} 
                                    alt={user.username} 
                                    className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-zinc-800"
                                />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs uppercase flex-shrink-0 tracking-tight">
                                    {user.username ? user.username.charAt(0) : "U"}
                                </div>
                            )}

                            <div className="ml-3 truncate">
                                <p className="font-bold text-xs text-slate-900 dark:text-zinc-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                    {user.fullName || "User"}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                                    @{user.username}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Searchbar;
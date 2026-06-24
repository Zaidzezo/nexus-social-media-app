import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const UtilitySidebar = ({ currentUser, setCurrentUser }) => {
    const [popularUsers, setPopularUsers] = useState([]);
    const [sidebarLoading, setSidebarLoading] = useState(true);

    const currentUserId = localStorage.getItem("userId");

    // Fetch the top 5 accounts with the most followers independently
    useEffect(() => {
        const fetchPopularAccounts = async () => {
            try {
                const res = await api.get('/users/popular?limit=5');
                setPopularUsers(res.data.users || res.data || []);
            } catch (err) {
                console.error("Failed to fetch popular ecosystem directory:", err);
            } finally {
                setSidebarLoading(false);
            }
        };

        fetchPopularAccounts();
    }, []);

    const handleFollowToggle = async (userId) => {
        try {
            await api.put(`/users/toggleFollow/${userId}`);
            
            // Toggle the user ID inside the global currentUser following array
            setCurrentUser(prev => {
                if (!prev) return prev;
                const isFollowing = prev.following?.includes(userId);
                const updatedUser = {
                    ...prev,
                    following: isFollowing
                        ? prev.following.filter(id => id !== userId)
                        : [...(prev.following || []), userId]
                };
                localStorage.setItem("userProfile", JSON.stringify(updatedUser));
                return updatedUser;
            });
        } catch (err) {
            console.error("Failed to toggle follow status:", err);
        }
    };

    if (!sidebarLoading && popularUsers.length === 0) return null;

    return (
        <aside className="hidden lg:block fixed top-0 right-0 h-screen w-80 p-6 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors overflow-y-auto">
            <div className="space-y-6">
                <div className="rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 p-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-wide mb-4">
                        Most Popular
                    </h3>

                    {sidebarLoading ? (
                        <div className="space-y-4 py-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
                                        <div className="space-y-2">
                                            <div className="w-24 h-3 rounded bg-slate-200 dark:bg-zinc-800" />
                                            <div className="w-16 h-2 rounded bg-slate-200 dark:bg-zinc-800" />
                                        </div>
                                    </div>
                                    <div className="w-16 h-7 rounded-full bg-slate-200 dark:bg-zinc-800" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {popularUsers.map((user) => {
                                const isFollowing = currentUser?.following?.includes(user._id);
                                
                                // Directs user smoothly to either their dedicated '/profile' or '/profile/:id' path route
                                const targetPath = `/profile/${user._id}`;

                                return (
                                    <div key={user._id} className="flex items-center justify-between gap-2">
                                        <Link to={targetPath} className="flex items-center gap-3 min-w-0 group cursor-pointer">
                                            {user.profilePic ? (
                                                <img 
                                                    src={user.profilePic} 
                                                    alt={user.fullName} 
                                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-100 dark:border-zinc-800"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-xs flex-shrink-0">
                                                    {user.username?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {user.fullName || user.name}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 truncate">
                                                    @{user.username}
                                                </span>
                                            </div>
                                        </Link>
                                        
                                        {/* Show the follow action toggle button only for other user indices */}
                                        {user._id !== currentUserId ? (
                                            <button
                                                type="button"
                                                onClick={() => handleFollowToggle(user._id)}
                                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-150 shrink-0 ${
                                                    isFollowing
                                                        ? "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                                }`}
                                            >
                                                {isFollowing ? "Following" : "Follow"}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-600 uppercase pr-2 shrink-0 select-none">
                                                You
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default UtilitySidebar;
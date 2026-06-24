import { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from '../api';
import Post from "../components/Post";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const CACHE_DURATION = 60000;

const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const SIZE = 1080;
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext("2d");

                let sourceX, sourceY, sourceSize;
                if (img.width > img.height) {
                    sourceSize = img.height;
                    sourceX = (img.width - img.height) / 2;
                    sourceY = 0;
                } else {
                    sourceSize = img.width;
                    sourceX = 0;
                    sourceY = (img.height - img.width) / 2;
                }

                ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, SIZE, SIZE);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

const Feed = ({ mode }) => {
    const { currentUser, setCurrentUser, suggestions, setSuggestions, suggestionsLoading } = useOutletContext();

    useEffect(() => {
        api.get('/posts?limit=1').catch(() => {}); 
    }, []); 

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [newPost, setNewPost] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState("");
    const [isCompressing, setIsCompressing] = useState(false);

    const targetFeedType = mode === "explore" ? "fyp" : "following";

    const cache = useRef({
        fyp: { data: [], lastFetched: 0, nextCursor: null, hasMore: true },
        following: { data: [], lastFetched: 0, nextCursor: null, hasMore: true }
    });

    const fileInputRef = useRef(null);
    const observerTargetRef = useRef(null);
    const currentUserId = localStorage.getItem('userId');
    const feedTypeRef = useRef(targetFeedType);
    const abortControllerRef = useRef(null);
    const isFetchingRef = useRef(false);

    const currentFollowingCount = currentUser?.following?.length || 0;
    const requirementsMet = currentFollowingCount >= 5;

    const syncPostUpdate = useCallback((postId, updateFn) => {
        setPosts(prev => prev.map(p => p._id === postId ? updateFn(p) : p));
        Object.keys(cache.current).forEach(type => {
            cache.current[type].data = cache.current[type].data.map(p =>
                p._id === postId ? updateFn(p) : p
            );
        });
    }, []);

    const fetchPosts = useCallback(async (type, options = {}) => {
        const { isInitialLoad = false, forceRefresh = false } = options;
        const now = Date.now();

        if (!cache.current[type]) {
            cache.current[type] = { data: [], nextCursor: null, hasMore: true, lastFetched: 0 };
        }

        const currentCache = cache.current[type];

        if (!forceRefresh && (isFetchingRef.current || !currentCache.hasMore)) return;

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        isFetchingRef.current = true;

        if (isInitialLoad) {
            if (!forceRefresh && currentCache.data.length > 0 && (now - currentCache.lastFetched) < CACHE_DURATION) {
                setPosts(currentCache.data);
                setLoading(false);
                isFetchingRef.current = false;
                return;
            }
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const baseEndpoint = type === "fyp" ? "/posts" : "/posts/following";
            const activeCursor = forceRefresh ? null : currentCache.nextCursor;
            const url = activeCursor
                ? `${baseEndpoint}?limit=10&cursor=${activeCursor}`
                : `${baseEndpoint}?limit=10`;

            const res = await api.get(url, { signal }); 

            if (type !== feedTypeRef.current) {
                isFetchingRef.current = false;
                setLoading(false);
                setLoadingMore(false);
                return;
            }

            const incomingPosts = res.data.posts || [];
            const { nextCursor, hasNextPage } = res.data.meta || { nextCursor: null, hasNextPage: false };
            const freshCacheData = cache.current[type].data || [];

            let updatedPostsList;
            if (forceRefresh || activeCursor === null) {
                updatedPostsList = incomingPosts;
            } else {
                const existingIds = new Set(freshCacheData.map(p => p._id));
                const filteredIncoming = incomingPosts.filter(p => !existingIds.has(p._id));
                updatedPostsList = [...freshCacheData, ...filteredIncoming];
            }

            cache.current[type] = {
                data: updatedPostsList,
                lastFetched: now,
                nextCursor,
                hasMore: hasNextPage
            };

            setPosts(updatedPostsList);

        } catch (err) {
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
            console.error("Pagination error:", err);
            if (!cache.current[type].data || cache.current[type].data.length === 0) setPosts([]);
        } finally {
            if (!signal.aborted) {
                setLoading(false);
                setLoadingMore(false);
                isFetchingRef.current = false;
            }
        }
    }, []);

    // Switches feed context smoothly and triggers dynamic fetching
    useEffect(() => {
        feedTypeRef.current = targetFeedType;
        if (abortControllerRef.current) abortControllerRef.current.abort();
        isFetchingRef.current = false;

        if (targetFeedType === "following" && !requirementsMet) {
            setPosts([]);
            setLoading(false);
            setLoadingMore(false);
            return;
        }

        const currentCache = cache.current[targetFeedType];
        if (currentCache.data.length > 0) {
            setPosts(currentCache.data);
            setLoading(false);
            setLoadingMore(false);
        } else {
            setPosts([]);
            setLoading(true);
            setLoadingMore(false);
            fetchPosts(targetFeedType, { isInitialLoad: true });
        }
    }, [targetFeedType, fetchPosts, requirementsMet]);

    useEffect(() => {
        const targetElement = observerTargetRef.current;
        if (!targetElement || (targetFeedType === "following" && !requirementsMet)) return;

        const observer = new IntersectionObserver((entries) => {
            const bottomElement = entries[0];
            const activeType = feedTypeRef.current;
            const canLoadMore = cache.current[activeType]?.hasMore;

            if (bottomElement.isIntersecting && canLoadMore && !isFetchingRef.current) {
                fetchPosts(activeType, { isInitialLoad: false });
            }
        }, { root: null, rootMargin: "200px", threshold: 0.1 });

        observer.observe(targetElement);
        return () => { if (targetElement) observer.unobserve(targetElement); };
    }, [fetchPosts, targetFeedType, requirementsMet]); 

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageError("");
        if (!file.type.startsWith("image/")) {
            setImageError("Only images are supported.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("Image must be under 4MB.");
            return;
        }
        setIsCompressing(true);
        try {
            const compressed = await compressImage(file);
            setImagePreview(compressed);
        } catch {
            setImageError("Processing failed.");
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePost = async (e) => {
        e.preventDefault();
        const content = newPost.trim() || " ";
        if (content === " " && !imagePreview) return;

        setNewPost("");
        setImagePreview(null);

        try {
            const res = await api.post("/posts", { content, image: imagePreview });
            const savedPost = res.data.post || res.data;

            if (feedTypeRef.current === "fyp") {
                setPosts(prev => {
                    const updated = [savedPost, ...prev];
                    cache.current.fyp.data = updated;
                    return updated;
                });
            }
        } catch (err) { alert("Post failed."); }
    };

    const handleDelete = async (id) => {
        const activeType = feedTypeRef.current;
        
        // Optimistically remove from state safely
        setPosts(prev => prev.filter(p => p._id !== id));
        
        Object.keys(cache.current).forEach(type => {
            cache.current[type].data = cache.current[type].data.filter(p => p._id !== id);
        });

        try { 
            await api.delete(`/posts/${id}`); 
        } catch (err) { 
            fetchPosts(activeType, { forceRefresh: true }); 
        }
    };

    const handleLike = async (postId) => {
        syncPostUpdate(postId, (p) => {
            const isLiked = p.likes.includes(currentUserId);
            return {
                ...p,
                likes: isLiked ? p.likes.filter(uid => uid !== currentUserId) : [...p.likes, currentUserId]
            };
        });
        try { await api.put(`/posts/${postId}/like`); } 
        catch (err) {
            syncPostUpdate(postId, (p) => {
                const wasLikedBeforeError = p.likes.includes(currentUserId);
                return {
                    ...p,
                    likes: wasLikedBeforeError ? p.likes.filter(uid => uid !== currentUserId) : [...p.likes, currentUserId]
                };
            });
        }
    };

    const handleUpdate = async (postId, updatedData) => {
        syncPostUpdate(postId, (p) => ({ ...p, ...updatedData }));
        try { await api.put(`/posts/${postId}`, updatedData); } 
        catch (err) { fetchPosts(feedTypeRef.current, { forceRefresh: true }); }
    };

    if (loading && posts.length === 0 && (targetFeedType === "fyp" || requirementsMet)) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (targetFeedType === "following" && !requirementsMet) {
        
        const handleOnboardingFollow = async (userId) => {
            try {
                await api.put(`/users/toggleFollow/${userId}`);
                
                setCurrentUser(prev => {
                    if (!prev) return prev;
                    const currentFollowing = prev.following || [];
                    if (currentFollowing.includes(userId)) return prev;
                    
                    const updatedUser = { ...prev, following: [...currentFollowing, userId] };
                    localStorage.setItem("userProfile", JSON.stringify(updatedUser));
                    return updatedUser;
                });

                setSuggestions(prev => {
                    const updated = prev.filter(user => user._id !== userId);
                    sessionStorage.setItem("followSuggestions", JSON.stringify(updated));
                    return updated;
                });
            } catch (err) {
                console.error("Failed to process onboarding follow update request:", err);
            }
        };

        return (
            <div className="max-w-xl mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-900/60 border border-blue-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 mx-auto">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Build your inner network</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        You are currently following <strong className="text-blue-500">{currentFollowingCount}/5</strong> people. Follow at least 5 profiles to construct a tailored chronological home timeline feed.
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-900 p-5 max-w-md mx-auto shadow-sm text-left">
                    <span className="text-xs font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase block mb-4">Quick Suggestions</span>
                    
                    {suggestionsLoading ? (
                        <div className="space-y-4 py-2 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
                                        <div className="space-y-2">
                                            <div className="w-20 h-3 rounded bg-slate-200 dark:bg-zinc-800" />
                                            <div className="w-12 h-2 rounded bg-slate-200 dark:bg-zinc-800" />
                                        </div>
                                    </div>
                                    <div className="w-14 h-7 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                                </div>
                            ))}
                        </div>
                    ) : suggestions.length === 0 ? (
                        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 py-2">No more suggestions available.</p>
                    ) : (
                        <div className="space-y-4">
                            {suggestions.map((usr) => {
                                const isAdded = (currentUser?.following || []).includes(usr._id);
                                return (
                                    <div key={usr._id} className="flex items-center justify-between gap-3">
                                        <Link to={`/${usr._id}`} className="flex items-center gap-3 min-w-0 group">
                                            {usr.profilePic ? (
                                                <img 
                                                    src={usr.profilePic} 
                                                    alt={usr.fullName} 
                                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-100 dark:border-zinc-800"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-xs flex-shrink-0">
                                                    {usr.username?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                                                    {usr.fullName}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 truncate">
                                                    @{usr.username}
                                                </span>
                                            </div>
                                        </Link>
                                        
                                        <button 
                                            onClick={() => handleOnboardingFollow(usr._id)}
                                            disabled={isAdded}
                                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                isAdded 
                                                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-default"
                                                    : "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90"
                                            }`}
                                        >
                                            {isAdded ? "Added" : "Follow"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tight px-1">
    {targetFeedType === "fyp" ? "Explore" : "Home Feed"}
</h1>

            {targetFeedType === "fyp" && (
                <form onSubmit={handlePost} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-900 p-4 transition-colors">
                    <div className="flex gap-3">
                        <div className="flex-shrink-0">
                            {currentUser && (
                                currentUser.profilePic ? (
                                    <img 
                                        src={currentUser.profilePic} 
                                        alt={currentUser.fullName || "Me"} 
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-zinc-800"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-sm flex-shrink-0 select-none">
                                        {currentUser.username?.charAt(0)}
                                    </div>
                                )
                            )}
                        </div>
                        <div className="flex-grow">
                            <textarea
                                className="w-full text-base outline-none resize-none bg-transparent placeholder-slate-400 dark:placeholder-zinc-500 text-slate-800 dark:text-zinc-200 pt-1"
                                rows="3"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder={`What's up, ${currentUser?.username || 'user'}?`}
                            />
                        </div>
                    </div>

                    {imagePreview && (
                        <div className="relative mt-3 ml-13 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                            <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
                            <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 ml-13 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} id="post-image-input" />
                        <label htmlFor="post-image-input" className="text-slate-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </label>
                        <button
                            type="submit"
                            disabled={(!newPost.trim() && !imagePreview) || isCompressing}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
                        >
                            Post
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {posts.map((post) => (
                    <Post
                        key={post._id}
                        post={post}
                        onLike={handleLike}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        currentUserId={currentUserId}
                    />
                ))}

                <div ref={observerTargetRef} className="py-6 flex justify-center min-h-[40px]">
                    {loadingMore && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                    {!loadingMore && cache.current[targetFeedType]?.hasMore === false && posts.length > 0 && (
                        <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold tracking-wider uppercase">✨ Completely caught up</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feed;
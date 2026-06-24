import React, { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../api';
import ProfileAvatar from "../components/ProfileAvatar";
import Post from "../components/Post";
import EditProfileModal from "../components/EditProfileModal";
import { invalidateCachedProfile } from "../utils/profileCache";

const AccountPage = () => {
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);

    const currentUserId = localStorage.getItem("userId");

    // ── DATA FETCHING ──
    const fetchAccountData = useCallback(async () => {
        try {
            setError('');
            // 1. Fetch authenticated user profile identity payload
            const meResponse = await api.get('/users/me'); 
            const responseData = meResponse.data;
            
            const userId = responseData?._id || 
                           responseData?.id || 
                           responseData?.user?._id || 
                           responseData?.user?.id ||
                           responseData?.data?._id ||
                           responseData?.data?.id;

            if (!userId) {
                throw new Error("Could not extract a valid user ID from the /me endpoint response.");
            }

            // 2. Fetch unified profile records and corresponding posts
            const profileResponse = await api.get(`/users/${userId}`);
            setProfile(profileResponse.data.user);
            setPosts(profileResponse.data.posts || []);
        } catch (err) {
            console.error("Error loading account profile:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    // ── POST INTERACTION HANDLERS ──
    const handleLike = async (postId) => {
        setPosts(prevPosts => 
            prevPosts.map(p => {
                if (p._id !== postId) return p;
                const isLiked = p.likes?.includes(currentUserId);
                return {
                    ...p,
                    likes: isLiked
                        ? p.likes.filter(uid => uid !== currentUserId)
                        : [...(p.likes || []), currentUserId]
                };
            })
        );
        try {
            await api.put(`/posts/${postId}/like`);
        } catch {
            fetchAccountData();
        }
    };

    const handleDelete = async (postId) => {
        setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
        try {
            await api.delete(`/posts/${postId}`);
            if (currentUserId) invalidateCachedProfile(currentUserId);
        } catch {
            fetchAccountData();
        }
    };

    const handleUpdatePost = async (postId, updatedData) => {
        setPosts(prevPosts => 
            prevPosts.map(p => p._id === postId ? { ...p, ...updatedData } : p)
        );
        try {
            await api.put(`/posts/${postId}`, updatedData);
            if (currentUserId) invalidateCachedProfile(currentUserId);
        } catch {
            fetchAccountData();
        }
    };

    // ── ACCOUNT PROFILE UPDATE HANDLER ──
    const handleSaveProfile = async (updatedData) => {
        const lines = updatedData.bio.split('\n');
        if (lines.length > 6 || updatedData.bio.length > 200) {
            alert("Bio limit: 6 lines / 200 characters.");
            return;
        }
        try {
            const res = await api.put("/users/update", updatedData);
            const updatedUser = res.data.user || res.data;
            
            setProfile(updatedUser);
            if (currentUserId) invalidateCachedProfile(currentUserId);
            
            // Sync updated details with client cache
            localStorage.setItem("userProfile", JSON.stringify(updatedUser));
            localStorage.setItem("userFullName", updatedUser.fullName);
            
            setEditModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile.");
        }
    };

    // ── RENDER STATES ──
    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-zinc-500 font-medium text-sm uppercase tracking-wider">Retrieving your profile data...</p>
        </div>
    );

    if (error) return (
        <div className="p-6 max-w-2xl mx-auto mt-10 bg-red-955/20 border border-red-900/50 text-red-400 rounded-xl">
            <p className="font-semibold">Error loading account</p>
            <p className="text-sm mt-1 text-red-400/80">{error}</p>
        </div>
    );

    const followerCount = Array.isArray(profile?.followers) ? profile.followers.length : 0;
    const followingCount = profile?.followingCount ?? 0;

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-12">
            
            {/* ── PROFILE CARD WITH EXTENSION THEME MECHANICS ── */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm transition-colors">
                <div className="flex flex-col items-center text-center border-b border-slate-100 dark:border-zinc-800/60 pb-6">
                    <ProfileAvatar user={profile} size="w-20 h-20" textSize="text-3xl" />
                    
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-none">
                        {profile?.fullName}
                    </h1>
                    <p className="text-blue-500 dark:text-blue-400 font-bold text-sm mt-1.5">@{profile?.username}</p>

                    <div className="flex gap-6 mt-4 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                        <div className="group cursor-default">
                            <span className="font-black text-slate-950 dark:text-zinc-100 mr-1">
                                {followerCount}
                            </span> Followers
                        </div>
                        <div className="group cursor-default">
                            <span className="font-black text-slate-950 dark:text-zinc-100 mr-1">
                                {followingCount}
                            </span> Following
                        </div>
                    </div>
                </div>

                <div className="mt-5 text-left pl-1">
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-medium">
                        {profile?.bio || "This user hasn't added a bio yet."}
                    </p>
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="text-xs text-blue-500 dark:text-blue-400 font-bold underline mt-3 hover:text-blue-600 dark:hover:text-blue-300 transition block"
                    >
                        Edit Profile Details
                    </button>
                </div>
            </div>

            {/* ── TIMELINE POSTS FEED LIST ── */}
            <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight pl-1">
                My Posts
            </h2>

            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <Post
                            key={post._id}
                            post={post}
                            currentUserId={currentUserId}
                            onLike={handleLike}
                            onDelete={handleDelete}
                            onUpdate={handleUpdatePost}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">You haven't shared any updates yet.</p>
                    </div>
                )}
            </div>

            {/* ── INTERACTIVE EDIT MODAL CONTAINER ── */}
            {profile && (
                <EditProfileModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    userData={profile}
                    onSave={handleSaveProfile}
                />
            )}
        </div>
    );
};

export default AccountPage;
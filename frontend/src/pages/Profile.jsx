import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import FollowModal from "../components/FollowModal";
import EditProfileModal from "../components/EditProfileModal";
import ProfileAvatar from "../components/ProfileAvatar";
import Post from "../components/Post";
import { getCachedProfile, setCachedProfile, invalidateCachedProfile } from "../utils/profileCache";

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalUsers, setModalUsers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [messagingLoading, setMessagingLoading] = useState(false);

    const currentUserId = localStorage.getItem("userId");
    const isOwner = currentUserId === id;

    const applyProfileData = useCallback((data, posts) => {
        setProfileData({ user: data, posts: Array.isArray(posts) ? posts : [] });
        setIsFollowing(
            Array.isArray(data.followers) &&
            data.followers.some(f => (f._id || f)?.toString() === currentUserId)
        );
        if (currentUserId === id) {
            localStorage.setItem("userProfile", JSON.stringify(data));
            localStorage.setItem("userFullName", data.fullName);
        }
    }, [id, currentUserId]);

    const fetchProfile = useCallback(async ({ silent = false } = {}) => {
        try {
            const res = await api.get(`/users/${id}`);
            const data = res.data.user || res.data;
            const posts = res.data.posts || [];
            if (!data || !data._id) { navigate('/404'); return; }
            setCachedProfile(id, { user: data, posts });
            applyProfileData(data, posts);
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (!silent) navigate('/feed');
        }
    }, [id, navigate, applyProfileData]);

    useEffect(() => {
        if (!id) return;
        const cached = getCachedProfile(id);
        if (cached) {
            applyProfileData(cached.user, cached.posts);
            setLoading(false);
            const isStale = !cached.fetchedAt || (Date.now() - cached.fetchedAt) > 60_000;
            if (isStale) fetchProfile({ silent: true });
        } else {
            setProfileData(null);
            setLoading(true);
            fetchProfile().finally(() => setLoading(false));
        }
    }, [id, fetchProfile, applyProfileData]);

    // ── POST HANDLERS ──
    const handleLike = async (postId) => {
        setProfileData(prev => ({
            ...prev,
            posts: prev.posts.map(p => {
                if (p._id !== postId) return p;
                const isLiked = p.likes?.includes(currentUserId);
                return {
                    ...p,
                    likes: isLiked
                        ? p.likes.filter(uid => uid !== currentUserId)
                        : [...(p.likes || []), currentUserId]
                };
            })
        }));
        try {
            await api.put(`/posts/${postId}/like`);
        } catch {
            fetchProfile({ silent: true });
        }
    };

    const handleDelete = async (postId) => {
        setProfileData(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p._id !== postId)
        }));
        try {
            await api.delete(`/posts/${postId}`);
            invalidateCachedProfile(id);
        } catch {
            fetchProfile({ silent: true });
        }
    };

    const handleUpdate = async (postId, updatedData) => {
        setProfileData(prev => ({
            ...prev,
            posts: prev.posts.map(p => p._id === postId ? { ...p, ...updatedData } : p)
        }));
        try {
            await api.put(`/posts/${postId}`, updatedData);
            invalidateCachedProfile(id);
        } catch {
            fetchProfile({ silent: true });
        }
    };

    const handleUpdate2 = async (updatedData) => {
        const lines = updatedData.bio.split('\n');
        if (lines.length > 6 || updatedData.bio.length > 200) {
            alert("Bio limit: 6 lines / 200 characters.");
            return;
        }
        try {
            const res = await api.put("/users/update", updatedData);
            const updatedUser = res.data.user || res.data;
            setProfileData(prev => ({ ...prev, user: updatedUser }));
            invalidateCachedProfile(id);
            if (isOwner) {
                localStorage.setItem("userProfile", JSON.stringify(updatedUser));
                localStorage.setItem("userFullName", updatedUser.fullName);
            }
            setEditModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update profile.");
        }
    };

    const handleFollow = async () => {
        const targetFollowState = !isFollowing;
        setIsFollowing(targetFollowState);
        setProfileData(prev => ({
            ...prev,
            user: {
                ...prev.user,
                followers: targetFollowState
                    ? [...(prev.user.followers || []), currentUserId]
                    : (prev.user.followers || []).filter(
                        f => (f._id || f)?.toString() !== currentUserId
                      )
            }
        }));
        try {
            await api.put(`/users/toggleFollow/${id}`);
            invalidateCachedProfile(id);
        } catch {
            setIsFollowing(!targetFollowState);
            fetchProfile({ silent: true });
        }
    };

    const handleSendMessage = async () => {
    setMessagingLoading(true);
    try {
        // Correctly calls the matching endpoint to locate or instantiate a workspace session
        const res = await api.post('/messages/conversations', { targetUserId: id });
        
        // Extract the ID from the returned model instance and route to messages dashboard
        const targetConversationId = res.data._id || res.data.conversationId;
        navigate(`/messages/${targetConversationId}`);
    } catch (err) {
        console.error("Failed to map or initialize conversation connection:", err);
    } finally {
        setMessagingLoading(false);
    }
};

    const openModal = async (title, type) => {
        setModalTitle(title);
        setModalUsers([]);
        setModalOpen(true);
        setModalLoading(true);
        try {
            const res = await api.get(`/users/${id}/${type}`);
            setModalUsers(res.data);
        } catch (err) {
            console.error(`Failed to load ${type}:`, err);
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-zinc-500 font-medium text-sm uppercase tracking-wider">Loading profile...</p>
        </div>
    );

    if (!profileData || !profileData.user) return (
        <div className="text-center mt-20 text-slate-500 dark:text-zinc-400">
            <h2 className="text-2xl font-bold">User Not Found</h2>
            <Link to="/" className="text-blue-500 underline mt-2 block font-semibold">Go to Feed</Link>
        </div>
    );

    const followerCount  = Array.isArray(profileData.user.followers) ? profileData.user.followers.length : 0;
    const followingCount = profileData.user.followingCount ?? 0;

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-12">
            {/* ── PROFILE CARD WITH DARK THEME UTILITIES ── */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/80 shadow-sm transition-colors">
                <div className="flex flex-col items-center text-center border-b border-slate-100 dark:border-zinc-800/60 pb-6">
                    <ProfileAvatar user={profileData.user} size="w-20 h-20" textSize="text-3xl" />
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-none">
                        {profileData.user.fullName}
                    </h1>
                    <p className="text-blue-500 dark:text-blue-400 font-bold text-sm mt-1.5">@{profileData.user.username}</p>

                    <div className="flex gap-6 mt-4 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                        <button
                            onClick={() => openModal("Followers", "followers")}
                            className="hover:underline hover:text-blue-500 dark:hover:text-blue-400 transition group"
                        >
                            <span className="font-black text-slate-950 dark:text-zinc-100 group-hover:text-blue-500 mr-1">
                                {followerCount}
                            </span> Followers
                        </button>
                        <button
                            onClick={() => openModal("Following", "following")}
                            className="hover:underline hover:text-blue-500 dark:hover:text-blue-400 transition group"
                        >
                            <span className="font-black text-slate-950 dark:text-zinc-100 group-hover:text-blue-500 mr-1">
                                {followingCount}
                            </span> Following
                        </button>
                    </div>

                    {!isOwner && (
                        <div className="flex items-center gap-3 mt-5">
                            <button
                                onClick={handleFollow}
                                className={`px-6 py-2 rounded-full text-xs font-bold transition shadow-sm ${
                                    isFollowing
                                        ? 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={messagingLoading}
                                className="px-5 py-2 rounded-full text-xs font-bold border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                            >
                                {messagingLoading ? 'Opening...' : 'Message'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-5 text-left pl-1">
                    <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-medium">
                        {profileData.user.bio || "This user hasn't added a bio yet."}
                    </p>
                    {isOwner && (
                        <button
                            onClick={() => setEditModalOpen(true)}
                            className="text-xs text-blue-500 dark:text-blue-400 font-bold underline mt-3 hover:text-blue-600 dark:hover:text-blue-300 transition block"
                        >
                            Edit Profile Details
                        </button>
                    )}
                </div>
            </div>

            {/* ── TIMELINE POSTS LIST ── */}
            <h2 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-tight pl-1">
                Posts
            </h2>

            <div className="space-y-4">
                {profileData.posts.length > 0 ? (
                    profileData.posts.map(post => (
                        <Post
                            key={post._id}
                            post={post}
                            currentUserId={currentUserId}
                            onLike={handleLike}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/80 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">No posts yet.</p>
                    </div>
                )}
            </div>

            <FollowModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                users={modalUsers}
                loading={modalLoading}
            />
            {profileData.user && (
                <EditProfileModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    userData={profileData.user}
                    onSave={handleUpdate2}
                />
            )}
        </div>
    );
};

export default Profile;
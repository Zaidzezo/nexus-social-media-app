import { useState, useEffect } from "react";
import api from "../api"; 
import { Link } from "react-router-dom";

const Post = ({ post, onLike, onDelete, onUpdate, currentUserId }) => {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostContent, setEditPostContent] = useState(post.content);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");

    const postAuthor = post.author || post.user || post.userId || {};
    const username = postAuthor.username || post.username || "user";
    const fullName = postAuthor.fullName || post.fullName || username;
    const postProfilePic = postAuthor.profilePic || post.profilePic;
    const authorId = postAuthor._id || post.author || post.userId;

    useEffect(() => {
        if (!showComments) return;

        const fetchComments = async () => {
            setLoadingComments(true);
            try {
                const res = await api.get(`/comments/${post._id}`);
                setComments(res.data.comments || []);
            } catch (err) {
                console.error("Failed to load comments:", err.message);
            } finally {
                setLoadingComments(false);
            }
        };

        fetchComments();
    }, [showComments, post._id]);

    // Handle Saving an Edited Post
    const handleSavePost = async () => {
        if (!editPostContent.trim()) return;
        try {
            await onUpdate(post._id, { content: editPostContent.trim() });
            setIsEditingPost(false);
        } catch (err) {
            console.error("Post edit payload error:", err);
        }
    };

    // Handle Adding a Comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await api.post("/comments", { 
                postId: post._id, 
                content: commentText.trim() 
            });
            
            const newComment = res.data.comment;
            setComments(prev => [newComment, ...prev]); 
            setCommentText("");

            if (onUpdate) {
                onUpdate(post._id, { 
                    ...post, 
                    commentCount: (post.commentCount || 0) + 1 
                });
            }
        } catch (err) {
            console.error("Comment post error:", err.message);
            alert("Could not post comment.");
        }
    };

    // Handle Deleting a Comment
    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => c._id !== commentId));

            if (onUpdate) {
                onUpdate(post._id, { 
                    ...post, 
                    commentCount: Math.max(0, (post.commentCount || 0) - 1) 
                });
            }
        } catch (err) {
            console.error("Comment delete error:", err.message);
            alert("Could not delete comment.");
        }
    };

    // Handle Editing/Updating a Comment
    const handleUpdateComment = async (commentId) => {
        if (!editingText.trim()) return;

        try {
            const res = await api.put(`/comments/${commentId}`, { content: editingText.trim() });
            const updatedComment = res.data.comment;

            setComments(prev => prev.map(c => c._id === commentId ? { ...c, ...updatedComment } : c));
            setEditingCommentId(null);
            setEditingText("");
        } catch (err) {
            console.error("Comment update error:", err.message);
            alert("Could not edit comment.");
        }
    };

    const isPostOwner = authorId === currentUserId;
    const isLiked = post.likes?.includes(currentUserId);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-900 p-4 transition-colors">
            {/* Post Header Layout */}
            <div className="flex items-center justify-between mb-3">
                <Link to={`/profile/${authorId}`} className="flex items-center gap-2.5 hover:opacity-85 transition group">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-xs overflow-hidden flex-shrink-0">
                        {postProfilePic ? (
                            <img src={postProfilePic} alt={username} className="w-full h-full object-cover" />
                        ) : (
                            username.charAt(0)
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {fullName}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                            @{username}
                        </p>
                    </div>
                </Link>

                {/* ── POST MANAGEMENT BUTTON GROUP ── */}
                {isPostOwner && (
                    <div className="flex items-center gap-1.5">
                        {/* Edit Button Option Icon */}
                        <button 
                            onClick={() => {
                                setIsEditingPost(!isEditingPost);
                                setEditPostContent(post.content);
                            }}
                            className={`p-1.5 rounded-lg transition ${isEditingPost ? 'text-blue-500 bg-slate-50 dark:bg-zinc-800' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                            title="Edit Post"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>

                        {/* Delete Button Option Icon */}
                        <button 
                            onClick={() => onDelete(post._id)}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                            title="Delete Post"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Post Content Canvas Block */}
            <div className="space-y-3 pl-11">
                {isEditingPost ? (
                    <div className="space-y-2">
                        <textarea
                            value={editPostContent}
                            onChange={(e) => setEditPostContent(e.target.value)}
                            className="w-full text-sm outline-none resize-none bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80 rounded-xl p-3 text-slate-800 dark:text-zinc-200"
                            rows="3"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => setIsEditingPost(false)}
                                className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePost}
                                className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-blue-700 transition shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </p>
                )}
                
                {post.image && (
                    <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800">
                        <img src={post.image} alt="Post media" className="w-full max-h-80 object-cover" />
                    </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex items-center gap-6 pt-2 text-slate-400 dark:text-zinc-500">
                    <button 
                        onClick={() => onLike(post._id)} 
                        className={`flex items-center gap-1.5 text-xs font-bold transition ${isLiked ? "text-pink-500" : "hover:text-pink-500"}`}
                    >
                        <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likes?.length || 0}</span>
                    </button>

                    <button 
                        onClick={() => setShowComments(!showComments)} 
                        className={`flex items-center gap-1.5 text-xs font-bold transition ${showComments ? "text-blue-500" : "hover:text-blue-500"}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12 3 7.582 7.03 4 12 4s9 3.582 9 8z" />
                        </svg>
                        <span>{post.commentCount || 0}</span>
                    </button>
                </div>

                {/* Comments Section Drawer */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60 space-y-4">
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-grow bg-slate-50 dark:bg-zinc-800 text-xs font-medium rounded-xl px-3 py-2 outline-none border border-transparent focus:border-slate-200 dark:focus:border-zinc-700 text-slate-800 dark:text-zinc-200"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                className="bg-blue-600 disabled:opacity-40 text-white text-[11px] font-bold px-3.5 rounded-xl transition"
                            >
                                Reply
                            </button>
                        </form>

                        {loadingComments && (
                            <div className="py-2 flex justify-center">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {comments.map((comment) => {
                                const commentAuthor = comment.userId || {};
                                const commentUsername = commentAuthor.username || "user";
                                const commentFullName = commentAuthor.fullName || commentUsername;
                                const commentProfilePic = commentAuthor.profilePic;
                                const commentAuthorId = commentAuthor._id || comment.userId;
                                
                                const isCommentOwner = commentAuthorId === currentUserId;
                                const isEditing = editingCommentId === comment._id;

                                return (
                                    <div key={comment._id} className="bg-slate-50/60 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-900 rounded-xl p-2.5 flex gap-2.5 items-start">
                                        <Link to={`/profile/${commentAuthorId}`} className="flex-shrink-0 hover:opacity-80 transition">
                                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white uppercase text-[10px] overflow-hidden">
                                                {commentProfilePic ? (
                                                    <img src={commentProfilePic} alt={commentUsername} className="w-full h-full object-cover" />
                                                ) : (
                                                    commentUsername.charAt(0)
                                                )}
                                            </div>
                                        </Link>

                                        {/* Comment Body Wrapper */}
                                        <div className="flex-grow space-y-0.5">
                                            <div className="flex justify-between items-center">
                                                <Link to={`/profile/${commentAuthorId}`} className="flex items-baseline gap-1.5 hover:underline decoration-slate-400">
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-zinc-200">
                                                        {commentFullName}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold">
                                                        @{commentUsername}
                                                    </span>
                                                </Link>
                                                
                                                {isCommentOwner && !isEditing && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button 
                                                            onClick={() => { setEditingCommentId(comment._id); setEditingText(comment.content); }}
                                                            className="text-[10px] text-slate-400 hover:text-blue-500 font-bold"
                                                        >
                                                            Edit
                                                        </button>
                                                        <span className="text-slate-300 dark:text-zinc-800 text-xs">•</span>
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                            className="text-[10px] text-slate-400 hover:text-red-500 font-bold"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="flex gap-2 mt-1">
                                                    <input
                                                        type="text"
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="flex-grow bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-1.5 text-xs outline-none text-slate-800 dark:text-zinc-200"
                                                    />
                                                    <button 
                                                        onClick={() => handleUpdateComment(comment._id)}
                                                        className="bg-emerald-600 text-white text-[10px] font-bold px-2 rounded-lg"
                                                    >
                                                        Save
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingCommentId(null)}
                                                        className="bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold px-2 rounded-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {!loadingComments && comments.length === 0 && (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold text-center py-1 uppercase tracking-wider">
                                    No comments yet
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Post;
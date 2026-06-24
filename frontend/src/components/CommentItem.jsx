import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";
import DropdownMenu from "./ui/DropdownMenu";
import ConfirmDialog from "./ui/ConfirmDialog";

const CommentItem = ({ comment, currentUserId, postOwnerId, onDeleteLocally, onUpdateLocally }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const author = comment.userId || {};
    const isCommentAuthor = author._id === currentUserId;
    const isPostOwner = postOwnerId === currentUserId;

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/comments/${comment._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) onDeleteLocally(comment._id);
        } catch (error) {
            console.error("Error deleting comment", error);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/comments/${comment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: editContent })
            });

            const data = await response.json();
            if (response.ok) {
                onUpdateLocally(data.comment);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating comment", error);
        }
    };

    return (
        <div className="flex gap-2.5 items-start group">
            <Link to={`/profile/${author._id}`} className="flex-shrink-0 mt-0.5">
                <ProfileAvatar user={author} size="w-7 h-7" />
            </Link>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1">
                    <div className="bg-white border border-gray-200/60 rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm inline-block max-w-[85%]">
                        <Link to={`/profile/${author._id}`} className="text-xs font-bold text-gray-900 hover:underline block mb-0.5">
                            {author.fullName || author.username || "User"}
                        </Link>
                        
                        {isEditing ? (
                            <div className="mt-1 min-w-[200px]">
                                <input 
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full text-sm p-1 border-b border-blue-500 outline-none bg-transparent text-gray-800"
                                    autoFocus
                                />
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hover:text-gray-600 transition">Cancel</button>
                                    <button onClick={handleUpdate} className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:text-blue-700 transition">Save</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-700 break-words leading-normal">
                                {comment.content}
                            </p>
                        )}
                    </div>

                    {/* Context Action Bar Dropdown Menu - Appears cleanly on hover to prevent interface clutter */}
                    {!isEditing && (isCommentAuthor || isPostOwner) && (
                        <div className="opacity-0 group-hover:opacity-100 transition duration-150 self-center">
                            <DropdownMenu trigger={
                                <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            }>
                                {isCommentAuthor && (
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition font-medium"
                                    >
                                        Edit Comment
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsConfirmOpen(true)} 
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 font-bold transition"
                                >
                                    Delete
                                </button>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
                
                {/* Timestamp line */}
                {!isEditing && (
                    <div className="text-[11px] text-gray-400 font-medium mt-1 ml-2">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>

            <ConfirmDialog 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Comment"
                message="Are you sure you want to permanently delete this comment?"
            />
        </div>
    );
};

export default CommentItem;
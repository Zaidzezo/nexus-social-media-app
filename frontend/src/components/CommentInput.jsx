import { useState } from "react";
import ProfileAvatar from "./ProfileAvatar";

const CommentInput = ({ postId, onCommentAdded }) => {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:5000/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postId, content })
            });

            const data = await response.json();
            if (response.ok) {
                setContent("");
                onCommentAdded(data.comment);
            }
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <ProfileAvatar size="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 relative flex items-center">
                <input
                    type="text"
                    placeholder="Write a comment..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 rounded-2xl pl-4 pr-16 py-2 text-sm focus:outline-none shadow-inner-sm transition disabled:bg-gray-50 text-gray-800 placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    className="absolute right-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition"
                >
                    Post
                </button>
            </div>
        </form>
    );
};

export default CommentInput;
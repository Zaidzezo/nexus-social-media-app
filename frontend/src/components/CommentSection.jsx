import { useState, useEffect } from "react";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";

const CommentSection = ({ postId, currentUserId, postOwnerId, onCommentCountChange }) => {
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/comments/${postId}`);
                const data = await response.json();
                if (response.ok) setComments(data.comments);
            } catch (error) {
                console.error("Failed to fetch comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    const handleAddComment = (newComment) => {
        setComments([newComment, ...comments]);
        if (onCommentCountChange) onCommentCountChange(1);
    };

    const handleDeleteComment = (commentId) => {
        setComments(comments.filter(c => c._id !== commentId));
        if (onCommentCountChange) onCommentCountChange(-1);
    };

    const handleUpdateComment = (updatedComment) => {
        setComments(comments.map(c => c._id === updatedComment._id ? updatedComment : c));
    };

    return (
        <div className="p-4 space-y-4">
            <CommentInput postId={postId} onCommentAdded={handleAddComment} />

            <div className="space-y-3 pt-2">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-2">
                        No replies yet. Start the conversation!
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentItem 
                            key={comment._id} 
                            comment={comment} 
                            currentUserId={currentUserId}
                            postOwnerId={postOwnerId}
                            onDeleteLocally={handleDeleteComment}
                            onUpdateLocally={handleUpdateComment}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
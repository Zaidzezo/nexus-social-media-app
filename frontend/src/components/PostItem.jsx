import React from 'react';

const PostItem = ({ post, onDelete, onEdit }) => {
    const currentUserId = localStorage.getItem('userId');

    const authorId = post.author?._id || post.author;
    const isAuthor = authorId === currentUserId;

    return (
        <div style={styles.postCard}>
            {/* Display the name safely */}
            <p className="font-bold">{post.author?.fullName || "Anonymous"}</p>
            <p>{post.content}</p>
            
            {isAuthor && (
                <div style={styles.actions}>
                    <button onClick={() => onEdit(post._id)}>Edit</button>
                    <button onClick={() => onDelete(post._id)} style={styles.deleteBtn}>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    postCard: { border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '8px' },
    actions: { marginTop: '10px' },
    deleteBtn: { marginLeft: '10px', color: 'red' }
};

export default PostItem;
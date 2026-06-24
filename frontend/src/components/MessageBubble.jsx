import { useState } from 'react';
import { createPortal } from 'react-dom';

const MessageBubble = ({ message, isOwn, onReply, onEdit, onDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    const currentUserId = localStorage.getItem("userId");

    if (message.isDeleted) {
        return (
            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm italic border border-dashed transition-colors ${
                    isOwn 
                        ? 'border-blue-200 bg-blue-50/50 text-blue-400/80 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-400' 
                        : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:text-zinc-500'
                }`}>
                    This message was deleted
                </div>
            </div>
        );
    }

    const senderId = typeof message.sender === 'object' ? (message.sender?._id || message.sender?.id) : message.sender;

    const isMessageRead = message.isRead === true || (
        Array.isArray(message.readBy) && 
        message.readBy.some(id => {
            const readId = typeof id === 'object' ? (id?._id || id?.id) : id;
            return String(readId) !== String(senderId);
        })
    );

    const parentSenderId = message.replyTo?.sender?._id || message.replyTo?.sender;
    const isParentOwn = String(parentSenderId) === String(currentUserId);
    const parentSenderName = isParentOwn ? "You" : (message.replyTo?.sender?.fullName || "User");

    return (
        <div
            className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex items-center gap-1 transition-opacity duration-150 ${
                isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${isOwn ? 'order-first' : 'order-last'}`}>
                <button
                    onClick={() => onReply(message)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                    title="Reply"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>

                {isOwn && (
                    <>
                        <button
                            onClick={() => onEdit(message)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            title="Edit"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onDelete(message._id)}
                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            <div className={`max-w-[75%] ${isOwn ? 'order-last' : 'order-first'}`}>
                {message.replyTo && (
                    <div className={`rounded-xl px-3 py-2 mb-1 text-xs border-l-[3px] opacity-60 transition-colors ${
                        isParentOwn 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-900 dark:text-blue-200' 
                            : 'bg-gray-100 dark:bg-zinc-900/60 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-200'
                    }`}>
                        <div className="truncate">
                            <p className="font-semibold">{parentSenderName}</p>
                            <p>
                                {message.replyTo.isDeleted
                                    ? 'This message was deleted'
                                    : message.replyTo.attachments?.length > 0 && !message.replyTo.content
                                        ? '📷 Image'
                                        : message.replyTo.content}
                            </p>
                        </div>
                    </div>
                )}

                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm transition-colors ${
                    isOwn
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 border border-gray-200/60 dark:bg-zinc-800 dark:text-zinc-100 dark:border-transparent rounded-bl-sm'
                } ${message.isOptimistic ? 'opacity-60' : 'opacity-100'}`}
                >
                    {message.attachments?.length > 0 && (
                        <div className={`-mx-1 ${message.content ? 'mb-2' : ''}`}>
                            {message.attachments.map((url) => (
                                <img
                                    key={url}
                                    src={url}
                                    alt="Attachment"
                                    className="w-full max-w-[280px] rounded-xl object-cover cursor-pointer hover:brightness-95 dark:hover:brightness-90 transition-all duration-150"
                                    onClick={() => setActiveImage(url)}
                                    loading="lazy"
                                />
                            ))}
                        </div>
                    )}

                    {message.content && (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                        {message.isEdited && (
                            <span className={`text-[10px] ${isOwn ? 'text-blue-200/80' : 'text-gray-400 dark:text-zinc-500'}`}>
                                edited
                            </span>
                        )}
                        <span className={`text-[10px] ${isOwn ? 'text-blue-200/80' : 'text-gray-400 dark:text-zinc-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                        
                        {isOwn && (
                            <span className="flex items-center ml-0.5">
                                {message.isOptimistic ? (
                                    <svg className="w-3 h-3 text-blue-200/60 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : isMessageRead ? (
                                    <svg className="w-3.5 h-3.5 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 13l4 4L24 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5 text-blue-200/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {activeImage && createPortal(
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200"
                    onClick={() => setActiveImage(null)}
                >
                    <button 
                        className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors text-sm"
                        onClick={() => setActiveImage(null)}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <img 
                        src={activeImage} 
                        alt="Full size attachment" 
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};

export default MessageBubble;
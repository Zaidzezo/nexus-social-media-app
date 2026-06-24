import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProfileAvatar from '../components/ProfileAvatar';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';
import { useSocket } from '../context/SocketContext';

const ConversationPanel = ({ conversationId, onBack }) => {
    const [messages, setMessages]          = useState([]);
    const [otherUser, setOtherUser]        = useState(null);
    const [loading, setLoading]            = useState(true);
    const [loadingMore, setLoadingMore]    = useState(false);
    const [hasMore, setHasMore]            = useState(false);
    const [nextCursor, setNextCursor]      = useState(null);
    const [replyTo, setReplyTo]            = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [typingUsers, setTypingUsers]    = useState([]);
    const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('userId'));

    const { emit, on, off } = useSocket();
    const bottomRef      = useRef(null);
    const topRef         = useRef(null);
    const chatContainerRef = useRef(null);
    const isFirstLoad    = useRef(true);
    const isInitialized  = useRef(false);
    const typingTimers   = useRef({});

    const getSenderId = (sender) => {
        if (!sender) return '';
        if (typeof sender === 'object') {
            return String(sender._id ?? sender.id ?? '');
        }
        return String(sender);
    };

    const fetchMessages = useCallback(async (cursor = null) => {
        let container = chatContainerRef.current;
        let scrollHeightBefore = container ? container.scrollHeight : 0;
        let scrollTopBefore = container ? container.scrollTop : 0;

        try {
            if (cursor) setLoadingMore(true);
            const url = cursor
                ? `/messages/conversations/${conversationId}/messages?limit=20&cursor=${cursor}`
                : `/messages/conversations/${conversationId}/messages?limit=20`;
            const res = await api.get(url);
            const { messages: incoming, meta } = res.data;
            
            setMessages(prev => cursor ? [...incoming, ...prev] : incoming);
            setHasMore(meta.hasMore);
            setNextCursor(meta.nextCursor);

            if (cursor && container) {
                requestAnimationFrame(() => {
                    container.scrollTop = container.scrollHeight - scrollHeightBefore + scrollTopBefore;
                });
            }
        } catch (err) {
            console.error('fetchMessages error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [conversationId]);

    useEffect(() => {
        const activeId = localStorage.getItem('userId');
        setCurrentUserId(activeId);

        setMessages([]);
        setOtherUser(null);
        setReplyTo(null);
        setEditingMessage(null);
        setTypingUsers([]);
        setLoading(true);
        isFirstLoad.current = true;
        isInitialized.current = false;

        const init = async () => {
            await fetchMessages();
            try {
                const res   = await api.get(`/messages/conversations/${conversationId}`);
                const other = res.data.participants.find(p => getSenderId(p) !== activeId);
                setOtherUser(other);
            } catch (err) {
                console.error('Header fetch error:', err);
            }
            
            emit('mark_read',  { conversationId });
            emit('join_chat',  { conversationId });
            isInitialized.current = true;
        };
        init();

        return () => {
            emit('leave_chat', { conversationId });
            Object.values(typingTimers.current).forEach(clearTimeout);
            typingTimers.current = {};
        };
    }, [conversationId, fetchMessages, emit]);

    useEffect(() => {
        if (!loading && isFirstLoad.current && messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
            isFirstLoad.current = false;
        }
    }, [loading, messages.length]);

    const lastMessageId = messages[messages.length - 1]?._id;
    useEffect(() => {
        if (isFirstLoad.current || !lastMessageId) return;

        const lastMessage = messages[messages.length - 1];
        const isOwnMessage = getSenderId(lastMessage.sender) === String(currentUserId);
        const container = chatContainerRef.current;

        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
            if (isOwnMessage || isNearBottom) {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [lastMessageId, currentUserId]);

    useEffect(() => {
        const handleNewMessage = ({ conversationId: cId, message }) => {
            if (cId !== conversationId) return;
            
            setMessages(prev => {
                if (prev.some(m => m._id === message._id)) return prev;
                const cleanPrev = prev.filter(m => !(m.isOptimistic && m.content === message.content && getSenderId(m.sender) === getSenderId(message.sender)));
                return [...cleanPrev, message];
            });

            emit('mark_read', { conversationId });
        };

        const handleMessageUpdated = ({ message }) => {
            if (message.conversationId !== conversationId &&
                message.conversationId?._id !== conversationId) return;
                
            setMessages(prev => prev.map(m => {
                if (m._id === message._id) {
                    const hasPopulatedReply = message.replyTo && typeof message.replyTo === 'object' && message.replyTo.sender?.fullName;
                    return {
                        ...message,
                        replyTo: m.replyTo && !hasPopulatedReply ? m.replyTo : message.replyTo
                    };
                }
                return m;
            }));
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages(prev => prev.map(m =>
                m._id === messageId
                    ? { ...m, isDeleted: true, content: 'This message was deleted', attachments: [] }
                    : m
            ));
        };

        const handleMessagesRead = ({ conversationId: cId, readBy }) => {
            if (cId !== conversationId) return;

            const readers = Array.isArray(readBy) ? readBy : [readBy];
            const didRecipientRead = readers.some(id => {
                const readId = typeof id === 'object' ? (id._id || id.id) : id;
                return String(readId) !== String(currentUserId);
            });

            if (didRecipientRead) {
                setMessages(prev => prev.map(m => 
                    getSenderId(m.sender) === String(currentUserId)
                        ? { ...m, isRead: true }
                        : m
                ));
            }
        };

        const handleUserTyping = ({ userId, fullName, conversationId: cId }) => {
            if (cId !== conversationId || userId === currentUserId) return;
            setTypingUsers(prev =>
                prev.some(u => u.userId === userId) ? prev : [...prev, { userId, fullName }]
            );
            clearTimeout(typingTimers.current[userId]);
            typingTimers.current[userId] = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.userId !== userId));
            }, 3000);
        };

        const handleUserStopTyping = ({ userId }) => {
            clearTimeout(typingTimers.current[userId]);
            setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        };

        on('new_message',     handleNewMessage);
        on('message_updated',   handleMessageUpdated);
        on('message_deleted',   handleMessageDeleted);
        on('messages_read',     handleMessagesRead);
        on('user_typing',       handleUserTyping);
        on('user_stop_typing',  handleUserStopTyping);

        return () => {
            off('new_message',      handleNewMessage);
            off('message_updated',  handleMessageUpdated);
            off('message_deleted',  handleMessageDeleted);
            off('messages_read',    handleMessagesRead);
            off('user_typing',      handleUserTyping);
            off('user_stop_typing', handleUserStopTyping);
        };
    }, [conversationId, currentUserId, emit, on, off]);

    useEffect(() => {
        const topEl = topRef.current;
        if (!topEl) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !loadingMore && isInitialized.current) {
                fetchMessages(nextCursor);
            }
        }, { threshold: 1.0 });
        observer.observe(topEl);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, nextCursor, fetchMessages]);

    const handleSend = useCallback((content, attachments = []) => {
        if (editingMessage) {
            const tempContent = content;
            setMessages(prev => prev.map(m =>
                m._id === editingMessage._id
                    ? { ...m, content: tempContent, isEdited: true }
                    : m
            ));
            
            emit('edit_message', { messageId: editingMessage._id, content }, (response) => {
                if (response?.error) {
                    setMessages(prev => prev.map(m =>
                        m._id === editingMessage._id
                            ? { ...m, content: editingMessage.content, isEdited: editingMessage.isEdited }
                            : m
                    ));
                } else if (response?.message) {
                    setMessages(prev => prev.map(m => {
                        if (m._id === editingMessage._id) {
                            const hasPopulatedReply = response.message.replyTo && typeof response.message.replyTo === 'object' && response.message.replyTo.sender?.fullName;
                            return {
                                ...response.message,
                                replyTo: m.replyTo && !hasPopulatedReply ? m.replyTo : response.message.replyTo
                            };
                        }
                        return m;
                    }));
                }
            });
            setEditingMessage(null);
            return;
        }

        const tempId = `temp_${Date.now()}`;
        setMessages(prev => [...prev, {
            _id:        tempId,
            conversationId,
            sender:     { _id: currentUserId },
            content,
            attachments,
            replyTo:    replyTo || null,
            createdAt:  new Date().toISOString(),
            isOptimistic: true
        }]);

        setReplyTo(null);

        emit('send_message', { conversationId, content, attachments, replyTo: replyTo?._id || null },
            (response) => {
                if (!response || response.error) {
                    setMessages(prev => prev.filter(m => m._id !== tempId));
                    return;
                }
                setMessages(prev => prev.map(m => m._id === tempId ? response.message : m));
            }
        );
    }, [emit, conversationId, currentUserId, replyTo, editingMessage]);

    const handleDelete = useCallback((messageId) => {
        setMessages(prev => prev.map(m =>
            m._id === messageId
                ? { ...m, isDeleted: true, content: 'This message was deleted', attachments: [] }
                : m
        ));
        emit('delete_message', { messageId }, (response) => {
            if (response?.error) {
                fetchMessages();
            }
        });
    }, [emit, fetchMessages]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 transition-colors">
            {/* ── HEADER PANEL ── */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 backdrop-blur-md flex-shrink-0 sticky top-0 z-10 transition-colors">
                <button onClick={onBack} className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition -ml-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {otherUser ? (
                    <Link to={`/profile/${getSenderId(otherUser)}`} className="flex items-center gap-3 group min-w-0">
                        <ProfileAvatar user={otherUser} size="w-9 h-9" />
                        <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-zinc-100 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {otherUser.fullName}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors">
                                @{otherUser.username}
                            </p>
                        </div>
                    </Link>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                        <div className="w-28 h-3.5 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                )}
            </div>

            {/* ── MESSAGE STREAM AREA ── */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-zinc-50/50 dark:bg-zinc-950">
                <div ref={topRef} className="w-full h-px" />
                {loadingMore && (
                    <div className="flex justify-center py-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {messages.length === 0 && (
                    <div className="flex flex-col justify-center items-center h-full pt-20 text-center">
                        <p className="text-sm font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">No messages yet</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Send a wave to start the chat conversation!</p>
                    </div>
                )}
                {messages.map(message => {
                    const isOwn = getSenderId(message.sender) === String(currentUserId);
                    return (
                        <MessageBubble
                            key={message._id}
                            message={message}
                            isOwn={isOwn}
                            onReply={setReplyTo}
                            onEdit={setEditingMessage}
                            onDelete={handleDelete}
                            // Injecting styling variables directly to meet image colors
                            bubbleStyles={isOwn ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white dark:bg-zinc-800 dark:text-zinc-100'}
                        />
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* ── REAL-TIME TYPING FOOTER OVERLAY ── */}
            {typingUsers.length > 0 && (
                <div className="px-5 py-1.5 flex items-center gap-2 bg-white dark:bg-zinc-950 flex-shrink-0 border-t border-transparent transition-colors">
                    <div className="flex gap-1 items-center">
                        {[0, 150, 300].map(delay => (
                            <div key={delay} className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium italic">
                        {typingUsers.length === 1
                            ? `${typingUsers[0].fullName} is typing...`
                            : `${typingUsers[0].fullName} and ${typingUsers.length - 1} others are typing...`
                        }
                    </span>
                </div>
            )}

            {/* ── INPUT SYSTEM WORKSPACE ── */}
            <div className="border-t border-gray-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
                <MessageInput
                    onSend={handleSend}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    editingMessage={editingMessage}
                    onCancelEdit={() => setEditingMessage(null)}
                    onTyping={() => emit('typing', { conversationId })}
                    onStopTyping={() => emit('stop_typing', { conversationId })}
                />
            </div>
        </div>
    );
};

export default ConversationPanel;
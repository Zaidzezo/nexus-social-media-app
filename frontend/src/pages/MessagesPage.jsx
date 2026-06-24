import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ProfileAvatar from '../components/ProfileAvatar';
import ConversationPanel from '../components/ConversationPanel';
import { useSocket } from '../context/SocketContext';

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr);
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'now';
    if (mins  < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days  < 7)  return `${days}d`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const MessagesPage = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]               = useState('');
    const { on, off, clearUnread }          = useSocket();
    const currentUserId = localStorage.getItem('userId');

    // ── FETCH INBOX W/ DEDUPLICATION ──
    useEffect(() => {
        clearUnread?.();
        api.get('/messages/conversations')
            .then(res => {
                const uniqueConversations = [];
                const seenIds = new Set();
                
                if (Array.isArray(res.data)) {
                    for (const convo of res.data) {
                        if (convo && convo._id && !seenIds.has(convo._id)) {
                            seenIds.add(convo._id);
                            uniqueConversations.push(convo);
                        }
                    }
                }
                setConversations(uniqueConversations);
            })
            .catch(err => console.error('Inbox error:', err))
            .finally(() => setLoading(false));
    }, [clearUnread]);

    // ── REAL-TIME INBOX UPDATES ──
    useEffect(() => {
        const handleNewMessage = ({ conversationId: cId, message }) => {
            setConversations(prev => {
                const updated = prev.map(c =>
                    c._id === cId
                        ? { ...c, lastMessage: message, updatedAt: new Date().toISOString() }
                        : c
                );
                return [...updated].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            });
        };
        on('new_message', handleNewMessage);
        return () => off('new_message', handleNewMessage);
    }, [on, off]);

    const getOther = (convo) =>
        convo.participants.find(p => p._id !== currentUserId);

    const filtered = conversations.filter(convo => {
        const other = getOther(convo);
        const q = search.toLowerCase();
        return (
            other?.fullName?.toLowerCase().includes(q) ||
            other?.username?.toLowerCase().includes(q)
        );
    });

    return (
            <div className="flex bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800/40 transition-colors h-screen">
            {/* ══════════════════════════════════
                LEFT SIDEBAR
            ══════════════════════════════════ */}
            <div className={`
                flex-shrink-0 flex flex-col
                w-full md:w-80 lg:w-96
                border-r border-gray-100 dark:border-zinc-800/60
                bg-white dark:bg-zinc-900 transition-colors
                ${conversationId ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Sidebar header + search */}
                <div className="px-5 pt-5 pb-3 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50 mb-4">Messages</h2>
                    <div className="relative">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800 rounded-xl text-sm text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto space-y-0.5">
                    {loading ? (
                        <div className="flex justify-center items-center h-24">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 dark:text-zinc-500 py-12 px-6">
                            {search ? 'No results found.' : 'No conversations yet.'}
                        </p>
                    ) : (
                        filtered.map(convo => {
                            const other   = getOther(convo);
                            const unread  = convo.unreadCount?.[currentUserId] || 0;
                            const isActive = convo._id === conversationId;

                            return (
                                <button
                                    key={convo._id}
                                    onClick={() => navigate(`/messages/${convo._id}`)}
                                    className={`
                                        w-full flex items-center gap-3.5 px-5 py-3.5
                                        text-left transition-colors
                                        border-r-[3px]
                                        ${isActive
                                            ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/40 border-transparent'
                                        }
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <ProfileAvatar user={other} size="w-12 h-12" />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className={`text-sm truncate ${
                                                unread > 0
                                                    ? 'font-bold text-gray-900 dark:text-zinc-100'
                                                    : 'font-semibold text-gray-800 dark:text-zinc-300'
                                            }`}>
                                                {other?.fullName}
                                            </span>
                                            <span className="text-[11px] text-gray-400 dark:text-zinc-500 flex-shrink-0">
                                                {formatTime(convo.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <span className={`text-xs truncate ${
                                                unread > 0
                                                    ? 'font-semibold text-gray-600 dark:text-zinc-300'
                                                    : 'text-gray-400 dark:text-zinc-500'
                                            }`}>
                                                {convo.lastMessage?.content || 'Start a conversation'}
                                            </span>
                                            {unread > 0 && (
                                                <span className="flex-shrink-0 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════
                RIGHT PANEL (CHAT VIEWPORTS)
            ══════════════════════════════════ */}
            <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 transition-colors ${conversationId ? 'flex' : 'hidden md:flex'}`}>
                {conversationId ? (
                    <ConversationPanel
                        key={conversationId}
                        conversationId={conversationId}
                        onBack={() => navigate('/messages')}
                    />
                ) : (
                    /* ── Default Workspace Empty Placeholder ── */
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 select-none">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-zinc-800 flex items-center justify-center bg-gray-50 dark:bg-zinc-900/40">
                            <svg
                                className="w-9 h-9 text-gray-400 dark:text-zinc-500"
                                fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth="1.5"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100">Your Messages</h3>
                            <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">Send a message to start a chat.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
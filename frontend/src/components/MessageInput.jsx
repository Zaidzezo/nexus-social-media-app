import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api';

const compressDmImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX = 1080;
            const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
            canvas.width  = img.width  * ratio;
            canvas.height = img.height * ratio;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const MessageInput = ({
    onSend,
    replyTo,
    onCancelReply,
    editingMessage,
    onCancelEdit,
    onTyping,
    onStopTyping
}) => {
    const [content, setContent]         = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading]   = useState(false);
    const [error, setError]                = useState('');

    const textareaRef   = useRef(null);
    const fileInputRef  = useRef(null);
    const typingTimeout = useRef(null);
    const isTypingRef   = useRef(false);
    
    const draftRef      = useRef({ content: '', imagePreview: null });
    const prevEditingRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
    }, [content]);

    useEffect(() => {
        if (editingMessage) {
            if (!prevEditingRef.current) {
                draftRef.current = { content, imagePreview };
            }
            setContent(editingMessage.content || '');
            setImagePreview(null);
            textareaRef.current?.focus();
        } else if (prevEditingRef.current && !editingMessage) {
            restoreDraft();
        }
        prevEditingRef.current = editingMessage;
    }, [editingMessage?._id]);

    const restoreDraft = () => {
        setContent(draftRef.current.content);
        setImagePreview(draftRef.current.imagePreview);
        draftRef.current = { content: '', imagePreview: null };
    };

    useEffect(() => () => clearTimeout(typingTimeout.current), []);

    const handleTyping = useCallback(() => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTyping?.();
        }
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            isTypingRef.current = false;
            onStopTyping?.();
        }, 2500);
    }, [onTyping, onStopTyping]);

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        if (!file.type.startsWith('image/')) {
            setError('Only images are supported.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be under 10MB.');
            return;
        }
        try {
            const compressed = await compressDmImage(file);
            setImagePreview(compressed);
        } catch {
            setError('Image processing failed.');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setError('');
    };

    const handleSubmit = async () => {
        const trimmed = content.trim();
        if (!trimmed && !imagePreview) return;
        if (isUploading) return;

        clearTimeout(typingTimeout.current);
        isTypingRef.current = false;
        onStopTyping?.();

        let attachments = [];

        if (imagePreview) {
            setIsUploading(true);
            try {
                const res = await api.post('/messages/upload-attachment', { image: imagePreview });
                attachments = [res.data.url];
            } catch {
                setError('Image upload failed. Please try again.');
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        onSend(trimmed, attachments);
        setContent('');
        setImagePreview(null);
        setError('');
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const isEditMode = !!editingMessage;
    const canSend    = (content.trim() || imagePreview) && !isUploading;

    return (
        <div className="flex-shrink-0 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-900/60 transition-colors">

            {/* ── EDIT MODE BAR ── */}
            {isEditMode && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-100 dark:border-yellow-900/30">
                    <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold flex-1">Editing message</p>
                    <button onClick={onCancelEdit} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 text-sm">✕</button>
                </div>
            )}

            {/* ── REPLY-TO BAR ── */}
            {replyTo && !isEditMode && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
                    <div className="w-0.5 h-7 bg-blue-500 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {replyTo.sender?.fullName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {replyTo.attachments?.length > 0 && !replyTo.content
                                ? '📷 Image'
                                : replyTo.content}
                        </p>
                    </div>
                    <button onClick={onCancelReply} className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 text-sm">✕</button>
                </div>
            )}

            {/* ── IMAGE PREVIEW ── */}
            {imagePreview && (
                <div className="px-4 pt-3">
                    <div className="relative inline-block">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-zinc-800"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-1.5 -right-1.5 bg-gray-700 dark:bg-zinc-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 px-4 pt-2">{error}</p>
            )}

            {/* ── INPUT ROW ── */}
            <div className="flex items-end gap-3 px-4 py-3">
                {!isEditMode && (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="dm-image-input"
                            onChange={handleImageChange}
                        />
                        <label
                            htmlFor="dm-image-input"
                            className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition mb-0.5"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                <rect x="3" y="3" width="18" height="18" rx="3" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </label>
                    </>
                )}

                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={isEditMode ? 'Edit your message...' : 'Type a message...'}
                    className="flex-1 resize-none bg-gray-100 dark:bg-zinc-900 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-h-32 text-gray-800 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full w-10 h-10 flex items-center justify-center transition mb-0.5"
                >
                    {isUploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isEditMode ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
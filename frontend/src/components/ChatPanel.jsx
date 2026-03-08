import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ImageIcon, Send } from './Icons';

const REACTIONS = ['\u2764\uFE0F', '\uD83D\uDC4D', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDE22'];

export default function ChatPanel({ isOpen, onClose, listing, sellerId }) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [showReactions, setShowReactions] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const channelRef = useRef(null);

    // Load conversations on open
    useEffect(() => {
        if (isOpen && user) {
            fetchConversations();
        }
        if (!isOpen) {
            setActiveConv(null);
            setMessages([]);
            setImageFile(null);
            setImagePreview(null);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        }
    }, [isOpen, user]);

    // Auto-start conversation when listing/seller provided
    useEffect(() => {
        if (isOpen && listing && sellerId && user) {
            handleStartConversation();
        }
    }, [isOpen, listing, sellerId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const data = await api.getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        }
    };

    const handleStartConversation = async () => {
        try {
            const conv = await api.getOrCreateConversation(listing?.id, sellerId);
            setActiveConv(conv);
            loadMessages(conv.id);
            subscribeToMessages(conv.id);
        } catch (err) {
            console.error('Failed to start conversation:', err);
        }
    };

    const selectConversation = (conv) => {
        setActiveConv(conv);
        loadMessages(conv.id);
        subscribeToMessages(conv.id);
        api.markConversationRead(conv.id).catch(() => { });
    };

    const loadMessages = async (convId) => {
        try {
            const data = await api.getMessages(convId);
            setMessages(data);
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    const subscribeToMessages = (convId) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`messages:${convId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${convId}`,
            }, async (payload) => {
                const newMsg = payload.new;
                // Don't add if already in list
                setMessages((prev) => {
                    if (prev.find((m) => m.id === newMsg.id)) return prev;
                    return [...prev, {
                        ...newMsg,
                        sender_username: newMsg.sender_id === user?.id ? user.username : '',
                        reaction_summary: [],
                    }];
                });
                // Reload to get proper sender username
                setTimeout(() => loadMessages(convId), 500);
            })
            .subscribe();

        channelRef.current = channel;
    };

    const handleSend = async () => {
        if (!activeConv || (!text.trim() && !imageFile)) return;
        setSending(true);
        try {
            if (imageFile) {
                const msg = await api.sendMessageWithImage(activeConv.id, text.trim(), imageFile);
                setMessages((prev) => [...prev, {
                    ...msg,
                    sender_username: user?.username,
                    reaction_summary: [],
                }]);
            } else {
                const msg = await api.sendMessage(activeConv.id, text.trim());
                setMessages((prev) => [...prev, {
                    ...msg,
                    sender_username: user?.username,
                    reaction_summary: [],
                }]);
            }
            setText('');
            setImageFile(null);
            setImagePreview(null);
        } catch (err) {
            console.error('Failed to send:', err);
        } finally {
            setSending(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleReact = async (messageId, emoji) => {
        try {
            await api.reactToMessage(messageId, emoji);
            loadMessages(activeConv.id);
        } catch (err) {
            console.error('Failed to react:', err);
        }
        setShowReactions(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    const otherUser = activeConv?.other_user?.username
        || (activeConv?.buyer_id === user?.id ? activeConv?.seller_username : activeConv?.buyer_username)
        || 'User';

    const convListingTitle = activeConv?.listing?.title || activeConv?.listing_title || '';

    return (
        <div className="chat-overlay" onClick={onClose}>
            <div className="chat-panel" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="chat-header">
                    {activeConv ? (
                        <>
                            <button className="chat-back-btn" onClick={() => { setActiveConv(null); setMessages([]); fetchConversations(); }}>
                                <ArrowLeft size={18} />
                            </button>
                            <div className="chat-header-info">
                                <strong>{otherUser}</strong>
                                {convListingTitle && (
                                    <span className="chat-header-listing">{convListingTitle}</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <strong style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.85rem' }}>Messages</strong>
                    )}
                    <button className="chat-close-btn" onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                {!activeConv ? (
                    <div className="chat-conv-list">
                        {conversations.length === 0 ? (
                            <div className="chat-empty">
                                <p>No conversations yet.</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                    Contact a seller to start chatting
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className="chat-conv-item"
                                    onClick={() => selectConversation(conv)}
                                >
                                    <div className="chat-conv-avatar">
                                        {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="chat-conv-info">
                                        <div className="chat-conv-name">
                                            {conv.other_user?.username || 'Unknown'}
                                        </div>
                                        {conv.listing?.title && (
                                            <div className="chat-conv-listing">{conv.listing.title}</div>
                                        )}
                                        {conv.last_message?.text && (
                                            <div className="chat-conv-preview">{conv.last_message.text}</div>
                                        )}
                                    </div>
                                    {conv.unread_count > 0 && (
                                        <span className="chat-unread">{conv.unread_count}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <>
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="chat-empty">Start the conversation!</div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id || msg.sender_username === user?.username;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`chat-msg ${isMe ? 'chat-msg-mine' : 'chat-msg-theirs'}`}
                                            onMouseEnter={() => setHoveredMsg(msg.id)}
                                            onMouseLeave={() => { setHoveredMsg(null); setShowReactions(null); }}
                                        >
                                            <div className="chat-bubble-wrapper">
                                                <div className={`chat-bubble ${isMe ? 'bubble-mine' : 'bubble-theirs'}`}>
                                                    {msg.image_url && (
                                                        <img
                                                            src={msg.image_url}
                                                            alt="Shared"
                                                            className="chat-img"
                                                            onClick={() => window.open(msg.image_url, '_blank')}
                                                        />
                                                    )}
                                                    {msg.text && <span>{msg.text}</span>}
                                                    <span className="chat-time">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {hoveredMsg === msg.id && (
                                                    <button
                                                        className="chat-react-trigger"
                                                        onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                                            <line x1="9" y1="9" x2="9.01" y2="9" />
                                                            <line x1="15" y1="9" x2="15.01" y2="9" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {showReactions === msg.id && (
                                                    <div className="chat-react-picker">
                                                        {REACTIONS.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                className="chat-react-emoji"
                                                                onClick={() => handleReact(msg.id, emoji)}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {msg.reaction_summary && msg.reaction_summary.length > 0 && (
                                                <div className="chat-reactions-display">
                                                    {msg.reaction_summary.map(({ emoji, count }) => (
                                                        <span
                                                            key={emoji}
                                                            className="chat-reaction-badge"
                                                            onClick={() => handleReact(msg.id, emoji)}
                                                        >
                                                            {emoji} {count > 1 ? count : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {imagePreview && (
                            <div className="chat-img-preview">
                                <img src={imagePreview} alt="Preview" />
                                <button
                                    className="chat-img-remove"
                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        <div className="chat-input-bar">
                            <button
                                className="chat-attach-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach photo"
                            >
                                <ImageIcon size={18} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageSelect}
                            />
                            <input
                                className="chat-input"
                                type="text"
                                placeholder="Type a message..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button
                                className="chat-send-btn"
                                onClick={handleSend}
                                disabled={sending || (!text.trim() && !imageFile)}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ListingForm from '../components/ListingForm';
import ChatPanel from '../components/ChatPanel';
import {
    ClipboardList, MessageCircle, MapPin, Plus, Edit, Trash, User,
    Star, StarFilled, Camera, Phone, FileText, ShoppingCart, DollarSign,
    CheckCircle, Upload
} from '../components/Icons';

// ── Star Rating Display ──
function StarRating({ rating = 0, count = 0 }) {
    const stars = [];
    const rounded = Math.round(rating * 2) / 2; // round to nearest 0.5
    for (let i = 1; i <= 5; i++) {
        if (i <= rounded) {
            stars.push(<StarFilled key={i} size={16} color="#111" />);
        } else {
            stars.push(<Star key={i} size={16} color="#ccc" />);
        }
    }
    return (
        <div className="star-rating">
            <div className="star-icons">{stars}</div>
            <span className="star-value">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
            <span className="star-count">({count} {count === 1 ? 'review' : 'reviews'})</span>
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading, fetchProfile } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('listings');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState(null);

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [convLoading, setConvLoading] = useState(false);

    // Profile edit state
    const [editing, setEditing] = useState(false);
    const [profileForm, setProfileForm] = useState({ phone: '', bio: '' });
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) fetchMyListings();
    }, [user]);

    useEffect(() => {
        if (user && tab === 'messages') fetchConversations();
    }, [user, tab]);

    useEffect(() => {
        if (user && editing) {
            setProfileForm({
                phone: user.phone || '',
                bio: user.bio || '',
            });
        }
    }, [editing, user]);

    const fetchMyListings = async () => {
        setLoading(true);
        try {
            const data = await api.getMyListings();
            setListings(data);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        setConvLoading(true);
        try {
            const data = await api.getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setConvLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this listing?')) return;
        try {
            await api.deleteListing(id);
            fetchMyListings();
        } catch (err) {
            alert('Failed to delete listing.');
        }
    };

    const handleEdit = (listing) => {
        setEditData(listing);
        setShowForm(true);
    };

    const handleCreated = () => {
        setShowForm(false);
        setEditData(null);
        fetchMyListings();
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            await api.updateProfile(profileForm);
            await fetchProfile(user.id);
            setEditing(false);
        } catch (err) {
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            await api.uploadAvatar(file);
            await fetchProfile(user.id);
        } catch (err) {
            alert('Failed to upload avatar. Make sure the avatars storage bucket exists in Supabase.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (authLoading) {
        return (
            <div className="dashboard">
                <div className="container">
                    <div className="loading-spinner"><div className="spinner"></div></div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const initials = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase() +
        (user.last_name?.[0] || '').toUpperCase();

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Dashboard
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                            Welcome, {user.first_name || user.username} ({user.role})
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditData(null); setShowForm(true); }}>
                        <Plus size={16} /> New Listing
                    </button>
                </div>

                <div className="dashboard-tabs">
                    <button className={`dashboard-tab ${tab === 'listings' ? 'active' : ''}`} onClick={() => setTab('listings')}>
                        <ClipboardList size={16} /> My Listings
                    </button>
                    <button className={`dashboard-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
                        <MessageCircle size={16} /> Messages
                    </button>
                    <button className={`dashboard-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                        <User size={16} /> Profile
                    </button>
                </div>

                {/* LISTINGS TAB */}
                {tab === 'listings' && (
                    <div>
                        {loading ? (
                            <div className="loading-spinner"><div className="spinner"></div></div>
                        ) : listings.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon"><ClipboardList size={40} /></div>
                                <h3>No Listings Yet</h3>
                                <p>Create your first listing to start selling or buying.</p>
                                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setEditData(null); setShowForm(true); }}>
                                    Create Listing
                                </button>
                            </div>
                        ) : (
                            <div className="listings-grid">
                                {listings.map((listing) => (
                                    <div key={listing.id} className="product-card">
                                        <div className="product-card-img">
                                            {(listing.image || listing.image_url) ? (
                                                <img src={listing.image || listing.image_url} alt={listing.title} />
                                            ) : (
                                                <div className="product-card-placeholder">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                </div>
                                            )}
                                            <div className="product-card-badges">
                                                <span className={`listing-badge ${listing.listing_type === 'sell' ? 'badge-sell' : 'badge-buy'}`}>
                                                    {listing.listing_type === 'sell' ? 'Sell' : 'Buy'}
                                                </span>
                                                <span className="listing-badge" style={{
                                                    background: listing.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                                    color: '#fff',
                                                }}>
                                                    {listing.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="product-card-body">
                                            <div className="product-card-price">{'\u20B1'}{Number(listing.price).toLocaleString()}</div>
                                            <h4 className="product-card-title">{listing.title}</h4>
                                            <p className="product-card-desc">{listing.description}</p>
                                            <div className="listing-meta" style={{ marginTop: 'auto' }}>
                                                <span>{listing.category_display || listing.category}</span>
                                                {listing.address && (
                                                    <><span>&middot;</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {listing.address}</span></>
                                                )}
                                            </div>
                                        </div>
                                        <div className="product-card-actions">
                                            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(listing)}>
                                                <Edit size={12} /> Edit
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(listing.id)}>
                                                <Trash size={12} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MESSAGES TAB */}
                {tab === 'messages' && (
                    <div>
                        {convLoading ? (
                            <div className="loading-spinner"><div className="spinner"></div></div>
                        ) : conversations.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon"><MessageCircle size={40} /></div>
                                <h3>No Messages Yet</h3>
                                <p>Start a conversation by contacting a seller on the marketplace.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {conversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className="listing-card"
                                        onClick={() => { setChatOpen(true); }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div className="profile-avatar-sm">
                                                    {conv.other_user?.username?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '0.9rem' }}>
                                                        {conv.other_user?.username || 'Unknown'}
                                                    </strong>
                                                    {conv.listing?.title && (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
                                                            {conv.listing.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {conv.unread_count > 0 && (
                                                <span className="chat-unread">{conv.unread_count}</span>
                                            )}
                                        </div>
                                        {conv.last_message?.text && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', paddingLeft: '2.75rem' }}>
                                                {conv.last_message.text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PROFILE TAB */}
                {tab === 'profile' && (
                    <div className="profile-section">
                        {/* Profile Header Card */}
                        <div className="profile-header-card">
                            <div className="profile-avatar-wrapper">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="Avatar" className="profile-avatar-img" />
                                ) : (
                                    <div className="profile-avatar-initials">{initials}</div>
                                )}
                                <button
                                    className="profile-avatar-upload"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    title="Change photo"
                                >
                                    {uploadingAvatar ? (
                                        <div className="spinner-sm"></div>
                                    ) : (
                                        <Camera size={14} />
                                    )}
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarUpload}
                                />
                            </div>

                            <div className="profile-header-info">
                                <h3 className="profile-name">
                                    {user.first_name || user.username} {user.last_name || ''}
                                </h3>
                                <p className="profile-username">@{user.username}</p>
                                <span className="profile-role-badge">{user.role}</span>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="profile-stats-row">
                            <div className="profile-stat">
                                <div className="profile-stat-icon"><DollarSign size={20} /></div>
                                <div className="profile-stat-value">{user.total_sales || 0}</div>
                                <div className="profile-stat-label">Total Sales</div>
                            </div>
                            <div className="profile-stat">
                                <div className="profile-stat-icon"><ShoppingCart size={20} /></div>
                                <div className="profile-stat-value">{user.total_purchases || 0}</div>
                                <div className="profile-stat-label">Purchases</div>
                            </div>
                            <div className="profile-stat">
                                <div className="profile-stat-icon"><StarFilled size={20} /></div>
                                <div className="profile-stat-value">
                                    <StarRating rating={user.rating || 0} count={user.rating_count || 0} />
                                </div>
                                <div className="profile-stat-label">Rating</div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="profile-details-card">
                            <div className="profile-details-header">
                                <h4>Account Details</h4>
                                {!editing && (
                                    <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                                        <Edit size={12} /> Edit
                                    </button>
                                )}
                            </div>

                            {editing ? (
                                <div className="profile-edit-form">
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <div className="input-icon-group">
                                            <span className="input-icon-prefix"><Phone size={18} /></span>
                                            <input
                                                type="text"
                                                className="form-input input-with-icon"
                                                placeholder="09XX XXX XXXX"
                                                value={profileForm.phone}
                                                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bio</label>
                                        <div className="input-icon-group">
                                            <span className="input-icon-prefix" style={{ alignSelf: 'flex-start', marginTop: '0.75rem' }}>
                                                <FileText size={18} />
                                            </span>
                                            <textarea
                                                className="form-textarea input-with-icon"
                                                placeholder="Tell us about yourself..."
                                                value={profileForm.bio}
                                                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn btn-primary btn-sm" onClick={handleSaveProfile} disabled={saving}>
                                            <CheckCircle size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="profile-details-grid">
                                    <div className="profile-detail-item">
                                        <User size={16} />
                                        <div>
                                            <span className="profile-detail-label">Username</span>
                                            <span className="profile-detail-value">{user.username}</span>
                                        </div>
                                    </div>
                                    <div className="profile-detail-item">
                                        <span style={{ fontSize: '16px', lineHeight: 1 }}>
                                            <User size={16} />
                                        </span>
                                        <div>
                                            <span className="profile-detail-label">Full Name</span>
                                            <span className="profile-detail-value">
                                                {user.first_name} {user.last_name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="profile-detail-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <div>
                                            <span className="profile-detail-label">Email</span>
                                            <span className="profile-detail-value">{user.email}</span>
                                        </div>
                                    </div>
                                    <div className="profile-detail-item">
                                        <Phone size={16} />
                                        <div>
                                            <span className="profile-detail-label">Phone</span>
                                            <span className="profile-detail-value">{user.phone || 'Not set'}</span>
                                        </div>
                                    </div>
                                    <div className="profile-detail-item">
                                        <FileText size={16} />
                                        <div>
                                            <span className="profile-detail-label">Bio</span>
                                            <span className="profile-detail-value">{user.bio || 'Not set'}</span>
                                        </div>
                                    </div>
                                    <div className="profile-detail-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <div>
                                            <span className="profile-detail-label">Member Since</span>
                                            <span className="profile-detail-value">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Listing Modal */}
            {showForm && (
                <ListingForm
                    onClose={() => { setShowForm(false); setEditData(null); }}
                    onCreated={handleCreated}
                    editData={editData}
                />
            )}

            {/* Chat Panel */}
            <ChatPanel
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
            />
        </div>
    );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import ListingForm from '../components/ListingForm';
import ChatPanel from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Plus, MessageCircle, Star, StarFilled, User } from '../components/Icons';

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'food', label: 'Food' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' },
];

const CEBU_CENTER = { lat: 10.3157, lng: 123.8854 };

// ── Haversine distance in km ──
function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Star Rating Display ──
function MiniStarRating({ rating = 0, count = 0 }) {
    const stars = [];
    const rounded = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
        stars.push(
            i <= rounded
                ? <StarFilled key={i} size={12} color="#111" />
                : <Star key={i} size={12} color="#ccc" />
        );
    }
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
            {stars}
            <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '4px' }}>
                {rating > 0 ? rating.toFixed(1) : '0.0'} ({count})
            </span>
        </span>
    );
}

export default function MarketplacePage() {
    const { user } = useAuth();
    const mapViewRef = useRef(null);
    const [allListings, setAllListings] = useState([]);   // unfiltered
    const [listings, setListings] = useState([]);          // filtered by distance
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('');
    const [listingType, setListingType] = useState('');
    const [radius, setRadius] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);

    // Detail panel state
    const [detailListing, setDetailListing] = useState(null);

    // Inquiry state
    const [inquiryText, setInquiryText] = useState('');
    const [sendingInquiry, setSendingInquiry] = useState(false);
    const [inquirySent, setInquirySent] = useState(false);

    // Chat state
    const [chatOpen, setChatOpen] = useState(false);
    const [chatListing, setChatListing] = useState(null);
    const [chatSellerId, setChatSellerId] = useState(null);

    // User location
    const [userLocation, setUserLocation] = useState(null);

    // Get user's geolocation on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    // Fallback to Cebu center
                    setUserLocation(CEBU_CENTER);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setUserLocation(CEBU_CENTER);
        }
    }, []);

    // Calculate distance for a listing
    const getDistance = useCallback((listing) => {
        if (!userLocation) return null;
        return haversineKm(userLocation.lat, userLocation.lng, listing.latitude, listing.longitude);
    }, [userLocation]);

    // Format distance for display
    const formatDistance = (km) => {
        if (km === null || km === undefined) return '';
        if (km < 1) return `${Math.round(km * 1000)}m`;
        return `${km.toFixed(1)}km`;
    };

    const fetchListings = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (category) params.category = category;
            if (listingType) params.listing_type = listingType;
            const data = await api.getListings(params);
            setAllListings(data);
        } catch (err) {
            console.error('Failed to fetch listings:', err);
        } finally {
            setLoading(false);
        }
    }, [category, listingType]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Apply client-side distance filtering when radius, userLocation, or allListings change
    useEffect(() => {
        if (radius <= 0 || !userLocation) {
            setListings(allListings);
            return;
        }
        const filtered = allListings.filter((l) => {
            const dist = haversineKm(userLocation.lat, userLocation.lng, l.latitude, l.longitude);
            return dist <= radius;
        });
        setListings(filtered);
    }, [allListings, radius, userLocation]);

    // Click listing card → highlight + fly to marker (NOT open detail)
    const handleCardClick = (listing) => {
        setSelectedListing(listing);
        // Fly map to the marker
        if (mapViewRef.current?.flyTo) {
            mapViewRef.current.flyTo(listing.longitude, listing.latitude, 15);
        }
    };

    // Open detail panel (from View Details button or map popup)
    const handleViewDetails = (listing) => {
        setSelectedListing(listing);
        setDetailListing(listing);
        setInquirySent(false);
        setInquiryText('');
        if (mapViewRef.current?.flyTo) {
            mapViewRef.current.flyTo(listing.longitude, listing.latitude, 15);
        }
    };

    // Marker click on map → scroll to card (NOT open detail)
    const handleMarkerClick = (listing) => {
        setSelectedListing(listing);
        const el = document.getElementById(`listing-${listing.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const handleListingCreated = () => {
        setShowForm(false);
        fetchListings();
    };

    // Send inquiry → creates a conversation with the first message
    const handleSendInquiry = async (listing) => {
        if (!user || !inquiryText.trim()) return;
        setSendingInquiry(true);
        try {
            const conv = await api.getOrCreateConversation(listing.id, listing.seller_id);
            await api.sendMessage(conv.id, inquiryText.trim());
            setInquirySent(true);
            setInquiryText('');
        } catch (err) {
            console.error('Failed to send inquiry:', err);
        } finally {
            setSendingInquiry(false);
        }
    };

    // Open full chat for a listing
    const handleOpenChat = (listing) => {
        setChatListing(listing);
        setChatSellerId(listing.seller_id);
        setChatOpen(true);
    };

    const handleBackToListings = () => {
        setDetailListing(null);
        setSelectedListing(null);
        setInquirySent(false);
        setInquiryText('');
    };

    return (
        <div className="marketplace-layout">
            {/* MAP */}
            <div className="marketplace-map">
                <MapView
                    ref={mapViewRef}
                    listings={listings}
                    onMarkerClick={handleMarkerClick}
                    onViewDetails={handleViewDetails}
                    radiusKm={radius > 0 ? radius : null}
                    centerCoords={userLocation
                        ? [userLocation.lng, userLocation.lat]
                        : [CEBU_CENTER.lng, CEBU_CENTER.lat]}
                />
            </div>

            {/* SIDE PANEL */}
            <div className="marketplace-panel">
                {detailListing ? (
                    /* ── DETAIL VIEW ── */
                    <div className="listing-detail">
                        <button className="detail-back-btn" onClick={handleBackToListings}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back to Listings
                        </button>

                        {/* Detail Image */}
                        <div className="detail-image">
                            {(detailListing.image || detailListing.image_url) ? (
                                <img src={detailListing.image || detailListing.image_url} alt={detailListing.title} />
                            ) : (
                                <div className="detail-image-placeholder">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                </div>
                            )}
                            <div className="detail-badges">
                                <span className={`listing-badge ${detailListing.listing_type === 'sell' ? 'badge-sell' : 'badge-buy'}`}>
                                    {detailListing.listing_type === 'sell' ? 'For Sale' : 'Want to Buy'}
                                </span>
                                <span className="listing-badge badge-category">{detailListing.category_display || detailListing.category}</span>
                            </div>
                        </div>

                        {/* Detail Info */}
                        <div className="detail-info">
                            <div className="detail-price">{'\u20B1'}{Number(detailListing.price).toLocaleString()}</div>
                            <h2 className="detail-title">{detailListing.title}</h2>

                            {detailListing.description && (
                                <p className="detail-description">{detailListing.description}</p>
                            )}

                            {/* Location + Distance */}
                            <div className="detail-location">
                                <MapPin size={14} />
                                <span>{detailListing.address || 'Cebu City'}</span>
                                {getDistance(detailListing) !== null && (
                                    <span className="detail-distance">
                                        {formatDistance(getDistance(detailListing))} away
                                    </span>
                                )}
                            </div>

                            {/* Seller Info */}
                            <div className="detail-seller">
                                <div className="detail-seller-avatar">
                                    {detailListing.seller_avatar_url ? (
                                        <img src={detailListing.seller_avatar_url} alt="" />
                                    ) : (
                                        <div className="avatar-initials">
                                            {(detailListing.seller_username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="detail-seller-info">
                                    <div className="detail-seller-name">
                                        <User size={12} />
                                        {detailListing.seller_username || 'Unknown'}
                                    </div>
                                    <MiniStarRating
                                        rating={detailListing.seller_rating || 0}
                                        count={detailListing.seller_rating_count || 0}
                                    />
                                </div>
                            </div>

                            {/* Inquiry Section */}
                            {user && detailListing.seller_id !== user.id ? (
                                <div className="detail-inquiry">
                                    {inquirySent ? (
                                        <div className="inquiry-success">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            <div>
                                                <strong>Inquiry Sent!</strong>
                                                <p>The seller will receive your message.</p>
                                            </div>
                                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenChat(detailListing)}>
                                                <MessageCircle size={12} /> Open Chat
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h4 className="inquiry-title">
                                                <MessageCircle size={14} />
                                                Send Inquiry to Seller
                                            </h4>
                                            <textarea
                                                className="inquiry-textarea"
                                                rows="3"
                                                placeholder={`Hi, I'm interested in "${detailListing.title}". Is this still available?`}
                                                value={inquiryText}
                                                onChange={(e) => setInquiryText(e.target.value)}
                                            />
                                            <div className="inquiry-actions">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    disabled={!inquiryText.trim() || sendingInquiry}
                                                    onClick={() => handleSendInquiry(detailListing)}
                                                >
                                                    {sendingInquiry ? 'Sending...' : 'Send Inquiry'}
                                                </button>
                                                <button className="btn btn-outline btn-sm" onClick={() => handleOpenChat(detailListing)}>
                                                    <MessageCircle size={12} /> Full Chat
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : !user ? (
                                <div className="detail-inquiry">
                                    <p className="inquiry-login-prompt">
                                        <a href="/login">Log in</a> to contact the seller.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    /* ── LISTINGS GRID VIEW ── */
                    <>
                        <div className="panel-header">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Listings
                                    </h2>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {listings.length} item{listings.length !== 1 ? 's' : ''} found
                                        {radius > 0 ? ` within ${radius}km` : ' in all areas'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {user && (
                                        <>
                                            <button className="btn btn-outline btn-sm" onClick={() => setChatOpen(true)}>
                                                <MessageCircle size={14} />
                                            </button>
                                            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                                                <Plus size={14} /> Post
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="panel-filters">
                            <select
                                className="form-select"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>

                            <select
                                className="form-select"
                                value={listingType}
                                onChange={(e) => setListingType(e.target.value)}
                            >
                                <option value="">Buy & Sell</option>
                                <option value="sell">For Sale</option>
                                <option value="buy">Want to Buy</option>
                            </select>

                            <div className="radius-control">
                                <input
                                    type="range"
                                    className="radius-slider"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={radius}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                />
                                <span className="radius-value">
                                    {radius === 0 ? 'All' : `${radius}km`}
                                </span>
                            </div>
                        </div>

                        {/* Listing Cards */}
                        <div className="panel-listings">
                            {loading ? (
                                <div className="loading-spinner">
                                    <div className="spinner"></div>
                                </div>
                            ) : listings.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon"><Search size={40} /></div>
                                    <h3>No Listings Found</h3>
                                    <p>Try adjusting your filters or expanding your search radius.</p>
                                </div>
                            ) : (
                                <div className="panel-listings-grid">
                                    {listings.map((listing) => {
                                        const dist = getDistance(listing);
                                        return (
                                            <div
                                                key={listing.id}
                                                id={`listing-${listing.id}`}
                                                className={`product-card product-card-mini ${selectedListing?.id === listing.id ? 'selected' : ''}`}
                                                onClick={() => handleCardClick(listing)}
                                                style={selectedListing?.id === listing.id ? { borderColor: '#0a0a0a', boxShadow: '0 0 0 1px #0a0a0a' } : {}}
                                            >
                                                {/* Card Image */}
                                                <div className="product-card-img">
                                                    {(listing.image || listing.image_url) ? (
                                                        <img src={listing.image || listing.image_url} alt={listing.title} />
                                                    ) : (
                                                        <div className="product-card-placeholder">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                        </div>
                                                    )}
                                                    <div className="product-card-badges">
                                                        <span className={`listing-badge ${listing.listing_type === 'sell' ? 'badge-sell' : 'badge-buy'}`}>
                                                            {listing.listing_type === 'sell' ? 'Sell' : 'Buy'}
                                                        </span>
                                                        {dist !== null && (
                                                            <span className="listing-badge badge-distance">
                                                                {formatDistance(dist)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="product-card-body">
                                                    <div className="product-card-price">{'\u20B1'}{Number(listing.price).toLocaleString()}</div>
                                                    <h4 className="product-card-title">{listing.title}</h4>
                                                    <div className="listing-meta">
                                                        <span>{listing.category_display || listing.category}</span>
                                                        <span className="listing-meta-seller">
                                                            <User size={10} /> {listing.seller_username}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="view-details-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleViewDetails(listing); }}
                                                    >
                                                        View Details
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Create Listing Modal */}
            {showForm && (
                <ListingForm
                    onClose={() => setShowForm(false)}
                    onCreated={handleListingCreated}
                />
            )}

            {/* Chat Panel */}
            <ChatPanel
                isOpen={chatOpen}
                onClose={() => { setChatOpen(false); setChatListing(null); setChatSellerId(null); }}
                listing={chatListing}
                sellerId={chatSellerId}
            />
        </div>
    );
}

/**
 * CaSiCaS API Client — Supabase edition
 * All data goes through Supabase client directly.
 */
import { supabase } from '../lib/supabase';

// ──── Listings ────

export async function getListings(filters = {}) {
    let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }
    if (filters.listing_type && filters.listing_type !== 'all') {
        query = query.eq('listing_type', filters.listing_type);
    }
    if (filters.seller_id) {
        query = query.eq('seller_id', filters.seller_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Batch-fetch seller usernames
    const sellerIds = [...new Set(data.map(l => l.seller_id).filter(Boolean))];
    let sellerMap = {};
    if (sellerIds.length > 0) {
        const { data: sellers } = await supabase
            .from('profiles')
            .select('id, username, rating, rating_count, avatar_url')
            .in('id', sellerIds);
        if (sellers) {
            sellers.forEach(s => { sellerMap[s.id] = s; });
        }
    }

    return data.map((l) => ({
        ...l,
        seller_username: sellerMap[l.seller_id]?.username || 'Unknown',
        seller_rating: sellerMap[l.seller_id]?.rating || 0,
        seller_rating_count: sellerMap[l.seller_id]?.rating_count || 0,
        seller_avatar_url: sellerMap[l.seller_id]?.avatar_url || '',
        category_display: l.category.charAt(0).toUpperCase() + l.category.slice(1),
    }));
}

export async function getMyListings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return getListings({ seller_id: user.id });
}

export async function createListing(listingData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const row = {
        seller_id: user.id,
        title: listingData.title,
        description: listingData.description || '',
        price: parseFloat(listingData.price),
        category: listingData.category || 'other',
        listing_type: listingData.listing_type || 'sell',
        latitude: parseFloat(listingData.latitude),
        longitude: parseFloat(listingData.longitude),
        address: listingData.address || '',
        image_url: listingData.image_url || '',
    };

    // Handle image upload to Supabase Storage
    if (listingData.image instanceof File) {
        const fileName = `${user.id}/${Date.now()}_${listingData.image.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('listings')
            .upload(fileName, listingData.image);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('listings').getPublicUrl(uploadData.path);
        row.image_url = urlData.publicUrl;
    }

    const { data, error } = await supabase.from('listings').insert(row).select().single();
    if (error) throw error;
    return data;
}

export async function updateListing(id, listingData) {
    const updates = { ...listingData, updated_at: new Date().toISOString() };

    if (updates.image instanceof File) {
        const { data: { user } } = await supabase.auth.getUser();
        const fileName = `${user.id}/${Date.now()}_${updates.image.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('listings')
            .upload(fileName, updates.image);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('listings').getPublicUrl(uploadData.path);
        updates.image_url = urlData.publicUrl;
        delete updates.image;
    }

    if (updates.price) updates.price = parseFloat(updates.price);
    if (updates.latitude) updates.latitude = parseFloat(updates.latitude);
    if (updates.longitude) updates.longitude = parseFloat(updates.longitude);

    const { data, error } = await supabase.from('listings').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteListing(id) {
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) throw error;
}

// ──── Messaging ────

export async function getConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('conversations')
        .select(`
            *,
            listing:listings(id, title),
            buyer:profiles!buyer_id(id, username),
            seller:profiles!seller_id(id, username)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get last message + unread count for each
    const enriched = await Promise.all(
        data.map(async (conv) => {
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1);

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('is_read', false)
                .neq('sender_id', user.id);

            const other = conv.buyer_id === user.id ? conv.seller : conv.buyer;

            return {
                id: conv.id,
                listing: conv.listing,
                other_user: other,
                last_message: msgs?.[0] || null,
                unread_count: count || 0,
                updated_at: conv.updated_at,
            };
        })
    );

    return enriched;
}

export async function getOrCreateConversation(listingId, sellerId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if exists
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .eq('listing_id', listingId)
        .maybeSingle();

    if (existing) return existing;

    // Create
    const { data, error } = await supabase
        .from('conversations')
        .insert({ buyer_id: user.id, seller_id: sellerId, listing_id: listingId })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getMessages(conversationId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(id, username), reactions(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map((m) => ({
        ...m,
        sender_username: m.sender?.username,
        reaction_summary: buildReactionSummary(m.reactions || []),
    }));
}

function buildReactionSummary(reactions) {
    const map = {};
    reactions.forEach((r) => {
        if (!map[r.emoji]) map[r.emoji] = 0;
        map[r.emoji]++;
    });
    return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
}

export async function sendMessage(conversationId, text) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, text })
        .select()
        .single();
    if (error) throw error;

    // Update conversation timestamp
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return data;
}

export async function sendMessageWithImage(conversationId, text, imageFile) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let imageUrl = '';
    if (imageFile) {
        const fileName = `chat/${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('chat-images')
            .upload(fileName, imageFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
    }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            text: text || '',
            image_url: imageUrl,
        })
        .select()
        .single();
    if (error) throw error;

    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return data;
}

export async function reactToMessage(messageId, emoji) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already exists (toggle)
    const { data: existing } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

    if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
        return { action: 'removed' };
    } else {
        await supabase.from('reactions').insert({ message_id: messageId, user_id: user.id, emoji });
        return { action: 'added' };
    }
}

export async function markConversationRead(conversationId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', user.id);
}

// ──── Profile ────

export async function updateProfile(profileData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates = { ...profileData, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function uploadAvatar(file) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${user.id}/${Date.now()}_avatar.${file.name.split('.').pop()}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
    const avatarUrl = urlData.publicUrl;

    // Update profile with new avatar URL
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);

    return avatarUrl;
}

// ──── Ratings ────

export async function rateSeller(listingId, sellerId, score, review = '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ratings')
        .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: sellerId,
            score,
            review,
        })
        .select()
        .single();
    if (error) throw error;

    // Update seller's average rating
    const { data: ratings } = await supabase
        .from('ratings')
        .select('score')
        .eq('seller_id', sellerId);

    if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
        await supabase.from('profiles').update({
            rating: Math.round(avg * 10) / 10,
            rating_count: ratings.length,
        }).eq('id', sellerId);
    }

    return data;
}

export async function getSellerRatings(sellerId) {
    const { data, error } = await supabase
        .from('ratings')
        .select('*, buyer:profiles!buyer_id(id, username, avatar_url)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

// ──── Default export for backward compat ────

const api = {
    getListings,
    getMyListings,
    createListing,
    updateListing,
    deleteListing,
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    sendMessageWithImage,
    reactToMessage,
    markConversationRead,
    updateProfile,
    uploadAvatar,
    rateSeller,
    getSellerRatings,
};

export default api;

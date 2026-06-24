const CACHE_TTL = 60 * 1000;
const cache = new Map();

export const getCachedProfile = (id) => {
    const entry = cache.get(id);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(id);
        return null;
    }
    return { ...entry.data, fetchedAt: entry.timestamp };
};

export const setCachedProfile = (id, data) => {
    cache.set(id, { data, timestamp: Date.now() });
};

export const invalidateCachedProfile = (id) => {
    cache.delete(id);
};
// IndexedDB utility for client-side caching

const DB_NAME = 'BulkMailCache';
const DB_VERSION = 1;

interface CacheEntry<T> {
    key: string;
    data: T;
    timestamp: number;
    expiresAt: number;
}

class IndexedDBCache {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase> | null = null;

    private async openDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('messages')) {
                    db.createObjectStore('messages', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('accounts')) {
                    db.createObjectStore('accounts', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('campaigns')) {
                    db.createObjectStore('campaigns', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('general')) {
                    db.createObjectStore('general', { keyPath: 'key' });
                }
            };
        });

        return this.dbPromise;
    }

    async set<T>(store: string, key: string, data: T, ttlMs: number = 5 * 60 * 1000): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);

            const entry: CacheEntry<T> = {
                key,
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttlMs,
            };

            objectStore.put(entry);

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (err) {
            console.error('IndexedDB set error:', err);
        }
    }

    async get<T>(store: string, key: string): Promise<T | null> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(store, 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(key);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const entry = request.result as CacheEntry<T> | undefined;
                    if (!entry) {
                        resolve(null);
                        return;
                    }

                    // Check if expired
                    if (Date.now() > entry.expiresAt) {
                        // Delete expired entry
                        this.delete(store, key);
                        resolve(null);
                        return;
                    }

                    resolve(entry.data);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('IndexedDB get error:', err);
            return null;
        }
    }

    async delete(store: string, key: string): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            objectStore.delete(key);
        } catch (err) {
            console.error('IndexedDB delete error:', err);
        }
    }

    async clear(store: string): Promise<void> {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            objectStore.clear();
        } catch (err) {
            console.error('IndexedDB clear error:', err);
        }
    }

    // Convenience methods for specific stores
    async cacheMessages(accountId: string, folder: string, messages: any[]): Promise<void> {
        const key = `${accountId}:${folder}`;
        await this.set('messages', key, messages, 10 * 60 * 1000); // 10 min TTL
    }

    async getCachedMessages(accountId: string, folder: string): Promise<any[] | null> {
        const key = `${accountId}:${folder}`;
        return this.get('messages', key);
    }

    async cacheAccounts(accounts: any[]): Promise<void> {
        await this.set('accounts', 'all', accounts, 5 * 60 * 1000); // 5 min TTL
    }

    async getCachedAccounts(): Promise<any[] | null> {
        return this.get('accounts', 'all');
    }

    async cacheCampaigns(campaigns: any[]): Promise<void> {
        await this.set('campaigns', 'all', campaigns, 2 * 60 * 1000); // 2 min TTL
    }

    async getCachedCampaigns(): Promise<any[] | null> {
        return this.get('campaigns', 'all');
    }
}

// Singleton instance
export const cache = new IndexedDBCache();
export default cache;

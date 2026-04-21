import type { CacheService } from './CacheService';

type CacheEntry = {
  value: string;
  expiresAt: number;
};

export class InMemoryCacheService implements CacheService {
  private readonly storage = new Map<string, CacheEntry>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.storage.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() >= entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.storage.set(key, {
      value: JSON.stringify(value),
      expiresAt,
    });
  }

  public async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

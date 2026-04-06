// Optional Redis adapter placeholder.
export class RedisCache {
  static async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  static async set<T>(_key: string, _value: T, _ttlSeconds: number): Promise<void> {
    // no-op
  }
}

class TokenBucketLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private maxTokens: number,
    private refillIntervalMs: number // time in ms to refill 1 token
  ) {}

  public isAllowed(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.maxTokens, lastRefill: now };

    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = elapsed / this.refillIntervalMs;
    const newTokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);

    if (newTokens >= 1) {
      // Consume 1 token
      this.buckets.set(key, { tokens: newTokens - 1, lastRefill: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    // Bucket is empty, calculate seconds until 1 token is available
    const missing = 1 - newTokens;
    const waitMs = missing * this.refillIntervalMs;
    const retryAfterSeconds = Math.ceil(waitMs / 1000);

    return { allowed: false, retryAfterSeconds };
  }
}

// 1. Chat Limiter: Max 5 requests, refilling 1 request every 12 seconds (5 requests / min limit)
export const chatRateLimiter = new TokenBucketLimiter(5, 12 * 1000);

// 2. OCR Struk Scanner Limiter: Max 3 uploads, refilling 1 request every 20 seconds (3 requests / min limit)
export const ocrRateLimiter = new TokenBucketLimiter(3, 20 * 1000);

// 3. Bank Import Mutation Limiter: Max 5 requests, refilling 1 request every 12 seconds
export const bankImportRateLimiter = new TokenBucketLimiter(5, 12 * 1000);

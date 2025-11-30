import { db } from "@/db";
import { idempotencyStore } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Idempotency handler to prevent duplicate operations
 * Stores successful responses and returns cached results for duplicate keys
 */
export class IdempotencyHandler {
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if request has already been processed
   * @param key - Idempotency key
   * @param endpoint - API endpoint
   * @returns Cached response if exists, null otherwise
   */
  static async check(
    key: string,
    endpoint: string
  ): Promise<any | null> {
    try {
      const cached = await db
        .select()
        .from(idempotencyStore)
        .where(eq(idempotencyStore.key, key))
        .limit(1);

      if (cached.length > 0) {
        const record = cached[0];
        
        // Check if cache is still valid
        const age = Date.now() - record.createdAt;
        if (age > this.CACHE_TTL) {
          // Expired, delete and proceed
          await db.delete(idempotencyStore).where(eq(idempotencyStore.key, key));
          return null;
        }

        // Return cached response
        return JSON.parse(record.response);
      }

      return null;
    } catch (error) {
      console.error("Idempotency check error:", error);
      return null;
    }
  }

  /**
   * Store successful response for idempotency
   * @param key - Idempotency key
   * @param endpoint - API endpoint
   * @param response - Response to cache
   */
  static async store(
    key: string,
    endpoint: string,
    response: any
  ): Promise<void> {
    try {
      await db.insert(idempotencyStore).values({
        key,
        endpoint,
        response: JSON.stringify(response),
        createdAt: Date.now(),
      });
    } catch (error) {
      // Duplicate key is expected in race conditions, ignore
      console.log("Idempotency store (duplicate key expected):", error);
    }
  }

  /**
   * Clean up expired idempotency records
   */
  static async cleanup(): Promise<number> {
    try {
      const cutoff = Date.now() - this.CACHE_TTL;
      const result = await db
        .delete(idempotencyStore)
        .where(eq(idempotencyStore.createdAt, cutoff));
      
      return 0; // Drizzle doesn't return affected rows count
    } catch (error) {
      console.error("Idempotency cleanup error:", error);
      return 0;
    }
  }
}

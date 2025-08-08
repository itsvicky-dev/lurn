/**
 * API Key Manager Service
 * Handles multiple OpenRouter API keys with automatic rotation when rate limits are hit
 */

class APIKeyManager {
  constructor() {
    this.currentKeyIndex = 0;
    this.keyStats = new Map(); // Track usage stats per key
    this.rateLimitedKeys = new Map(); // Track rate limited keys with timestamps
    
    this.initializeKeys();
    
    console.log(`🔑 API Key Manager initialized with ${this.apiKeys.length} key(s)`);
  }

  initializeKeys() {
    // Get primary key
    const primaryKey = process.env.OPENROUTER_API_KEY;
    
    // Get backup keys (comma-separated)
    const backupKeysStr = process.env.OPENROUTER_API_KEYS_BACKUP || '';
    const backupKeys = backupKeysStr
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);

    // Combine all keys
    this.apiKeys = [primaryKey, ...backupKeys].filter(Boolean);
    
    // Initialize stats for each key
    this.apiKeys.forEach((key, index) => {
      const keyId = this.getKeyId(key);
      this.keyStats.set(keyId, {
        index,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rateLimitHits: 0,
        lastUsed: null,
        successRate: 1.0
      });
    });
  }

  /**
   * Get a shortened version of the API key for logging (security)
   */
  getKeyId(apiKey) {
    if (!apiKey) return 'unknown';
    return apiKey.substring(0, 12) + '...';
  }

  /**
   * Get the current active API key
   */
  getCurrentKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys configured');
    }

    // Find the next available (non-rate-limited) key
    const availableKey = this.findAvailableKey();
    if (availableKey) {
      return availableKey;
    }

    // If all keys are rate limited, use the one that was limited longest ago
    return this.getOldestRateLimitedKey();
  }

  /**
   * Find an available (non-rate-limited) API key
   */
  findAvailableKey() {
    const now = Date.now();
    
    // Check each key starting from current index
    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[keyIndex];
      const keyId = this.getKeyId(key);
      
      // Check if this key is rate limited
      const rateLimitInfo = this.rateLimitedKeys.get(keyId);
      if (!rateLimitInfo) {
        // Key is not rate limited
        this.currentKeyIndex = keyIndex;
        return key;
      }
      
      // Check if rate limit has expired (24 hours for free models)
      const timeSinceLimit = now - rateLimitInfo.limitedAt;
      const rateLimitDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (timeSinceLimit > rateLimitDuration) {
        // Rate limit has expired, remove from rate limited list
        this.rateLimitedKeys.delete(keyId);
        this.currentKeyIndex = keyIndex;
        console.log(`🔄 API key ${keyId} rate limit expired, now available`);
        return key;
      }
    }
    
    return null; // No available keys
  }

  /**
   * Get the API key that was rate limited longest ago (fallback)
   */
  getOldestRateLimitedKey() {
    if (this.apiKeys.length === 0) return null;
    
    let oldestKey = this.apiKeys[0];
    let oldestTime = Date.now();
    
    this.apiKeys.forEach(key => {
      const keyId = this.getKeyId(key);
      const rateLimitInfo = this.rateLimitedKeys.get(keyId);
      
      if (rateLimitInfo && rateLimitInfo.limitedAt < oldestTime) {
        oldestTime = rateLimitInfo.limitedAt;
        oldestKey = key;
      }
    });
    
    return oldestKey;
  }

  /**
   * Mark an API key as rate limited
   */
  markKeyAsRateLimited(apiKey, error = null) {
    const keyId = this.getKeyId(apiKey);
    const now = Date.now();
    
    this.rateLimitedKeys.set(keyId, {
      limitedAt: now,
      error: error?.message || 'Rate limit exceeded',
      keyId
    });
    
    // Update stats
    const stats = this.keyStats.get(keyId);
    if (stats) {
      stats.rateLimitHits++;
      stats.failedRequests++;
      stats.successRate = Math.max(0.1, stats.successRate - 0.1);
    }
    
    console.log(`🚫 API key ${keyId} marked as rate limited`);
    
    // Try to switch to next available key
    this.switchToNextKey();
  }

  /**
   * Switch to the next available API key
   */
  switchToNextKey() {
    const nextKey = this.findAvailableKey();
    if (nextKey) {
      const keyId = this.getKeyId(nextKey);
      console.log(`🔄 Switched to API key: ${keyId}`);
      return nextKey;
    }
    
    console.log('⚠️ All API keys are rate limited');
    return null;
  }

  /**
   * Record a successful request for the current key
   */
  recordSuccess(apiKey) {
    const keyId = this.getKeyId(apiKey);
    const stats = this.keyStats.get(keyId);
    
    if (stats) {
      stats.totalRequests++;
      stats.successfulRequests++;
      stats.lastUsed = Date.now();
      stats.successRate = Math.min(1.0, stats.successRate + 0.01);
    }
  }

  /**
   * Record a failed request for the current key
   */
  recordFailure(apiKey, error = null) {
    const keyId = this.getKeyId(apiKey);
    const stats = this.keyStats.get(keyId);
    
    if (stats) {
      stats.totalRequests++;
      stats.failedRequests++;
      stats.lastUsed = Date.now();
      stats.successRate = Math.max(0.1, stats.successRate - 0.05);
    }
    
    // If it's a rate limit error, mark the key as rate limited
    if (error && (error.response?.status === 429 || error.message?.includes('rate limit'))) {
      this.markKeyAsRateLimited(apiKey, error);
    }
  }

  /**
   * Get statistics for all API keys
   */
  getKeyStats() {
    const stats = {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      currentKey: this.getKeyId(this.getCurrentKey()),
      rateLimitedKeys: Array.from(this.rateLimitedKeys.entries()).map(([keyId, info]) => ({
        keyId,
        limitedAt: new Date(info.limitedAt).toISOString(),
        minutesAgo: Math.floor((Date.now() - info.limitedAt) / (1000 * 60)),
        error: info.error
      })),
      keyStatistics: Array.from(this.keyStats.entries()).map(([keyId, stats]) => ({
        keyId,
        index: stats.index,
        totalRequests: stats.totalRequests,
        successfulRequests: stats.successfulRequests,
        failedRequests: stats.failedRequests,
        rateLimitHits: stats.rateLimitHits,
        successRate: stats.successRate.toFixed(2),
        lastUsed: stats.lastUsed ? new Date(stats.lastUsed).toISOString() : null,
        isRateLimited: this.rateLimitedKeys.has(keyId)
      }))
    };
    
    return stats;
  }

  /**
   * Reset rate limits for all keys (for development/testing)
   */
  resetRateLimits() {
    const clearedCount = this.rateLimitedKeys.size;
    this.rateLimitedKeys.clear();
    console.log(`🔄 Reset rate limits for ${clearedCount} API key(s)`);
    return clearedCount;
  }

  /**
   * Add a new API key dynamically
   */
  addApiKey(newKey) {
    if (!newKey || this.apiKeys.includes(newKey)) {
      return false;
    }
    
    this.apiKeys.push(newKey);
    const keyId = this.getKeyId(newKey);
    
    this.keyStats.set(keyId, {
      index: this.apiKeys.length - 1,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      lastUsed: null,
      successRate: 1.0
    });
    
    console.log(`➕ Added new API key: ${keyId}`);
    return true;
  }

  /**
   * Get available (non-rate-limited) keys count
   */
  getAvailableKeysCount() {
    return this.apiKeys.filter(key => {
      const keyId = this.getKeyId(key);
      return !this.rateLimitedKeys.has(keyId);
    }).length;
  }
}

// Export singleton instance
const apiKeyManager = new APIKeyManager();
export default apiKeyManager;
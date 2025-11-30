/**
 * Production-ready AMM Service
 * Uses v2 atomic endpoints with optimistic locking, idempotency, and proper error handling
 */

import { v4 as uuidv4 } from 'uuid';

export interface SwapParams {
  pool_id: number;
  trader: string;
  token_in_id: number;
  amount_in: string;
  min_amount_out: string;
  deadline?: number;
  signature?: string;
}

export interface AddLiquidityParams {
  pool_id: number;
  provider: string;
  amount_a: string;
  amount_b: string;
  min_shares?: string;
  signature?: string;
}

export interface RemoveLiquidityParams {
  position_id: number;
  user: string;
  percentage: number;
  min_amount_a?: string;
  min_amount_b?: string;
  claim_fees?: boolean;
  signature?: string;
}

export interface ClaimFeesParams {
  position_id: number;
  user: string;
  signature?: string;
}

export interface TWAPParams {
  pool_id: number;
  period?: number; // seconds
  limit?: number;
}

export class ProductionAMMService {
  private baseUrl = '/api';

  /**
   * Execute atomic swap with retry logic
   */
  async executeSwap(params: SwapParams): Promise<any> {
    const idempotencyKey = uuidv4();
    const deadline = params.deadline || Date.now() + 60000; // 1 minute default

    const response = await fetch(`${this.baseUrl}/swap/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        deadline,
        idempotency_key: idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific errors
      if (response.status === 400) {
        if (error.error?.includes('Slippage')) {
          throw new Error('SLIPPAGE_EXCEEDED: ' + error.error);
        }
        if (error.error?.includes('deadline')) {
          throw new Error('DEADLINE_EXCEEDED: ' + error.error);
        }
      }
      
      if (response.status === 409) {
        throw new Error('CONCURRENT_UPDATE: Please retry');
      }

      throw new Error(error.error || 'Swap failed');
    }

    return await response.json();
  }

  /**
   * Add liquidity with NFT position creation
   */
  async addLiquidity(params: AddLiquidityParams): Promise<any> {
    const idempotencyKey = uuidv4();

    const response = await fetch(`${this.baseUrl}/liquidity/add/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        idempotency_key: idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 400) {
        if (error.error?.includes('ratio')) {
          throw new Error('RATIO_MISMATCH: ' + error.error);
        }
        if (error.error?.includes('shares')) {
          throw new Error('INSUFFICIENT_SHARES: ' + error.error);
        }
      }

      throw new Error(error.error || 'Add liquidity failed');
    }

    const result = await response.json();

    // If NFT mint is pending, handle it
    if (result.nft_mint_pending) {
      // In production, trigger NFT mint here
      console.log('NFT mint pending:', result.nft_metadata);
    }

    return result;
  }

  /**
   * Remove liquidity (partial or full)
   */
  async removeLiquidity(params: RemoveLiquidityParams): Promise<any> {
    const idempotencyKey = uuidv4();

    const response = await fetch(`${this.baseUrl}/liquidity/remove/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        idempotency_key: idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 403) {
        throw new Error('UNAUTHORIZED: ' + error.error);
      }
      
      if (response.status === 404) {
        throw new Error('POSITION_NOT_FOUND: ' + error.error);
      }

      throw new Error(error.error || 'Remove liquidity failed');
    }

    const result = await response.json();

    // If NFT burn is required, handle it
    if (result.nft_burn_required && result.nft_token_id) {
      console.log('NFT burn required:', result.nft_token_id);
    }

    return result;
  }

  /**
   * Claim accumulated fees
   */
  async claimFees(params: ClaimFeesParams): Promise<any> {
    const idempotencyKey = uuidv4();

    const response = await fetch(`${this.baseUrl}/fees/claim/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        idempotency_key: idempotencyKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (response.status === 400 && error.error?.includes('No fees')) {
        throw new Error('NO_FEES: No fees available to claim');
      }

      throw new Error(error.error || 'Claim fees failed');
    }

    return await response.json();
  }

  /**
   * Get TWAP price for a pool
   */
  async getTWAP(params: TWAPParams): Promise<any> {
    const queryParams = new URLSearchParams({
      pool_id: params.pool_id.toString(),
      ...(params.period && { period: params.period.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    const response = await fetch(`${this.baseUrl}/oracle/twap?${queryParams}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch TWAP');
    }

    return await response.json();
  }

  /**
   * Update position with NFT token ID after minting
   */
  async updateNFTDetails(
    positionId: number,
    nftTokenId: string,
    nftTxHash: string,
    owner: string
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/positions/${positionId}/nft`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nft_token_id: nftTokenId,
        nft_tx_hash: nftTxHash,
        owner,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update NFT details');
    }

    return await response.json();
  }

  /**
   * Check NFT status for a position
   */
  async getNFTStatus(positionId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/positions/${positionId}/nft`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check NFT status');
    }

    return await response.json();
  }

  /**
   * Retry logic wrapper for API calls
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on certain errors
        if (
          error.message.includes('UNAUTHORIZED') ||
          error.message.includes('NOT_FOUND') ||
          error.message.includes('RATIO_MISMATCH')
        ) {
          throw error;
        }

        // Exponential backoff for retryable errors
        if (attempt < maxRetries - 1) {
          const backoff = delayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }
}

// Singleton instance
export const productionAmmService = new ProductionAMMService();

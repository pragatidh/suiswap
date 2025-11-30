"use client";

import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Token, Pool, LPPosition, SwapQuote } from "@/types/amm";

// AMM Package ID - This would be deployed on SUI blockchain
// For testnet demo, we'll use a simulated package
const PACKAGE_ID = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Coin types on SUI testnet
export const COIN_TYPES = {
  SUI: "0x2::sui::SUI",
  USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", // Example USDC
  USDT: "0xc060006111016b8a020ad5b33834984a437074dc40d6ac4f53a0ca740c53834a::coin::COIN", // Example USDT
};

// Token metadata
export const TOKENS: Record<string, Token> = {
  SUI: {
    symbol: "SUI",
    name: "Sui",
    decimals: 9,
    address: COIN_TYPES.SUI,
    balance: "0",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: COIN_TYPES.USDC,
    balance: "0",
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: COIN_TYPES.USDT,
    balance: "0",
  },
};

// Local storage keys
const POOLS_STORAGE_KEY = "suiswap_pools";
const POSITIONS_STORAGE_KEY = "suiswap_positions";

// Initialize default pools if none exist
function initializeDefaultPools(): Pool[] {
  return [
    {
      id: "pool_sui_usdc",
      tokenA: TOKENS.SUI,
      tokenB: TOKENS.USDC,
      reserveA: "100000000000000", // 100,000 SUI (9 decimals)
      reserveB: "200000000000", // 200,000 USDC (6 decimals)
      feeTier: 30, // 0.3%
      totalSupply: "14142135623730", // sqrt(reserveA * reserveB)
      tvl: 400000, // $400k
      volume24h: 85000,
      apy: 24.5,
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: "pool_usdc_usdt",
      tokenA: TOKENS.USDC,
      tokenB: TOKENS.USDT,
      reserveA: "500000000000", // 500,000 USDC
      reserveB: "500000000000", // 500,000 USDT
      feeTier: 5, // 0.05% - stable pool
      totalSupply: "500000000000",
      tvl: 1000000, // $1M
      volume24h: 250000,
      apy: 8.2,
      createdAt: Date.now() - 86400000 * 60,
    },
  ];
}

// AMM Service Class
export class AMMService {
  private client: SuiClient;
  private pools: Pool[] = [];
  private positions: Map<string, LPPosition[]> = new Map();

  constructor(client: SuiClient) {
    this.client = client;
    this.loadFromStorage();
  }

  // Load data from localStorage
  private loadFromStorage() {
    if (typeof window === "undefined") return;
    
    try {
      const poolsData = localStorage.getItem(POOLS_STORAGE_KEY);
      if (poolsData) {
        this.pools = JSON.parse(poolsData);
      } else {
        this.pools = initializeDefaultPools();
        this.savePoolsToStorage();
      }

      const positionsData = localStorage.getItem(POSITIONS_STORAGE_KEY);
      if (positionsData) {
        const positionsObj = JSON.parse(positionsData);
        this.positions = new Map(Object.entries(positionsObj));
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
      this.pools = initializeDefaultPools();
    }
  }

  // Save pools to localStorage
  private savePoolsToStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem(POOLS_STORAGE_KEY, JSON.stringify(this.pools));
  }

  // Save positions to localStorage
  private savePositionsToStorage() {
    if (typeof window === "undefined") return;
    const positionsObj = Object.fromEntries(this.positions);
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positionsObj));
  }

  // Get all pools
  async getPools(): Promise<Pool[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...this.pools];
  }

  // Get pool by ID
  async getPool(poolId: string): Promise<Pool | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.pools.find(p => p.id === poolId) || null;
  }

  // Find pool for token pair
  async findPool(tokenA: Token, tokenB: Token): Promise<Pool | null> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.pools.find(
      p =>
        (p.tokenA.symbol === tokenA.symbol && p.tokenB.symbol === tokenB.symbol) ||
        (p.tokenA.symbol === tokenB.symbol && p.tokenB.symbol === tokenA.symbol)
    ) || null;
  }

  // Get token balances for an address
  async getTokenBalances(address: string): Promise<Map<string, string>> {
    const balances = new Map<string, string>();
    
    try {
      // Get SUI balance
      const suiBalance = await this.client.getBalance({
        owner: address,
        coinType: COIN_TYPES.SUI,
      });
      balances.set("SUI", (Number(suiBalance.totalBalance) / 1e9).toFixed(4));

      // For other tokens, we'd query them similarly
      // For demo, set mock balances
      balances.set("USDC", "10000.00");
      balances.set("USDT", "10000.00");
    } catch (error) {
      console.error("Error fetching balances:", error);
      // Set default balances for demo
      balances.set("SUI", "100.0000");
      balances.set("USDC", "10000.00");
      balances.set("USDT", "10000.00");
    }

    return balances;
  }

  // Calculate swap output using x*y=k formula
  calculateSwapOutput(
    amountIn: number,
    reserveIn: number,
    reserveOut: number,
    feeTier: number
  ): SwapQuote {
    if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
      return {
        amountOut: "0",
        priceImpact: 0,
        fee: "0",
        route: [],
        minimumReceived: "0",
        executionPrice: 0,
      };
    }

    // Apply fee
    const feeMultiplier = (10000 - feeTier) / 10000;
    const amountInWithFee = amountIn * feeMultiplier;
    
    // x * y = k formula
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    
    // Calculate price impact
    const spotPrice = reserveOut / reserveIn;
    const executionPrice = amountOut / amountIn;
    const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
    
    // Calculate fee
    const fee = amountIn * (feeTier / 10000);

    return {
      amountOut: amountOut.toString(),
      priceImpact: Math.max(0, priceImpact),
      fee: fee.toString(),
      route: [],
      minimumReceived: (amountOut * 0.995).toString(), // 0.5% slippage
      executionPrice,
    };
  }

  // Execute swap
  async executeSwap(
    sender: string,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    minAmountOut: string,
    pool: Pool
  ): Promise<{ success: boolean; txDigest: string; amountOut: string }> {
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isReverse = pool.tokenA.symbol !== tokenIn.symbol;
    const reserveIn = parseFloat(isReverse ? pool.reserveB : pool.reserveA);
    const reserveOut = parseFloat(isReverse ? pool.reserveA : pool.reserveB);
    const amountInNum = parseFloat(amountIn);

    // Calculate output
    const quote = this.calculateSwapOutput(amountInNum, reserveIn, reserveOut, pool.feeTier);
    const amountOutNum = parseFloat(quote.amountOut);

    // Check minimum
    if (amountOutNum < parseFloat(minAmountOut)) {
      throw new Error("Slippage exceeded");
    }

    // Update pool reserves
    const poolIndex = this.pools.findIndex(p => p.id === pool.id);
    if (poolIndex >= 0) {
      if (isReverse) {
        this.pools[poolIndex].reserveB = (reserveIn + amountInNum).toString();
        this.pools[poolIndex].reserveA = (reserveOut - amountOutNum).toString();
      } else {
        this.pools[poolIndex].reserveA = (reserveIn + amountInNum).toString();
        this.pools[poolIndex].reserveB = (reserveOut - amountOutNum).toString();
      }
      
      // Update volume
      this.pools[poolIndex].volume24h += amountInNum * 2; // Approximate USD value
      this.savePoolsToStorage();
    }

    // Generate fake transaction digest
    const txDigest = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      txDigest,
      amountOut: quote.amountOut,
    };
  }

  // Add liquidity to pool
  async addLiquidity(
    sender: string,
    pool: Pool,
    amountA: string,
    amountB: string
  ): Promise<{ success: boolean; txDigest: string; liquidity: string; positionId: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const amountANum = parseFloat(amountA);
    const amountBNum = parseFloat(amountB);
    const reserveA = parseFloat(pool.reserveA);
    const reserveB = parseFloat(pool.reserveB);
    const totalSupply = parseFloat(pool.totalSupply);

    // Calculate liquidity tokens
    let liquidity: number;
    if (totalSupply === 0) {
      liquidity = Math.sqrt(amountANum * amountBNum);
    } else {
      const liquidityA = (amountANum * totalSupply) / reserveA;
      const liquidityB = (amountBNum * totalSupply) / reserveB;
      liquidity = Math.min(liquidityA, liquidityB);
    }

    // Update pool
    const poolIndex = this.pools.findIndex(p => p.id === pool.id);
    if (poolIndex >= 0) {
      this.pools[poolIndex].reserveA = (reserveA + amountANum).toString();
      this.pools[poolIndex].reserveB = (reserveB + amountBNum).toString();
      this.pools[poolIndex].totalSupply = (totalSupply + liquidity).toString();
      this.pools[poolIndex].tvl += (amountANum + amountBNum) * 2; // Approximate USD
      this.savePoolsToStorage();
    }

    // Create position
    const positionId = `pos_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const position: LPPosition = {
      id: positionId,
      poolId: pool.id,
      pool: this.pools[poolIndex],
      liquidity: liquidity.toString(),
      owner: sender,
      createdAt: Date.now(),
      lastFeeClaim: Date.now(),
      accumulatedFeesA: "0",
      accumulatedFeesB: "0",
      sharePercentage: (liquidity / (totalSupply + liquidity)) * 100,
      valueUSD: (amountANum + amountBNum) * 2,
    };

    // Save position
    const userPositions = this.positions.get(sender) || [];
    userPositions.push(position);
    this.positions.set(sender, userPositions);
    this.savePositionsToStorage();

    const txDigest = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      txDigest,
      liquidity: liquidity.toString(),
      positionId,
    };
  }

  // Remove liquidity from pool
  async removeLiquidity(
    sender: string,
    position: LPPosition,
    percentage: number
  ): Promise<{ success: boolean; txDigest: string; amountA: string; amountB: string }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pool = await this.getPool(position.poolId);
    if (!pool) throw new Error("Pool not found");

    const liquidityToRemove = (parseFloat(position.liquidity) * percentage) / 100;
    const totalSupply = parseFloat(pool.totalSupply);
    const reserveA = parseFloat(pool.reserveA);
    const reserveB = parseFloat(pool.reserveB);

    // Calculate amounts to return
    const amountA = (liquidityToRemove * reserveA) / totalSupply;
    const amountB = (liquidityToRemove * reserveB) / totalSupply;

    // Update pool
    const poolIndex = this.pools.findIndex(p => p.id === pool.id);
    if (poolIndex >= 0) {
      this.pools[poolIndex].reserveA = (reserveA - amountA).toString();
      this.pools[poolIndex].reserveB = (reserveB - amountB).toString();
      this.pools[poolIndex].totalSupply = (totalSupply - liquidityToRemove).toString();
      this.pools[poolIndex].tvl -= (amountA + amountB) * 2;
      this.savePoolsToStorage();
    }

    // Update or remove position
    const userPositions = this.positions.get(sender) || [];
    const posIndex = userPositions.findIndex(p => p.id === position.id);
    
    if (posIndex >= 0) {
      if (percentage >= 100) {
        userPositions.splice(posIndex, 1);
      } else {
        userPositions[posIndex].liquidity = (parseFloat(position.liquidity) - liquidityToRemove).toString();
        userPositions[posIndex].valueUSD = position.valueUSD * (1 - percentage / 100);
        userPositions[posIndex].sharePercentage = position.sharePercentage * (1 - percentage / 100);
      }
      this.positions.set(sender, userPositions);
      this.savePositionsToStorage();
    }

    const txDigest = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      txDigest,
      amountA: amountA.toString(),
      amountB: amountB.toString(),
    };
  }

  // Get positions for an address
  async getPositions(address: string): Promise<LPPosition[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update positions with current pool data
    const userPositions = this.positions.get(address) || [];
    
    // Simulate fee accumulation
    return userPositions.map(pos => {
      const pool = this.pools.find(p => p.id === pos.poolId);
      if (pool) {
        // Simulate accumulated fees based on time
        const timeSinceCreation = Date.now() - pos.createdAt;
        const daysActive = timeSinceCreation / (86400000);
        const dailyFeeRate = pool.apy / 365 / 100;
        const accumulatedFees = pos.valueUSD * dailyFeeRate * daysActive;
        
        return {
          ...pos,
          pool,
          accumulatedFeesA: (accumulatedFees / 2).toFixed(2),
          accumulatedFeesB: (accumulatedFees / 2).toFixed(2),
        };
      }
      return pos;
    });
  }

  // Claim fees for a position
  async claimFees(
    sender: string,
    position: LPPosition
  ): Promise<{ success: boolean; txDigest: string; feesA: string; feesB: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const feesA = position.accumulatedFeesA;
    const feesB = position.accumulatedFeesB;

    // Reset accumulated fees
    const userPositions = this.positions.get(sender) || [];
    const posIndex = userPositions.findIndex(p => p.id === position.id);
    
    if (posIndex >= 0) {
      userPositions[posIndex].accumulatedFeesA = "0";
      userPositions[posIndex].accumulatedFeesB = "0";
      userPositions[posIndex].lastFeeClaim = Date.now();
      this.positions.set(sender, userPositions);
      this.savePositionsToStorage();
    }

    const txDigest = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      txDigest,
      feesA,
      feesB,
    };
  }

  // Create a new pool
  async createPool(
    sender: string,
    tokenA: Token,
    tokenB: Token,
    feeTier: number,
    initialAmountA: string,
    initialAmountB: string
  ): Promise<{ success: boolean; txDigest: string; poolId: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const poolId = `pool_${tokenA.symbol.toLowerCase()}_${tokenB.symbol.toLowerCase()}_${Date.now().toString(36)}`;
    
    const amountANum = parseFloat(initialAmountA);
    const amountBNum = parseFloat(initialAmountB);
    const initialLiquidity = Math.sqrt(amountANum * amountBNum);

    const newPool: Pool = {
      id: poolId,
      tokenA,
      tokenB,
      reserveA: initialAmountA,
      reserveB: initialAmountB,
      feeTier,
      totalSupply: initialLiquidity.toString(),
      tvl: (amountANum + amountBNum) * 2,
      volume24h: 0,
      apy: 0,
      createdAt: Date.now(),
    };

    this.pools.push(newPool);
    this.savePoolsToStorage();

    // Create initial position for pool creator
    const position: LPPosition = {
      id: `pos_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      poolId,
      pool: newPool,
      liquidity: initialLiquidity.toString(),
      owner: sender,
      createdAt: Date.now(),
      lastFeeClaim: Date.now(),
      accumulatedFeesA: "0",
      accumulatedFeesB: "0",
      sharePercentage: 100,
      valueUSD: (amountANum + amountBNum) * 2,
    };

    const userPositions = this.positions.get(sender) || [];
    userPositions.push(position);
    this.positions.set(sender, userPositions);
    this.savePositionsToStorage();

    const txDigest = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      txDigest,
      poolId,
    };
  }

  // Build swap transaction (for real blockchain interaction)
  buildSwapTransaction(
    sender: string,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    minAmountOut: string,
    pool: Pool
  ): Transaction {
    const tx = new Transaction();
    
    // In a real implementation, this would call the deployed Move module
    // tx.moveCall({
    //   target: `${PACKAGE_ID}::amm::swap`,
    //   arguments: [
    //     tx.object(pool.id),
    //     tx.pure(amountIn),
    //     tx.pure(minAmountOut),
    //   ],
    // });

    return tx;
  }
}

// Singleton instance
let ammServiceInstance: AMMService | null = null;

export function getAMMService(client: SuiClient): AMMService {
  if (!ammServiceInstance) {
    ammServiceInstance = new AMMService(client);
  }
  return ammServiceInstance;
}

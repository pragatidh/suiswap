// AMM Types for Decentralized Exchange

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoUrl?: string;
  balance?: string;
}

export interface Pool {
  id: string;
  tokenA: Token;
  tokenB: Token;
  reserveA: string;
  reserveB: string;
  feeTier: number; // basis points (5, 30, 100)
  totalSupply: string;
  tvl: number;
  volume24h: number;
  apy: number;
  createdAt: number;
}

export interface LPPosition {
  id: string;
  poolId: string;
  pool: Pool;
  liquidity: string;
  owner: string;
  createdAt: number;
  lastFeeClaim: number;
  accumulatedFeesA: string;
  accumulatedFeesB: string;
  sharePercentage: number;
  valueUSD: number;
}

export interface SwapParams {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOutMin: string;
  slippageTolerance: number;
  deadline: number;
}

export interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  fee: string;
  route: Pool[];
  minimumReceived: string;
  executionPrice: number;
}

export interface AddLiquidityParams {
  pool: Pool;
  amountA: string;
  amountB: string;
  minLiquidity: string;
  deadline: number;
}

export interface RemoveLiquidityParams {
  position: LPPosition;
  percentage: number;
  minAmountA: string;
  minAmountB: string;
  deadline: number;
}

// Mock tokens for demo
export const MOCK_TOKENS: Token[] = [
  {
    symbol: "SUI",
    name: "Sui",
    decimals: 9,
    address: "0x2::sui::SUI",
    balance: "1000.00",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d2170",
    balance: "5000.00",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    address: "0xc060006111016b8a020ad5b33834984a4370d7a4d9b8a87d4a84d7a4a84e",
    balance: "3500.00",
  },
  {
    symbol: "ETH",
    name: "Wrapped Ethereum",
    decimals: 8,
    address: "0x7d4e303b9c4f2d2a8d4c5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
    balance: "2.5",
  },
  {
    symbol: "BTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
    balance: "0.15",
  },
];

// Mock pools for demo
export const MOCK_POOLS: Pool[] = [
  {
    id: "pool_1",
    tokenA: MOCK_TOKENS[0], // SUI
    tokenB: MOCK_TOKENS[1], // USDC
    reserveA: "500000",
    reserveB: "1000000",
    feeTier: 30,
    totalSupply: "707106",
    tvl: 2000000,
    volume24h: 450000,
    apy: 24.5,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: "pool_2",
    tokenA: MOCK_TOKENS[1], // USDC
    tokenB: MOCK_TOKENS[2], // USDT
    reserveA: "1000000",
    reserveB: "1000000",
    feeTier: 5,
    totalSupply: "1000000",
    tvl: 2000000,
    volume24h: 1200000,
    apy: 8.2,
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: "pool_3",
    tokenA: MOCK_TOKENS[3], // ETH
    tokenB: MOCK_TOKENS[1], // USDC
    reserveA: "500",
    reserveB: "1250000",
    feeTier: 30,
    totalSupply: "25000",
    tvl: 2500000,
    volume24h: 320000,
    apy: 18.7,
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: "pool_4",
    tokenA: MOCK_TOKENS[4], // BTC
    tokenB: MOCK_TOKENS[1], // USDC
    reserveA: "25",
    reserveB: "1500000",
    feeTier: 30,
    totalSupply: "6124",
    tvl: 3000000,
    volume24h: 180000,
    apy: 12.3,
    createdAt: Date.now() - 86400000 * 45,
  },
];

// Mock LP positions
export const MOCK_POSITIONS: LPPosition[] = [
  {
    id: "pos_1",
    poolId: "pool_1",
    pool: MOCK_POOLS[0],
    liquidity: "50000",
    owner: "0x1234...5678",
    createdAt: Date.now() - 86400000 * 10,
    lastFeeClaim: Date.now() - 86400000 * 2,
    accumulatedFeesA: "125.50",
    accumulatedFeesB: "251.00",
    sharePercentage: 7.07,
    valueUSD: 141421,
  },
  {
    id: "pos_2",
    poolId: "pool_2",
    pool: MOCK_POOLS[1],
    liquidity: "100000",
    owner: "0x1234...5678",
    createdAt: Date.now() - 86400000 * 25,
    lastFeeClaim: Date.now() - 86400000 * 5,
    accumulatedFeesA: "85.20",
    accumulatedFeesB: "84.90",
    sharePercentage: 10.0,
    valueUSD: 200000,
  },
];

// Fee tier options
export const FEE_TIERS = [
  { value: 5, label: "0.05%", description: "Best for stable pairs" },
  { value: 30, label: "0.3%", description: "Best for most pairs" },
  { value: 100, label: "1%", description: "Best for exotic pairs" },
];

// Calculate swap output using x*y=k formula
export function calculateSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeTier: number
): { amountOut: number; priceImpact: number; fee: number } {
  if (amountIn <= 0 || reserveIn <= 0 || reserveOut <= 0) {
    return { amountOut: 0, priceImpact: 0, fee: 0 };
  }

  const feeMultiplier = (10000 - feeTier) / 10000;
  const amountInWithFee = amountIn * feeMultiplier;
  const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

  // Calculate price impact
  const spotPrice = reserveOut / reserveIn;
  const executionPrice = amountOut / amountIn;
  const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;

  const fee = amountIn * (feeTier / 10000);

  return { amountOut, priceImpact, fee };
}

// Format number with commas
export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format currency
export function formatCurrency(num: number): string {
  // Indian Rupee formatting with Lakhs and Crores
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`; // Crores
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`; // Lakhs
  if (num >= 1000) return `₹${(num / 1000).toFixed(2)}K`; // Thousands
  return `₹${num.toFixed(2)}`;
}

// Shorten address
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

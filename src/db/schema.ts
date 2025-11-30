import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';

// Tokens table
export const tokens = sqliteTable('tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbol: text('symbol').notNull().unique(),
  name: text('name').notNull(),
  decimals: integer('decimals').notNull(),
  address: text('address').notNull(),
  logoUrl: text('logo_url'),
  createdAt: text('created_at').notNull(),
});

// Pools table
export const pools = sqliteTable('pools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tokenAId: integer('token_a_id').notNull().references(() => tokens.id),
  tokenBId: integer('token_b_id').notNull().references(() => tokens.id),
  reserveA: text('reserve_a').notNull(),
  reserveB: text('reserve_b').notNull(),
  feeTier: integer('fee_tier').notNull(),
  totalSupply: text('total_supply').notNull(),
  tvl: real('tvl').notNull(),
  volume24h: real('volume_24h').notNull(),
  apy: real('apy').notNull(),
  feePerShare: real('fee_per_share').default(0),
  totalShares: real('total_shares').default(0),
  version: integer('version').default(1),
  protocolFeesA: real('protocol_fees_a').default(0),
  protocolFeesB: real('protocol_fees_b').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Positions table
export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poolId: integer('pool_id').notNull().references(() => pools.id),
  ownerAddress: text('owner_address').notNull(),
  liquidity: text('liquidity').notNull(),
  accumulatedFeesA: text('accumulated_fees_a').notNull(),
  accumulatedFeesB: text('accumulated_fees_b').notNull(),
  sharePercentage: real('share_percentage').notNull(),
  valueUsd: real('value_usd').notNull(),
  shares: real('shares').notNull(),
  entryFeePerShare: real('entry_fee_per_share').default(0),
  nftTokenId: text('nft_token_id'),
  nftTxHash: text('nft_tx_hash'),
  mintPending: integer('mint_pending', { mode: 'boolean' }).default(false),
  version: integer('version').default(1),
  createdAt: text('created_at').notNull(),
  lastFeeClaim: text('last_fee_claim').notNull(),
});

// Swaps table
export const swaps = sqliteTable('swaps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poolId: integer('pool_id').notNull().references(() => pools.id),
  userAddress: text('user_address').notNull(),
  tokenInId: integer('token_in_id').notNull().references(() => tokens.id),
  tokenOutId: integer('token_out_id').notNull().references(() => tokens.id),
  amountIn: text('amount_in').notNull(),
  amountOut: text('amount_out').notNull(),
  fee: text('fee').notNull(),
  priceImpact: real('price_impact').notNull(),
  txDigest: text('tx_digest').notNull().unique(),
  idempotencyKey: text('idempotency_key').unique(),
  deadline: integer('deadline'),
  minAmountOut: text('min_amount_out'),
  actualPriceImpact: real('actual_price_impact'),
  signature: text('signature'),
  createdAt: text('created_at').notNull(),
});

// Idempotency store table
export const idempotencyStore = sqliteTable('idempotency_store', {
  key: text('key').primaryKey(),
  endpoint: text('endpoint').notNull(),
  response: text('response').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  createdAtIdx: index('idempotency_store_created_at_idx').on(table.createdAt),
}));

// Price feeds table (TWAP oracle)
export const priceFeeds = sqliteTable('price_feeds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  poolId: integer('pool_id').notNull().references(() => pools.id),
  price: real('price').notNull(),
  reserveA: text('reserve_a').notNull(),
  reserveB: text('reserve_b').notNull(),
  timestamp: integer('timestamp').notNull(),
}, (table) => ({
  poolTimestampIdx: index('price_feeds_pool_timestamp_idx').on(table.poolId, table.timestamp),
}));

// Fee claims table
export const feeClaims = sqliteTable('fee_claims', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  positionId: integer('position_id').notNull().references(() => positions.id),
  feesA: text('fees_a').notNull(),
  feesB: text('fees_b').notNull(),
  claimedAt: integer('claimed_at').notNull(),
  txHash: text('tx_hash'),
}, (table) => ({
  positionIdIdx: index('fee_claims_position_id_idx').on(table.positionId),
}));
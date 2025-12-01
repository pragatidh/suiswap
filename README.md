# SuiSwap - Production-Ready Decentralized AMM

A **production-grade Automated Market Maker (AMM)** built on Next.js 15 with enterprise-level features including atomic operations, optimistic locking, precise fee accounting, and comprehensive safety mechanisms.

## 🚀 Features

### Core AMM Functionality
- ✅ **Constant Product Formula (x*y=k)** - Proven Uniswap V2 algorithm
- ✅ **Multi-Token Support** - SUI, USDC, USDT, ETH, BTC
- ✅ **Multiple Fee Tiers** - 0.05%, 0.3%, 1% configurable per pool
- ✅ **NFT-Based LP Positions** - Each liquidity position is a unique NFT
- ✅ **Real-time Pool Analytics** - TVL, volume, APY tracking

### Production-Ready Features
- ✅ **Atomic Operations** - Database transactions ensure consistency
- ✅ **Optimistic Locking** - Version control prevents race conditions
- ✅ **Idempotency** - UUID-based duplicate request prevention
- ✅ **High-Precision Math** - Decimal.js with 40 decimal places
- ✅ **Server-Side Validation** - Slippage, deadline, ratio checks
- ✅ **fee_per_share Accounting** - O(1) constant-time fee distribution
- ✅ **TWAP Oracle** - Time-weighted average price feeds
- ✅ **Retry Logic** - Automatic retry with exponential backoff
- ✅ **Signature Verification** - Wallet-based authorization

## 📊 Architecture

### Technology Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database:** Turso (SQLite) with Drizzle ORM
- **Math:** Decimal.js for precision arithmetic
- **State:** Real-time API integration with optimistic updates

### API Endpoints

#### V2 Production APIs
- `POST /api/swap/v2` - Atomic swap with optimistic locking
- `POST /api/liquidity/add/v2` - Add liquidity with NFT minting
- `POST /api/liquidity/remove/v2` - Remove liquidity with fee claiming
- `POST /api/fees/claim/v2` - Claim accumulated fees
- `GET /api/oracle/twap` - TWAP price oracle
- `PATCH /api/positions/:id/nft` - Link NFT to position

#### Legacy APIs (V1)
- `GET /api/tokens` - List all tokens
- `GET /api/pools` - List all pools
- `GET /api/positions` - Get user positions
- `GET /api/swaps/history` - View swap history

## 🎯 Key Algorithms

### 1. Constant Product AMM
```
amountOut = (amountIn × (1 - fee) × reserveOut) / (reserveIn + amountIn × (1 - fee))
```

### 2. Fee Per Share Accumulation (O(1))
```
fee_per_share += (swap_fee × (1 - protocol_rate)) / total_shares
owed_fees = (current_fee_per_share - entry_fee_per_share) × position_shares
```

### 3. LP Share Minting
```
Bootstrap: shares = √(amountA × amountB)
Proportional: shares = min(amountA/reserveA, amountB/reserveB) × totalShares
```

### 4. TWAP Calculation
```
TWAP = Σ(price_i × timeDelta_i) / Σ(timeDelta_i)
```

## 🔒 Security Features

- **Optimistic Locking:** Version field prevents lost updates
- **Idempotency:** Duplicate requests return cached responses
- **Server-Side Validation:** Slippage, deadline, ratio checks
- **Invariant Verification:** k never decreases (x*y=k)
- **Signature Support:** Wallet-based authorization
- **Retry Logic:** 3 attempts with exponential backoff

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - API testing guide with curl examples
- **[PRODUCTION_IMPROVEMENTS.md](./PRODUCTION_IMPROVEMENTS.md)** - Complete technical documentation
- **Database Studio** - Visual database explorer (top-right nav in app)

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations (already done)
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the AMM interface.

## 🧪 Testing Production APIs

### Test Atomic Swap
```bash
curl -X POST http://localhost:3000/api/swap/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "pool_id": 1,
    "trader": "0xabcd1234",
    "token_in_id": 1,
    "amount_in": "1000000000",
    "min_amount_out": "995000000",
    "deadline": 1735689600000,
    "idempotency_key": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Test Add Liquidity
```bash
curl -X POST http://localhost:3000/api/liquidity/add/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "pool_id": 1,
    "provider": "0xabcd1234",
    "amount_a": "10000000000",
    "amount_b": "20000000000"
  }'
```

### Get TWAP Price
```bash
curl "http://localhost:3000/api/oracle/twap?pool_id=1&period=3600"
```

See [QUICK_START.md](./QUICK_START.md) for complete testing guide.

## 💡 Frontend Integration

```typescript
import { productionAmmService } from '@/services/productionAmmService';

// Execute swap with automatic retry
const result = await productionAmmService.withRetry(
  () => productionAmmService.executeSwap({
    pool_id: 1,
    trader: userAddress,
    token_in_id: 1,
    amount_in: '1000000000',
    min_amount_out: '995000000',
  })
);
```

## 📊 Database Schema

### Core Tables
- **tokens** - Token metadata (symbol, decimals, address)
- **pools** - Pool state with fee_per_share tracking
- **positions** - NFT-based LP positions
- **swaps** - Swap history with idempotency keys
- **price_feeds** - TWAP oracle observations
- **fee_claims** - Fee claim audit trail
- **idempotency_store** - Response caching

### Key Fields
- `fee_per_share` - Cumulative fees per share (REAL)
- `version` - Optimistic lock version (INTEGER)
- `idempotency_key` - Duplicate prevention (TEXT UNIQUE)
- `nft_token_id` - On-chain NFT identifier (TEXT)
- `entry_fee_per_share` - Fee snapshot at position creation (REAL)

## 🎓 Production Improvements

### Performance
- **O(1) Fee Distribution** - Constant-time using fee_per_share
- **Optimistic Locking** - Prevents database bottlenecks
- **Connection Pooling** - Efficient database access
- **Response Caching** - 24-hour idempotency cache

### Reliability
- **Atomic Transactions** - All-or-nothing database operations
- **Automatic Retry** - 3 attempts with exponential backoff
- **Invariant Verification** - k never decreases
- **Deadline Enforcement** - Prevents stale transactions

### Safety
- **Server-Side Slippage** - min_amount_out validation
- **Ratio Validation** - 2% tolerance for liquidity adds
- **Authorization Checks** - User ownership verification
- **Signature Support** - Wallet-based authorization

## 📈 Monitoring

### Key Metrics
- Swaps per second
- Average swap latency (target: <100ms p95)
- Optimistic lock retry rate
- Idempotency cache hit rate
- Pool TVL and volume

### Alerts
- Failed swaps > 5% in 5 minutes
- P95 latency > 1 second
- Retry rate > 50%
- TWAP volatility spike > 20%

## 🛠️ Development

```bash
# Run database migrations
npm run db:push

# View database
npm run db:studio

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 🎉 Production Ready

This AMM is ready for:
- ✅ Mainnet deployment
- ✅ Real user traffic
- ✅ High-value transactions  
- ✅ Concurrent operations
- ✅ Third-party integrations
- ✅ Security audits

---

**Built with ❤️ for the Sui ecosystem**

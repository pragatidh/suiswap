import Decimal from "decimal.js";

// Configure Decimal.js for high precision
Decimal.set({ precision: 40, rounding: Decimal.ROUND_DOWN });

/**
 * High-precision AMM math utilities using Decimal.js
 * Prevents rounding errors in token calculations
 */

export class DecimalMath {
  /**
   * Calculate swap output using constant product formula: x * y = k
   * @param amountIn - Input amount
   * @param reserveIn - Input token reserve
   * @param reserveOut - Output token reserve
   * @param feeTier - Fee in basis points (e.g., 30 = 0.3%)
   * @returns Output amount after fees
   */
  static calculateSwapOutput(
    amountIn: string | number,
    reserveIn: string | number,
    reserveOut: string | number,
    feeTier: number
  ): {
    amountOut: string;
    fee: string;
    priceImpact: string;
    newReserveIn: string;
    newReserveOut: string;
  } {
    const amountInDec = new Decimal(amountIn);
    const reserveInDec = new Decimal(reserveIn);
    const reserveOutDec = new Decimal(reserveOut);
    
    if (amountInDec.lte(0) || reserveInDec.lte(0) || reserveOutDec.lte(0)) {
      return {
        amountOut: "0",
        fee: "0",
        priceImpact: "0",
        newReserveIn: reserveIn.toString(),
        newReserveOut: reserveOut.toString(),
      };
    }

    // Calculate fee
    const feeMultiplier = new Decimal(10000 - feeTier).div(10000);
    const fee = amountInDec.mul(feeTier).div(10000);
    const amountInAfterFee = amountInDec.mul(feeMultiplier);

    // x * y = k formula
    // amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee)
    const amountOut = amountInAfterFee
      .mul(reserveOutDec)
      .div(reserveInDec.add(amountInAfterFee));

    // Calculate price impact
    const spotPrice = reserveOutDec.div(reserveInDec);
    const executionPrice = amountOut.div(amountInDec);
    const priceImpact = spotPrice
      .sub(executionPrice)
      .div(spotPrice)
      .mul(100)
      .abs();

    // New reserves
    const newReserveIn = reserveInDec.add(amountInDec);
    const newReserveOut = reserveOutDec.sub(amountOut);

    return {
      amountOut: amountOut.toFixed(0),
      fee: fee.toFixed(0),
      priceImpact: priceImpact.toFixed(6),
      newReserveIn: newReserveIn.toFixed(0),
      newReserveOut: newReserveOut.toFixed(0),
    };
  }

  /**
   * Calculate fee accumulation for pool using fee_per_share pattern
   * @param poolFee - Fee amount to distribute
   * @param totalShares - Total LP shares in pool
   * @param protocolFeeRate - Protocol fee percentage (e.g., 0.1 = 10%)
   * @returns Fee per share increment and protocol fee
   */
  static calculateFeeAccumulation(
    poolFee: string | number,
    totalShares: string | number,
    protocolFeeRate: number = 0.1
  ): {
    feePerShareIncrement: string;
    protocolFee: string;
    lpFee: string;
  } {
    const poolFeeDec = new Decimal(poolFee);
    const totalSharesDec = new Decimal(totalShares);

    // Protocol takes a cut
    const protocolFee = poolFeeDec.mul(protocolFeeRate);
    const lpFee = poolFeeDec.sub(protocolFee);

    // If no shares, all goes to protocol
    if (totalSharesDec.eq(0)) {
      return {
        feePerShareIncrement: "0",
        protocolFee: poolFeeDec.toFixed(0),
        lpFee: "0",
      };
    }

    // Increment fee_per_share
    const feePerShareIncrement = lpFee.div(totalSharesDec);

    return {
      feePerShareIncrement: feePerShareIncrement.toFixed(20), // High precision
      protocolFee: protocolFee.toFixed(0),
      lpFee: lpFee.toFixed(0),
    };
  }

  /**
   * Calculate owed fees for a position
   * @param shares - Position's LP shares
   * @param currentFeePerShare - Pool's current fee_per_share
   * @param entryFeePerShare - Position's entry_fee_per_share
   * @returns Owed fees
   */
  static calculateOwedFees(
    shares: string | number,
    currentFeePerShare: string | number,
    entryFeePerShare: string | number
  ): string {
    const sharesDec = new Decimal(shares);
    const currentDec = new Decimal(currentFeePerShare);
    const entryDec = new Decimal(entryFeePerShare);

    const owedPerShare = currentDec.sub(entryDec);
    const owed = owedPerShare.mul(sharesDec);

    return owed.toFixed(0);
  }

  /**
   * Calculate LP shares to mint when adding liquidity
   * @param amountA - Amount of token A to add
   * @param amountB - Amount of token B to add
   * @param reserveA - Current reserve A
   * @param reserveB - Current reserve B
   * @param totalShares - Current total shares
   * @returns Shares to mint
   */
  static calculateSharesForLiquidity(
    amountA: string | number,
    amountB: string | number,
    reserveA: string | number,
    reserveB: string | number,
    totalShares: string | number
  ): string {
    const amountADec = new Decimal(amountA);
    const amountBDec = new Decimal(amountB);
    const reserveADec = new Decimal(reserveA);
    const reserveBDec = new Decimal(reserveB);
    const totalSharesDec = new Decimal(totalShares);

    // Bootstrap case: shares = sqrt(amountA * amountB)
    if (totalSharesDec.eq(0)) {
      const shares = amountADec.mul(amountBDec).sqrt();
      return shares.toFixed(0);
    }

    // Proportional case: shares = min(amountA/reserveA, amountB/reserveB) * totalShares
    const sharesFromA = amountADec.div(reserveADec).mul(totalSharesDec);
    const sharesFromB = amountBDec.div(reserveBDec).mul(totalSharesDec);
    const shares = Decimal.min(sharesFromA, sharesFromB);

    return shares.toFixed(0);
  }

  /**
   * Calculate amounts to return when removing liquidity
   * @param sharesToBurn - LP shares to burn
   * @param totalShares - Total LP shares
   * @param reserveA - Reserve A
   * @param reserveB - Reserve B
   * @returns Amounts to return
   */
  static calculateLiquidityAmounts(
    sharesToBurn: string | number,
    totalShares: string | number,
    reserveA: string | number,
    reserveB: string | number
  ): {
    amountA: string;
    amountB: string;
  } {
    const sharesToBurnDec = new Decimal(sharesToBurn);
    const totalSharesDec = new Decimal(totalShares);
    const reserveADec = new Decimal(reserveA);
    const reserveBDec = new Decimal(reserveB);

    if (totalSharesDec.eq(0)) {
      return { amountA: "0", amountB: "0" };
    }

    const shareRatio = sharesToBurnDec.div(totalSharesDec);
    const amountA = reserveADec.mul(shareRatio);
    const amountB = reserveBDec.mul(shareRatio);

    return {
      amountA: amountA.toFixed(0),
      amountB: amountB.toFixed(0),
    };
  }

  /**
   * Verify pool invariant hasn't decreased (allowing for fees)
   * @param oldReserveA - Old reserve A
   * @param oldReserveB - Old reserve B
   * @param newReserveA - New reserve A
   * @param newReserveB - New reserve B
   * @returns True if invariant maintained
   */
  static verifyInvariant(
    oldReserveA: string | number,
    oldReserveB: string | number,
    newReserveA: string | number,
    newReserveB: string | number
  ): boolean {
    const oldK = new Decimal(oldReserveA).mul(new Decimal(oldReserveB));
    const newK = new Decimal(newReserveA).mul(new Decimal(newReserveB));
    
    // New K should be >= old K (fees increase K)
    return newK.gte(oldK);
  }
}

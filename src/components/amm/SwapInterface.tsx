"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowDownUp,
  Settings,
  Info,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useSui } from "@/providers/SuiProvider";
import { toast } from "sonner";

interface Token {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoUrl: string | null;
}

interface Pool {
  id: number;
  tokenA: Token;
  tokenB: Token;
  reserveA: string;
  reserveB: string;
  feeTier: number;
  totalSupply: string;
  tvl: number;
  volume24h: number;
  apy: number;
}

export function SwapInterface() {
  const { isConnected, account, connect } = useSui();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [pool, setPool] = useState<Pool | null>(null);

  // Load tokens on mount
  useEffect(() => {
    async function loadTokens() {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) throw new Error('Failed to load tokens');
        const data = await response.json();
        setTokens(data);
        
        // Set default tokens (SUI and USDC)
        if (data.length >= 2) {
          setTokenIn(data[0]); // SUI
          setTokenOut(data[1]); // USDC
        }
      } catch (error) {
        console.error('Error loading tokens:', error);
        toast.error('Failed to load tokens');
      } finally {
        setIsLoadingTokens(false);
      }
    }
    loadTokens();
  }, []);

  // Find pool when tokens change
  useEffect(() => {
    async function findPool() {
      if (!tokenIn || !tokenOut) {
        setPool(null);
        return;
      }

      setIsLoadingPool(true);
      try {
        const response = await fetch('/api/pools/find', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenASymbol: tokenIn.symbol,
            tokenBSymbol: tokenOut.symbol,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPool(data);
        } else {
          setPool(null);
        }
      } catch (error) {
        console.error('Error finding pool:', error);
        setPool(null);
      } finally {
        setIsLoadingPool(false);
      }
    }
    findPool();
  }, [tokenIn, tokenOut]);

  // Calculate swap output
  const swapQuote = useMemo(() => {
    if (!pool || !amountIn || parseFloat(amountIn) <= 0 || !tokenIn || !tokenOut) {
      return null;
    }

    const isReverse = pool.tokenA.symbol !== tokenIn.symbol;
    const reserveIn = parseFloat(isReverse ? pool.reserveB : pool.reserveA);
    const reserveOut = parseFloat(isReverse ? pool.reserveA : pool.reserveB);

    const amountInAdjusted = parseFloat(amountIn) * Math.pow(10, tokenIn.decimals);
    
    // Apply fee
    const feeMultiplier = (10000 - pool.feeTier) / 10000;
    const amountInWithFee = amountInAdjusted * feeMultiplier;
    
    // x * y = k formula
    const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
    
    // Calculate price impact
    const spotPrice = reserveOut / reserveIn;
    const executionPrice = amountOut / amountInAdjusted;
    const priceImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
    
    const fee = amountInAdjusted * (pool.feeTier / 10000);

    const amountOutDisplay = amountOut / Math.pow(10, tokenOut.decimals);
    const feeDisplay = fee / Math.pow(10, tokenIn.decimals);

    return {
      amountOut: amountOutDisplay,
      amountOutRaw: amountOut.toString(),
      priceImpact: Math.max(0, priceImpact),
      fee: feeDisplay,
      feeRaw: fee.toString(),
      minimumReceived: amountOutDisplay * (1 - slippage / 100),
      executionPrice,
    };
  }, [pool, amountIn, tokenIn, tokenOut, slippage]);

  const handleSwapTokens = useCallback(() => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn("");
  }, [tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!swapQuote || swapQuote.amountOut <= 0 || !pool || !account?.address || !tokenIn || !tokenOut) return;

    setIsSwapping(true);
    
    try {
      const amountInRaw = (parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)).toString();
      const txDigest = `swap_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      // Record swap in database
      const response = await fetch('/api/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: pool.id,
          userAddress: account.address,
          tokenInId: tokenIn.id,
          tokenOutId: tokenOut.id,
          amountIn: amountInRaw,
          amountOut: swapQuote.amountOutRaw,
          fee: swapQuote.feeRaw,
          priceImpact: swapQuote.priceImpact,
          txDigest,
        }),
      });

      if (!response.ok) {
        throw new Error('Swap failed');
      }

      // Update pool reserves
      const isReverse = pool.tokenA.symbol !== tokenIn.symbol;
      const reserveInNew = parseFloat(isReverse ? pool.reserveB : pool.reserveA) + parseFloat(amountInRaw);
      const reserveOutNew = parseFloat(isReverse ? pool.reserveA : pool.reserveB) - parseFloat(swapQuote.amountOutRaw);

      await fetch(`/api/pools/${pool.id}/reserves`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reserveA: isReverse ? reserveOutNew.toString() : reserveInNew.toString(),
          reserveB: isReverse ? reserveInNew.toString() : reserveOutNew.toString(),
          volume24h: pool.volume24h + (parseFloat(amountIn) * 2),
        }),
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Swap Successful!</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {amountIn} {tokenIn.symbol} → {swapQuote.amountOut.toFixed(6)} {tokenOut.symbol}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Tx: {txDigest.slice(0, 16)}...</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      );
      
      setAmountIn("");
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return "text-green-500";
    if (impact < 3) return "text-yellow-500";
    return "text-red-500";
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (isLoadingTokens) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading tokens...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl">Swap</CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Transaction Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Slippage Tolerance
                    </span>
                    <span className="text-sm font-medium">{slippage}%</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map((value) => (
                      <Button
                        key={value}
                        variant={slippage === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(value)}
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>
                  <Slider
                    value={[slippage]}
                    onValueChange={([value]) => setSlippage(value)}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Token In */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>You pay</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="border-0 bg-transparent text-2xl font-medium p-0 h-auto focus-visible:ring-0"
              />
              <Select
                value={tokenIn?.symbol || ""}
                onValueChange={(value) => {
                  const token = tokens.find((t) => t.symbol === value);
                  if (token && token.symbol !== tokenOut?.symbol) {
                    setTokenIn(token);
                  }
                }}
              >
                <SelectTrigger className="w-32 bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.filter((t) => t.symbol !== tokenOut?.symbol).map(
                    (token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                          {token.symbol}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-background border-border/50 hover:bg-muted"
              onClick={handleSwapTokens}
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Token Out */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>You receive</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="0.00"
                value={swapQuote ? formatNumber(swapQuote.amountOut) : ""}
                readOnly
                className="border-0 bg-transparent text-2xl font-medium p-0 h-auto focus-visible:ring-0"
              />
              <Select
                value={tokenOut?.symbol || ""}
                onValueChange={(value) => {
                  const token = tokens.find((t) => t.symbol === value);
                  if (token && token.symbol !== tokenIn?.symbol) {
                    setTokenOut(token);
                  }
                }}
              >
                <SelectTrigger className="w-32 bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tokens.filter((t) => t.symbol !== tokenIn?.symbol).map(
                    (token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                          {token.symbol}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading Pool */}
          {isLoadingPool && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding best pool...
            </div>
          )}

          {/* Swap Details */}
          {swapQuote && swapQuote.amountOut > 0 && (
            <div className="rounded-xl bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  Price Impact
                  <Info className="h-3 w-3" />
                </span>
                <span className={getPriceImpactColor(swapQuote.priceImpact)}>
                  {swapQuote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fee ({pool?.feeTier ? pool.feeTier / 100 : 0.3}%)</span>
                <span>
                  {formatNumber(swapQuote.fee, 6)} {tokenIn?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Min. Received</span>
                <span>
                  {formatNumber(swapQuote.minimumReceived)}{" "}
                  {tokenOut?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Route</span>
                <span>
                  {tokenIn?.symbol} → {tokenOut?.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Warning for high price impact */}
          {swapQuote && swapQuote.priceImpact > 3 && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                High price impact! You may receive significantly less tokens.
              </span>
            </div>
          )}

          {/* No pool warning */}
          {!pool && !isLoadingPool && amountIn && tokenIn && tokenOut && (
            <div className="flex items-center gap-2 rounded-xl bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                No pool found for this pair. Try a different token combination.
              </span>
            </div>
          )}

          {/* Swap Button */}
          {!isConnected ? (
            <Button
              className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={connect}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={
                !swapQuote ||
                swapQuote.amountOut <= 0 ||
                isSwapping ||
                !pool ||
                isLoadingPool
              }
              onClick={handleSwap}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : isLoadingPool ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Pool...
                </>
              ) : !pool ? (
                "No Pool Available"
              ) : !amountIn || parseFloat(amountIn) <= 0 ? (
                "Enter Amount"
              ) : (
                "Swap"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
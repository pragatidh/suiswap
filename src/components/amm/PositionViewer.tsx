"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet,
  TrendingUp,
  Gift,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useSui } from "@/providers/SuiProvider";
import { toast } from "sonner";
import { LPPosition } from "@/types/amm";

interface PositionViewerProps {
  onRemoveLiquidity?: (position: LPPosition) => void;
}

export function PositionViewer({ onRemoveLiquidity }: PositionViewerProps) {
  const { isConnected, account, connect } = useSui();

  const [positions, setPositions] = useState<LPPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load positions
  useEffect(() => {
    async function loadPositions() {
      if (!isConnected || !account?.address) {
        setPositions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/positions?userAddress=${account.address}`);
        if (!response.ok) throw new Error('Failed to load positions');
        const data = await response.json();
        setPositions(data);
      } catch (error) {
        console.error('Error loading positions:', error);
        // toast.error('Failed to load positions'); // Suppress for demo if API missing
      } finally {
        setIsLoading(false);
      }
    }
    loadPositions();
  }, [isConnected, account?.address]);

  // Calculate totals
  const totalValue = positions.reduce((acc, pos) => acc + pos.valueUSD, 0);
  const totalFees = positions.reduce(
    (acc, pos) =>
      acc + parseFloat(pos.accumulatedFeesA) + parseFloat(pos.accumulatedFeesB),
    0
  );

  const handleClaimFees = async (position: LPPosition) => {
    setClaimingId(position.id);

    try {
      const response = await fetch('/api/fees/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionId: position.id,
          feesA: position.accumulatedFeesA,
          feesB: position.accumulatedFeesB,
        }),
      });

      if (!response.ok) throw new Error('Failed to claim fees');

      toast.success(
        `Claimed ${position.accumulatedFeesA} ${position.pool.tokenA.symbol} and ${position.accumulatedFeesB} ${position.pool.tokenB.symbol}`
      );

      // Refresh positions
      if (account?.address) {
        const positionsRes = await fetch(`/api/positions?userAddress=${account.address}`);
        if (positionsRes.ok) {
          const data = await positionsRes.json();
          setPositions(data);
        }
      }
    } catch (error) {
      console.error('Claim fees failed:', error);
      toast.error('Failed to claim fees. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleCopyAddress = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Position ID copied to clipboard!');
  };

  const formatTimeSince = (timestamp: string) => {
    const days = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const formatCurrency = (num: number) => {
    // Indian Rupee formatting with Lakhs and Crores
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)}K`;
    return `₹${num.toFixed(2)}`;
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your liquidity positions.
            </p>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={connect}
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading positions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Positions Yet</h3>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any liquidity positions. Add liquidity to a
              pool to start earning fees.
            </p>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Add Liquidity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unclaimed Fees</p>
                <p className="text-2xl font-bold">${totalFees.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LP NFTs</p>
                <p className="text-2xl font-bold">{positions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your LP Positions</h2>

        {positions.map((position) => (
          <Card
            key={position.id}
            className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* NFT Preview */}
                <div className="lg:w-48 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                  <div className="relative w-32 h-32 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                    <div className="absolute inset-1 rounded-lg bg-card flex flex-col items-center justify-center">
                      <div className="flex -space-x-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-card flex items-center justify-center text-xs font-bold text-white">
                          {position.pool.tokenA.symbol.slice(0, 2)}
                        </div>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-card flex items-center justify-center text-xs font-bold text-white">
                          {position.pool.tokenB.symbol.slice(0, 2)}
                        </div>
                      </div>
                      <p className="text-xs font-medium">LP Position</p>
                      <p className="text-[10px] text-muted-foreground">
                        #{position.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Position Details */}
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {position.pool.tokenA.symbol}/
                          {position.pool.tokenB.symbol}
                        </h3>
                        <Badge variant="secondary">
                          {position.pool.feeTier / 100}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Position #{position.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleCopyAddress(position.id)}
                        >
                          {copiedId === position.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(position.valueUSD)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {position.sharePercentage.toFixed(2)}% of pool
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Liquidity
                      </p>
                      <p className="font-medium">
                        {formatNumber(parseFloat(position.liquidity))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Created
                      </p>
                      <p className="font-medium">
                        {formatTimeSince(position.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">APY</p>
                      <p className="font-medium text-green-500">
                        {position.pool.apy.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Last Claim
                      </p>
                      <p className="font-medium">
                        {formatTimeSince(position.lastFeeClaim)}
                      </p>
                    </div>
                  </div>

                  {/* Fees Section */}
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Accumulated Fees</p>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {position.pool.tokenA.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {position.accumulatedFeesA}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {position.pool.tokenA.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {position.pool.tokenB.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {position.accumulatedFeesB}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {position.pool.tokenB.symbol}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleClaimFees(position)}
                      disabled={claimingId === position.id}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      {claimingId === position.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Claim Fees
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => onRemoveLiquidity?.(position)}
                    >
                      Remove Liquidity
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          View NFT
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>LP Position NFT</DialogTitle>
                          <DialogDescription>
                            This NFT represents your liquidity position in the{" "}
                            {position.pool.tokenA.symbol}/
                            {position.pool.tokenB.symbol} pool
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center py-6">
                          <div className="relative w-48 h-48 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 mb-4">
                            <div className="absolute inset-1 rounded-xl bg-card flex flex-col items-center justify-center">
                              <div className="flex -space-x-3 mb-3">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-card flex items-center justify-center text-sm font-bold text-white">
                                  {position.pool.tokenA.symbol.slice(0, 2)}
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-card flex items-center justify-center text-sm font-bold text-white">
                                  {position.pool.tokenB.symbol.slice(0, 2)}
                                </div>
                              </div>
                              <p className="font-medium">LP Position</p>
                              <p className="text-sm text-muted-foreground">
                                {position.pool.tokenA.symbol}/
                                {position.pool.tokenB.symbol}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                #{position.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-center text-sm text-muted-foreground">
                            <p>Share: {position.sharePercentage.toFixed(2)}%</p>
                            <p>Value: {formatCurrency(position.valueUSD)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Explorer
                          </Button>
                          <Button className="flex-1">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Transfer NFT
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
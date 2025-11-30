"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Wallet, ArrowDown, Info } from "lucide-react";
import { useSui } from "@/providers/SuiProvider";
import { toast } from "sonner";
import { Pool } from "@/types/amm";

interface LiquidityManagerProps {
    selectedPool?: Pool;
}

export function LiquidityManager({ selectedPool }: LiquidityManagerProps) {
    const { isConnected, account, connect } = useSui();
    const [amountA, setAmountA] = useState("");
    const [amountB, setAmountB] = useState("");
    const [isDepositing, setIsDepositing] = useState(false);
    const [pool, setPool] = useState<Pool | undefined>(selectedPool);

    // If no pool selected, we would typically show a pool selector here
    // For simplicity in this restoration, we assume a pool is passed or we default to one

    const handleDeposit = async () => {
        if (!isConnected || !account?.address) {
            connect();
            return;
        }

        if (!amountA || !amountB) {
            toast.error("Please enter amounts for both tokens");
            return;
        }

        // Default to pool 1 if none selected (for demo robustness)
        const targetPoolId = pool?.id || "1";

        setIsDepositing(true);
        try {
            const response = await fetch('/api/liquidity/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poolId: targetPoolId,
                    amountA,
                    amountB,
                    userAddress: account.address,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add liquidity');
            }

            toast.success("Liquidity added successfully! NFT Position minted.");
            setAmountA("");
            setAmountB("");
        } catch (error) {
            console.error('Deposit error:', error);
            toast.error(error instanceof Error ? error.message : "Failed to add liquidity");
        } finally {
            setIsDepositing(false);
        }
    };

    if (!isConnected) {
        return (
            <Card className="w-full max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                    <p className="text-muted-foreground mb-4">
                        Connect your wallet to add liquidity and mint LP Position NFTs.
                    </p>
                    <Button onClick={connect} className="w-full">
                        Connect Wallet
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Add Liquidity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Token A Amount</label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amountA}
                            onChange={(e) => setAmountA(e.target.value)}
                            className="pr-16"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            {pool?.tokenA.symbol || "TKA"}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Token B Amount</label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amountB}
                            onChange={(e) => setAmountB(e.target.value)}
                            className="pr-16"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            {pool?.tokenB.symbol || "TKB"}
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Info className="h-4 w-4" />
                        <span>NFT Position</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You will receive a unique NFT representing your liquidity position. This NFT tracks your share of the pool and accumulated fees.
                    </p>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                    onClick={handleDeposit}
                    disabled={isDepositing}
                >
                    {isDepositing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Minting Position NFT...
                        </>
                    ) : (
                        "Add Liquidity & Mint NFT"
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState } from "react";
import { Header } from "@/components/amm/Header";
import { SwapInterface } from "@/components/amm/SwapInterface";
import { PoolExplorer } from "@/components/amm/PoolExplorer";
import { LiquidityManager } from "@/components/amm/LiquidityManager";
import { PositionViewer } from "@/components/amm/PositionViewer";
import { Pool } from "@/types/amm";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [activeTab, setActiveTab] = useState("swap");
  const [selectedPool, setSelectedPool] = useState<Pool | undefined>();

  const handleAddLiquidity = (pool: Pool) => {
    setSelectedPool(pool);
    setActiveTab("liquidity");
  };

  const handleRemoveLiquidity = () => {
    setActiveTab("liquidity");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="container mx-auto px-4 py-8">
        {activeTab === "swap" && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Swap Tokens
              </h1>
              <p className="text-muted-foreground max-w-md">
                Trade tokens instantly with minimal slippage using our advanced
                AMM protocol
              </p>
            </div>
            <SwapInterface />
          </div>
        )}

        {activeTab === "pools" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Liquidity Pools
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Explore all available pools and earn fees by providing liquidity
              </p>
            </div>
            <PoolExplorer onAddLiquidity={handleAddLiquidity} />
          </div>
        )}

        {activeTab === "liquidity" && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Manage Liquidity
              </h1>
              <p className="text-muted-foreground max-w-md">
                Add or remove liquidity from pools and receive NFT position tokens
              </p>
            </div>
            <LiquidityManager selectedPool={selectedPool} />
          </div>
        )}

        {activeTab === "positions" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                My Positions
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                View and manage your NFT-based liquidity positions
              </p>
            </div>
            <PositionViewer onRemoveLiquidity={handleRemoveLiquidity} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="font-semibold">SuiSwap</span>
              <span className="text-muted-foreground text-sm">
                © 2024 All rights reserved
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Discord
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
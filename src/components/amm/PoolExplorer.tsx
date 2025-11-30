"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  TrendingUp,
  Droplets,
  Activity,
  Plus,
  ExternalLink,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Pool } from "@/types/amm";

interface PoolExplorerProps {
  onAddLiquidity?: (pool: Pool) => void;
}

const FEE_TIERS = [
  { value: 5, label: "0.05%", description: "Best for stable pairs" },
  { value: 30, label: "0.3%", description: "Best for most pairs" },
  { value: 100, label: "1%", description: "Best for exotic pairs" },
];

export function PoolExplorer({ onAddLiquidity }: PoolExplorerProps) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"tvl" | "volume" | "apy">("tvl");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Load pools from API
  useEffect(() => {
    async function loadPools() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/pools');
        if (!response.ok) throw new Error('Failed to load pools');
        const data = await response.json();
        setPools(data);
      } catch (error) {
        console.error('Error loading pools:', error);
        toast.error('Failed to load pools');
      } finally {
        setIsLoading(false);
      }
    }
    loadPools();
  }, []);

  // Calculate stats
  const totalTVL = pools.reduce((acc, pool) => acc + pool.tvl, 0);
  const totalVolume = pools.reduce((acc, pool) => acc + pool.volume24h, 0);
  const avgAPY = pools.length > 0
    ? pools.reduce((acc, pool) => acc + pool.apy, 0) / pools.length
    : 0;

  // Filter and sort pools
  const filteredPools = pools
    .filter(
      (pool) =>
        pool.tokenA.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.tokenB.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.tokenA.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.tokenB.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "tvl":
          return (a.tvl - b.tvl) * multiplier;
        case "volume":
          return (a.volume24h - b.volume24h) * multiplier;
        case "apy":
          return (a.apy - b.apy) * multiplier;
        default:
          return 0;
      }
    });

  const handleSort = (column: "tvl" | "volume" | "apy") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getFeeTierLabel = (feeTier: number) => {
    const tier = FEE_TIERS.find((t) => t.value === feeTier);
    return tier?.label || `${feeTier / 100}%`;
  };

  const formatCurrency = (num: number) => {
    // Indian Rupee formatting with Lakhs and Crores
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)}K`;
    return `₹${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pools...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total TVL</p>
                <p className="text-2xl font-bold">{formatCurrency(totalTVL)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalVolume)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg APY</p>
                <p className="text-2xl font-bold">{avgAPY.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pool List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">All Pools</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tvl">TVL</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="apy">APY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Pool</TableHead>
                  <TableHead>Fee Tier</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("tvl")}
                    >
                      TVL
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("volume")}
                    >
                      24h Volume
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-medium hover:bg-transparent"
                      onClick={() => handleSort("apy")}
                    >
                      APY
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPools.map((pool) => (
                  <TableRow key={pool.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                            {pool.tokenA.symbol.slice(0, 2)}
                          </div>
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                            {pool.tokenB.symbol.slice(0, 2)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">
                            {pool.tokenA.symbol}/{pool.tokenB.symbol}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pool.tokenA.name} / {pool.tokenB.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getFeeTierLabel(pool.feeTier)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(pool.tvl)}
                    </TableCell>
                    <TableCell>{formatCurrency(pool.volume24h)}</TableCell>
                    <TableCell>
                      <span className="text-green-500 font-medium">
                        {pool.apy.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAddLiquidity?.(pool)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPools.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No pools found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
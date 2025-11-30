"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, ChevronDown, Menu, X, Droplets, Copy, ExternalLink, LogOut, Loader2 } from "lucide-react";
import { useSui, NetworkType } from "@/providers/SuiProvider";
import { toast } from "sonner";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  walletConnected?: boolean;
  onConnectWallet?: () => void;
  walletAddress?: string;
}

export function Header({
  activeTab,
  onTabChange,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    isConnected,
    isConnecting,
    account,
    balance,
    network,
    setNetwork,
    connect,
    disconnect,
    formatAddress
  } = useSui();

  const tabs = [
    { id: "swap", label: "Swap" },
    { id: "pools", label: "Pools" },
    { id: "liquidity", label: "Liquidity" },
    { id: "positions", label: "My Positions" },
  ];

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      toast.success("Address copied to clipboard!");
    }
  };

  const handleViewExplorer = () => {
    if (account?.address) {
      const explorerUrl = network === "mainnet"
        ? `https://suiscan.xyz/mainnet/account/${account.address}`
        : `https://suiscan.xyz/${network}/account/${account.address}`;
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            SuiSwap
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              className={`px-4 ${activeTab === tab.id
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </nav>

        {/* Right side: Network selector + Wallet */}
        <div className="flex items-center gap-2">
          {/* Network Selector */}
          <Select
            value={network}
            onValueChange={(value) => setNetwork(value as NetworkType)}
          >
            <SelectTrigger className="w-28 h-9 hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mainnet">Mainnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
              <SelectItem value="devnet">Devnet</SelectItem>
            </SelectContent>
          </Select>

          {/* Wallet Connection */}
          {isConnected && account ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="flex flex-col items-start">
                    <span className="hidden sm:inline text-sm">
                      {formatAddress(account.address)}
                    </span>
                    <span className="sm:hidden text-sm">Connected</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {balance} SUI
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {account.address}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold">{balance} SUI</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleCopyAddress} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewExplorer} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </>
              )}
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto flex flex-col p-4 gap-1">
            {/* Mobile Network Selector */}
            <div className="px-2 py-2 mb-2">
              <p className="text-xs text-muted-foreground mb-2">Network</p>
              <Select
                value={network}
                onValueChange={(value) => setNetwork(value as NetworkType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainnet">Mainnet</SelectItem>
                  <SelectItem value="testnet">Testnet</SelectItem>
                  <SelectItem value="devnet">Devnet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className={`justify-start ${activeTab === tab.id
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileMenuOpen(false);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
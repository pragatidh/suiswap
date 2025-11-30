"use client";

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// Network configuration
export type NetworkType = "mainnet" | "testnet" | "devnet";

const NETWORK_CONFIGS = {
  mainnet: getFullnodeUrl("mainnet"),
  testnet: getFullnodeUrl("testnet"),
  devnet: getFullnodeUrl("devnet"),
};

// Wallet account interface
export interface WalletAccount {
  address: string;
  publicKey: string;
  chains: string[];
}

// Wallet interface
export interface WalletInfo {
  name: string;
  icon: string;
  version: string;
}

// Context interface
interface SuiContextType {
  // Client
  client: SuiClient;
  network: NetworkType;
  setNetwork: (network: NetworkType) => void;
  
  // Wallet state
  isConnected: boolean;
  isConnecting: boolean;
  account: WalletAccount | null;
  wallet: WalletInfo | null;
  
  // Wallet actions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Balance
  balance: string;
  refreshBalance: () => Promise<void>;
  
  // Transactions
  signAndExecuteTransaction: (tx: Transaction) => Promise<string>;
  
  // Utils
  formatAddress: (address: string) => string;
}

const SuiContext = createContext<SuiContextType | null>(null);

export function useSui() {
  const context = useContext(SuiContext);
  if (!context) {
    throw new Error("useSui must be used within a SuiProvider");
  }
  return context;
}

interface SuiProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkType;
}

export function SuiProvider({ children, defaultNetwork = "testnet" }: SuiProviderProps) {
  const [network, setNetwork] = useState<NetworkType>(defaultNetwork);
  const [client, setClient] = useState<SuiClient>(() => new SuiClient({ url: NETWORK_CONFIGS[defaultNetwork] }));
  
  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState("0");

  // Update client when network changes
  useEffect(() => {
    setClient(new SuiClient({ url: NETWORK_CONFIGS[network] }));
  }, [network]);

  // Check for existing connection on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("sui_wallet_address");
    if (savedAddress) {
      setAccount({
        address: savedAddress,
        publicKey: "",
        chains: [`sui:${network}`],
      });
      setIsConnected(true);
      setWallet({
        name: "Sui Wallet",
        icon: "",
        version: "1.0.0",
      });
    }
  }, [network]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!account?.address) {
      setBalance("0");
      return;
    }

    try {
      const balanceResult = await client.getBalance({
        owner: account.address,
        coinType: "0x2::sui::SUI",
      });
      
      // Convert from MIST to SUI (9 decimals)
      const suiBalance = (Number(balanceResult.totalBalance) / 1e9).toFixed(4);
      setBalance(suiBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance("0");
    }
  }, [client, account?.address]);

  // Refresh balance when account or client changes
  useEffect(() => {
    if (isConnected && account?.address) {
      refreshBalance();
      // Set up polling for balance updates
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, account?.address, refreshBalance]);

  // Connect wallet
  const connect = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      // Check if Sui Wallet is available
      const suiWallet = (window as unknown as { suiWallet?: { requestPermissions: () => Promise<boolean>; getAccounts: () => Promise<{ address: string }[]> } }).suiWallet;
      
      if (suiWallet) {
        // Real wallet connection
        const hasPermission = await suiWallet.requestPermissions();
        if (hasPermission) {
          const accounts = await suiWallet.getAccounts();
          if (accounts.length > 0) {
            const walletAccount: WalletAccount = {
              address: accounts[0].address,
              publicKey: "",
              chains: [`sui:${network}`],
            };
            
            setAccount(walletAccount);
            setIsConnected(true);
            setWallet({
              name: "Sui Wallet",
              icon: "",
              version: "1.0.0",
            });
            
            localStorage.setItem("sui_wallet_address", accounts[0].address);
          }
        }
      } else {
        // Fallback: Generate a demo address for testing
        // In production, this would open a wallet selection modal
        const demoAddress = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        
        const walletAccount: WalletAccount = {
          address: demoAddress,
          publicKey: "",
          chains: [`sui:${network}`],
        };
        
        setAccount(walletAccount);
        setIsConnected(true);
        setWallet({
          name: "Demo Wallet",
          icon: "",
          version: "1.0.0",
        });
        
        localStorage.setItem("sui_wallet_address", demoAddress);
        
        console.log("No Sui wallet found. Using demo address:", demoAddress);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [network]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setWallet(null);
    setBalance("0");
    localStorage.removeItem("sui_wallet_address");
  }, []);

  // Sign and execute transaction
  const signAndExecuteTransaction = useCallback(async (tx: Transaction): Promise<string> => {
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Check if Sui Wallet is available
      const suiWallet = (window as unknown as { suiWallet?: { signAndExecuteTransaction: (params: { transaction: Uint8Array }) => Promise<{ digest: string }> } }).suiWallet;
      
      if (suiWallet) {
        // Build and execute with real wallet
        const txBytes = await tx.build({ client });
        const result = await suiWallet.signAndExecuteTransaction({
          transaction: txBytes,
        });
        return result.digest;
      } else {
        // Demo mode - simulate transaction
        console.log("Demo mode: Simulating transaction...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Return a fake transaction digest
        const fakeDigest = `demo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        return fakeDigest;
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  }, [account?.address, client]);

  // Format address for display
  const formatAddress = useCallback((address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  const value: SuiContextType = {
    client,
    network,
    setNetwork,
    isConnected,
    isConnecting,
    account,
    wallet,
    connect,
    disconnect,
    balance,
    refreshBalance,
    signAndExecuteTransaction,
    formatAddress,
  };

  return (
    <SuiContext.Provider value={value}>
      {children}
    </SuiContext.Provider>
  );
}

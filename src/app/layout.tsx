import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { SuiProvider } from "@/providers/SuiProvider";

export const metadata: Metadata = {
  title: "SuiSwap - Decentralized AMM with NFT LP Positions",
  description: "Next-generation Automated Market Maker on SUI Blockchain with NFT-based liquidity positions, StableSwap pools, and advanced slippage protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <SuiProvider defaultNetwork="testnet">
          {children}
        </SuiProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
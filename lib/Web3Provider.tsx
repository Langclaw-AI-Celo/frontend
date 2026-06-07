"use client";
import { darkTheme, getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import React from "react";

import { productChains, toWagmiChain } from "@/lib/chains";

const MantleChain = toWagmiChain(productChains.mantle);
const CeloChain = toWagmiChain(productChains.celo);
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "minipay-injected-only";

const config = getDefaultConfig({
  appName: "Langclaw Multi-Chain Alpha Sentinel",
  projectId: walletConnectProjectId,
  chains: [CeloChain, MantleChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialChain = CeloChain;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          coolMode
          theme={darkTheme({
            accentColor: "#7b3fe4",
            accentColorForeground: "white",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
          initialChain={initialChain}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

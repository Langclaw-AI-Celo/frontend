import type { Address, Chain } from "viem";
import { celo } from "viem/chains";

import type { ProductChainId } from "@/lib/langclaw-api";

export type ProductChain = {
  billingCurrency: {
    decimals: number;
    feeCurrencyAddress?: Address;
    name: string;
    symbol: string;
    tokenAddress?: Address;
  };
  id: ProductChainId;
  chainId: number;
  explorerUrl: string;
  name: string;
  nativeCurrency: {
    decimals: number;
    name: string;
    symbol: string;
  };
  nativeSymbol: string;
  rpcUrl: string;
};

export const productChains: Record<ProductChainId, ProductChain> = {
  mantle: {
    id: "mantle",
    chainId: 5000,
    billingCurrency: {
      decimals: 18,
      name: "Mantle",
      symbol: "MNT",
    },
    explorerUrl: "https://explorer.mantle.xyz",
    name: "Mantle",
    nativeCurrency: {
      decimals: 18,
      name: "Mantle",
      symbol: "MNT",
    },
    nativeSymbol: "MNT",
    rpcUrl: "https://rpc.mantle.xyz",
  },
  celo: {
    id: "celo",
    chainId: 42220,
    billingCurrency: {
      decimals: 6,
      feeCurrencyAddress: "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72",
      name: "Tether USD",
      symbol: "USDT",
      tokenAddress: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    },
    explorerUrl: "https://celoscan.io",
    name: "Celo",
    nativeCurrency: {
      decimals: 18,
      name: "CELO",
      symbol: "CELO",
    },
    nativeSymbol: "USDT",
    rpcUrl: "https://forno.celo.org",
  },
};

export const defaultProductChain: ProductChainId = "celo";
export const productChainOptions = [productChains.celo, productChains.mantle];

export function resolveProductChain(input?: string | null) {
  return input === "mantle" ? productChains.mantle : productChains.celo;
}

export function toWagmiChain(chain: ProductChain): Chain {
  if (chain.id === "celo") {
    return {
      ...celo,
      rpcUrls: {
        default: {
          http: [chain.rpcUrl],
        },
      },
      blockExplorers: {
        default: {
          name: `${chain.name} Explorer`,
          url: chain.explorerUrl,
        },
      },
    };
  }

  return {
    id: chain.chainId,
    name: `${chain.name} Mainnet`,
    nativeCurrency: {
      decimals: chain.nativeCurrency.decimals,
      name: chain.nativeCurrency.name,
      symbol: chain.nativeCurrency.symbol,
    },
    rpcUrls: {
      default: {
        http: [chain.rpcUrl],
      },
    },
    blockExplorers: {
      default: {
        name: `${chain.name} Explorer`,
        url: chain.explorerUrl,
      },
    },
  };
}

"use client";

import { injected } from "wagmi/connectors";

import { productChains } from "@/lib/chains";

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function isMiniPayProvider() {
  return (
    typeof window !== "undefined" &&
    window.ethereum !== undefined &&
    window.ethereum.isMiniPay === true
  );
}

export const MINIPAY_CHAIN_ID = productChains.celo.chainId;
const miniPayConnector = injected({ shimDisconnect: false });

export function getMiniPayConnector() {
  return miniPayConnector;
}

export function getMiniPayProvider() {
  if (!isMiniPayProvider() || !window.ethereum) {
    throw new Error("Open this app inside MiniPay.");
  }

  return window.ethereum;
}

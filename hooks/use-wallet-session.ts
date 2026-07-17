"use client";

import { useCallback } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useConnect,
  useConnection,
  useConnectors,
  useSignMessage,
} from "wagmi";
import { toast } from "sonner";

import {
  createWalletSession,
  requestWalletChallenge,
  type ProductChainId,
  type WalletAuth,
  type WalletAuthPurpose,
} from "@/lib/langclaw-api";
import { productChainOptions, resolveProductChain } from "@/lib/chains";
import {
  getMiniPayConnector,
  isMiniPayProvider,
  MINIPAY_CHAIN_ID,
} from "@/lib/minipay";
import { parseCachedWalletAuth } from "@/lib/wallet-auth-cache";

export const WALLET_AUTH_UPDATED_EVENT = "langclaw-wallet-auth-updated";
export const MINIPAY_SESSION_REQUIRED_MESSAGE =
  "MiniPay session required. Add or verify a USDT deposit from the Credits page before using account features.";
export const MINIPAY_SIGNATURE_UNAVAILABLE_MESSAGE =
  "MiniPay does not use wallet signature prompts for this action. Use a browser wallet outside MiniPay for signature-only actions.";

const WALLET_AUTH_STORAGE_PREFIX = "langclaw.walletSession.v2";
const inFlightSessionAuth = new Map<string, Promise<WalletAuth>>();

type WalletAuthOptions = {
  chain?: ProductChainId;
  force?: boolean;
  purpose?: WalletAuthPurpose;
};

export function useWalletSession() {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const {
    connectAsync,
    error: connectError,
    isPending: isConnecting,
  } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { isPending, signMessageAsync } = useSignMessage();

  const openWalletModal = useCallback(() => {
    if (isMiniPayProvider()) {
      const miniPayConnector =
        connectors.find((connector) => connector.id === "injected") ??
        connectors[0] ??
        getMiniPayConnector();

      void connectAsync({
        chainId: MINIPAY_CHAIN_ID,
        connector: miniPayConnector,
      }).catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to connect to MiniPay.",
        );
      });
      return;
    }

    openConnectModal?.();
  }, [connectAsync, connectors, openConnectModal]);

  const getWalletAuth = useCallback(
    async (options: WalletAuthOptions = {}) => {
      if (!isConnected || !address) {
        throw new Error("Connect your wallet first.");
      }

      const purpose = options.purpose ?? "session";
      const chain = resolveProductChain(options.chain);

      if (purpose === "session" && !options.force) {
        const cached = readCachedWalletAuth(address, chain.id);

        if (cached) {
          return cached;
        }
      }

      if (isMiniPayProvider() && purpose === "session") {
        throw new Error(MINIPAY_SESSION_REQUIRED_MESSAGE);
      }

      if (isMiniPayProvider()) {
        throw new Error(MINIPAY_SIGNATURE_UNAVAILABLE_MESSAGE);
      }

      const createAuth = async () => {
        const challenge = await requestWalletChallenge({
          address,
          chainId: chain.chainId,
          purpose,
        });
        const signature = await signMessageAsync({
          message: challenge.message,
        });
        const walletAuth = {
          address: challenge.address,
          message: challenge.message,
          signature,
        };

        if (purpose !== "session") {
          return walletAuth;
        }

        const session = await createWalletSession(walletAuth);

        writeCachedWalletAuth(session, chain.id);
        dispatchWalletAuthUpdated();

        return session;
      };

      if (purpose !== "session") {
        return createAuth();
      }

      const requestKey = `${address.toLowerCase()}:${chain.id}:${options.force ? "force" : "session"}`;
      const existingRequest = inFlightSessionAuth.get(requestKey);

      if (existingRequest) {
        return existingRequest;
      }

      const request = createAuth();
      inFlightSessionAuth.set(requestKey, request);

      try {
        return await request;
      } finally {
        inFlightSessionAuth.delete(requestKey);
      }
    },
    [address, isConnected, signMessageAsync]
  );

  const clearWalletAuth = useCallback(() => {
    if (address) {
      for (const chain of productChainOptions) {
        window.localStorage.removeItem(getWalletAuthStorageKey(address, chain.id));
      }
    }

    dispatchWalletAuthUpdated();
  }, [address]);

  return {
    address,
    clearWalletAuth,
    getWalletAuth,
    hasCachedWalletAuth: Boolean(
      address &&
        productChainOptions.some((chain) => readCachedWalletAuth(address, chain.id)),
    ),
    connectError,
    isConnecting,
    isConnected,
    isSigning: isPending,
    openWalletModal,
  };
}

export function readCachedWalletAuth(
  address?: string | null,
  chainInput?: ProductChainId,
) {
  if (!address || typeof window === "undefined") {
    return null;
  }

  const chain = resolveProductChain(chainInput);
  const raw = window.localStorage.getItem(
    getWalletAuthStorageKey(address, chain.id),
  );

  return parseCachedWalletAuth(raw, address);
}

function writeCachedWalletAuth(walletAuth: WalletAuth, chain: ProductChainId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getWalletAuthStorageKey(walletAuth.address, chain),
    JSON.stringify(walletAuth)
  );
}

export function cacheWalletAuth(
  walletAuth: WalletAuth,
  chainInput?: ProductChainId,
) {
  const chain = resolveProductChain(chainInput);

  writeCachedWalletAuth(walletAuth, chain.id);
  dispatchWalletAuthUpdated();
}

function getWalletAuthStorageKey(address: string, chain: ProductChainId) {
  return `${WALLET_AUTH_STORAGE_PREFIX}:${chain}:${address.toLowerCase()}`;
}

function dispatchWalletAuthUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(WALLET_AUTH_UPDATED_EVENT));
}

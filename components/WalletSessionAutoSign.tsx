"use client";

import { useEffect, useRef } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { toast } from "sonner";

import { useIsMiniPay } from "@/hooks/use-minipay";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { MINIPAY_CHAIN_ID } from "@/lib/minipay";

export function WalletSessionAutoSign() {
  const isMiniPay = useIsMiniPay();
  const {
    address,
    getWalletAuth,
    hasCachedWalletAuth,
    isConnecting,
    isConnected,
    isSigning,
    openWalletModal,
  } = useWalletSession();
  const activeChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const promptedAddressRef = useRef<string | null>(null);
  const promptedMiniPayConnectRef = useRef(false);

  useEffect(() => {
    if (!isMiniPay || isConnected || isConnecting) {
      return;
    }

    if (promptedMiniPayConnectRef.current) {
      return;
    }

    promptedMiniPayConnectRef.current = true;
    const timeoutId = window.setTimeout(() => {
      openWalletModal();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isConnected, isConnecting, isMiniPay, openWalletModal]);

  useEffect(() => {
    if (!isMiniPay || !isConnected || activeChainId === MINIPAY_CHAIN_ID) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      switchChain({ chainId: MINIPAY_CHAIN_ID });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeChainId, isConnected, isMiniPay, switchChain]);

  useEffect(() => {
    if (isMiniPay) {
      return;
    }

    if (!isConnected || !address) {
      promptedAddressRef.current = null;
      return;
    }

    if (hasCachedWalletAuth || isSigning) {
      return;
    }

    const normalizedAddress = address.toLowerCase();

    if (promptedAddressRef.current === normalizedAddress) {
      return;
    }

    promptedAddressRef.current = normalizedAddress;

    const timeoutId = window.setTimeout(() => {
      void getWalletAuth().catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    address,
    getWalletAuth,
    hasCachedWalletAuth,
    isConnected,
    isMiniPay,
    isSigning,
  ]);

  useEffect(() => {
    if (!isMiniPay || isConnecting || isConnected) {
      return;
    }

    toast.info("Connecting to MiniPay...");
  }, [isConnected, isConnecting, isMiniPay]);

  return null;
}

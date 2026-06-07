"use client";

import { useEffect, useState } from "react";

import { isMiniPayProvider } from "@/lib/minipay";

export function useIsMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    let intervalId: number | null = null;

    const syncProvider = () => {
      const nextValue = isMiniPayProvider();
      setIsMiniPay((current) => (current === nextValue ? current : nextValue));

      if (nextValue && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const timeoutId = window.setTimeout(syncProvider, 0);

    window.addEventListener("ethereum#initialized", syncProvider);
    window.addEventListener("focus", syncProvider);
    document.addEventListener("visibilitychange", syncProvider);
    intervalId = window.setInterval(syncProvider, 500);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("ethereum#initialized", syncProvider);
      window.removeEventListener("focus", syncProvider);
      document.removeEventListener("visibilitychange", syncProvider);

      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return isMiniPay;
}

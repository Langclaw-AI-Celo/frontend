"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircleIcon,
  DatabaseIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBalance,
  useChainId,
  useChains,
  useReadContract,
  useSwitchChain,
} from "wagmi";
import { erc20Abi, formatUnits } from "viem";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  readCachedWalletAuth,
  useWalletSession,
  WALLET_AUTH_UPDATED_EVENT,
} from "@/hooks/use-wallet-session";
import { useIsMiniPay } from "@/hooks/use-minipay";
import {
  getUsageBalance,
  readFriendlyError,
  type ProductChainId,
  type UsageBalancePayload,
} from "@/lib/langclaw-api";
import {
  defaultProductChain,
  productChainOptions,
  resolveProductChain,
  type ProductChain,
} from "@/lib/chains";
import { isMiniPayProvider } from "@/lib/minipay";
import { cn } from "@/lib/utils";

const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const HIDDEN_DESKTOP_METRIC_CLASS_NAME = "hidden sm:block";

type WalletSession = ReturnType<typeof useWalletSession>;

type WalletBalanceView = {
  decimals: number;
  symbol: string;
  value: bigint;
};

type UsageMetricItem = {
  className?: string;
  isLoading: boolean;
  label: string;
  unit: string;
  value: string;
};

type UserUsageBarModel = {
  accountLabel: string;
  chainBadgeLabel: string;
  chainConfig: ProductChain;
  chainOptions: ProductChain[];
  error: string;
  hasMiniPayConnectError: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isLoadingBalance: boolean;
  isMiniPay: boolean;
  isSigning: boolean;
  isSwitchingChain: boolean;
  metrics: UsageMetricItem[];
  onChainChange: (value: string) => void;
  onOpenWalletModal: WalletSession["openWalletModal"];
  onRefreshBalance: () => Promise<void>;
  selectedChain: ProductChainId;
};

type UseUsageBalanceStateParams = {
  address: WalletSession["address"];
  chainName: string;
  getWalletAuth: WalletSession["getWalletAuth"];
  isConnected: WalletSession["isConnected"];
  selectedChain: ProductChainId;
};

type UseUsageWalletBalanceParams = {
  address: WalletSession["address"];
  chainConfig: ProductChain;
};

export function UserUsageBar() {
  const model = useUserUsageBarModel();

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start">
        <UsageBarHeader
          accountLabel={model.accountLabel}
          chainBadgeLabel={model.chainBadgeLabel}
          chainConfig={model.chainConfig}
          chainOptions={model.chainOptions}
          isMiniPay={model.isMiniPay}
          isSwitchingChain={model.isSwitchingChain}
          onChainChange={model.onChainChange}
          selectedChain={model.selectedChain}
        />
        <UsageBarActions
          error={model.error}
          isConnected={model.isConnected}
          isConnecting={model.isConnecting}
          isLoadingBalance={model.isLoadingBalance}
          isMiniPay={model.isMiniPay}
          isSigning={model.isSigning}
          isSwitchingChain={model.isSwitchingChain}
          onOpenWalletModal={model.onOpenWalletModal}
          onRefreshBalance={model.onRefreshBalance}
        />
        <UsageBarMetrics items={model.metrics} />
      </div>
      <UsageBarStatus
        error={model.error}
        hasMiniPayConnectError={model.hasMiniPayConnectError}
      />
    </section>
  );
}

function useUserUsageBarModel(): UserUsageBarModel {
  const activeChainId = useChainId();
  const configuredChains = useChains();
  const switchChain = useSwitchChain();
  const isMiniPay = useIsMiniPay();
  const {
    address,
    connectError,
    getWalletAuth,
    isConnected,
    isConnecting,
    isSigning,
    openWalletModal,
  } = useWalletSession();

  const selectedChain = resolveSelectedProductChain(activeChainId, isMiniPay);
  const chainConfig = resolveProductChain(selectedChain);
  const chainOptions = getConfiguredProductChains(configuredChains);
  const isActiveChain = isMiniPay || activeChainId === chainConfig.chainId;
  const chainBadgeLabel = getChainBadgeLabel({
    chainName: chainConfig.name,
    isActiveChain,
    isMiniPay,
    isSwitchingChain: switchChain.isPending,
  });
  const accountLabel = getAccountLabel({
    address,
    isConnected,
    isConnecting,
    isMiniPay,
  });
  const {
    balance,
    error,
    isLoadingBalance,
    refreshBalance,
    resetBalance,
    setError,
  } = useUsageBalanceState({
    address,
    chainName: chainConfig.name,
    getWalletAuth,
    isConnected,
    selectedChain,
  });
  const { walletBalance, isLoadingWalletBalance } = useUsageWalletBalance({
    address,
    chainConfig,
  });
  const metrics = buildUsageMetricItems({
    balance,
    chainConfig,
    isConnected,
    isLoadingBalance,
    isLoadingWalletBalance,
    isMiniPay,
    walletBalance,
  });

  const onChainChange = useCallback(
    (value: string) => {
      const nextChainId = parseProductChainId(value);
      const nextChain = resolveProductChain(nextChainId);

      setError("");

      if (isMiniPay && nextChainId !== "celo") {
        return;
      }

      if (nextChainId === selectedChain && activeChainId === nextChain.chainId) {
        return;
      }

      switchChain.mutate(
        { chainId: nextChain.chainId },
        {
          onSuccess: () => {
            resetBalance();
          },
          onError: (err) => {
            const message = readFriendlyError(
              err,
              `Unable to switch to ${nextChain.name}.`,
            );
            setError(message);
            toast.error(message);
          },
        },
      );
    },
    [activeChainId, isMiniPay, resetBalance, selectedChain, setError, switchChain],
  );

  return {
    accountLabel,
    chainBadgeLabel,
    chainConfig,
    chainOptions,
    error,
    hasMiniPayConnectError: isMiniPay && Boolean(connectError),
    isConnected,
    isConnecting,
    isLoadingBalance,
    isMiniPay,
    isSigning,
    isSwitchingChain: switchChain.isPending,
    metrics,
    onChainChange,
    onOpenWalletModal: openWalletModal,
    onRefreshBalance: refreshBalance,
    selectedChain,
  };
}

function useUsageBalanceState({
  address,
  chainName,
  getWalletAuth,
  isConnected,
  selectedChain,
}: UseUsageBalanceStateParams) {
  const [balance, setBalance] = useState<UsageBalancePayload | null>(null);
  const [error, setError] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const requestIdRef = useRef(0);

  const resetBalance = useCallback(() => {
    setBalance(null);
    setError("");
    setIsLoadingBalance(false);
  }, []);

  const refreshBalance = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!isConnected || !address) {
      resetBalance();
      return;
    }

    setIsLoadingBalance(true);
    setError("");

    try {
      const cachedWallet = readCachedWalletAuth(address, selectedChain);

      if (isMiniPayProvider() && !cachedWallet) {
        setBalance(null);
        setIsLoadingBalance(false);
        return;
      }

      const wallet = cachedWallet ?? (await getWalletAuth({ chain: selectedChain }));
      const payload = await getUsageBalance(wallet, selectedChain);

      if (requestIdRef.current === requestId) {
        setBalance(payload);
      }
    } catch (err) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      const message = readFriendlyError(
        err,
        `Unable to load ${chainName} usage balance.`,
      );
      setError(message);
      toast.error(message);
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoadingBalance(false);
      }
    }
  }, [address, chainName, getWalletAuth, isConnected, resetBalance, selectedChain]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshBalance();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshBalance]);

  useEffect(() => {
    const handleWalletAuthUpdated = () => {
      void refreshBalance();
    };

    window.addEventListener(WALLET_AUTH_UPDATED_EVENT, handleWalletAuthUpdated);

    return () => {
      window.removeEventListener(
        WALLET_AUTH_UPDATED_EVENT,
        handleWalletAuthUpdated,
      );
    };
  }, [refreshBalance]);

  return {
    balance,
    error,
    isLoadingBalance,
    refreshBalance,
    resetBalance,
    setError,
  };
}

function useUsageWalletBalance({
  address,
  chainConfig,
}: UseUsageWalletBalanceParams) {
  const addressValue = address as `0x${string}` | undefined;
  const billingTokenAddress = chainConfig.billingCurrency.tokenAddress as
    | `0x${string}`
    | undefined;
  const isTokenBilling = Boolean(billingTokenAddress);
  const {
    data: nativeWalletBalance,
    isLoading: isLoadingNativeWalletBalance,
  } = useBalance({
    address: addressValue,
    chainId: chainConfig.chainId,
    query: { enabled: Boolean(addressValue && !isTokenBilling) },
  });
  const {
    data: tokenWalletBalanceData,
    isLoading: isLoadingTokenWalletBalance,
  } = useReadContract({
    abi: erc20Abi,
    address: billingTokenAddress,
    args: [addressValue ?? EMPTY_ADDRESS],
    chainId: chainConfig.chainId,
    functionName: "balanceOf",
    query: {
      enabled: Boolean(addressValue && billingTokenAddress && isTokenBilling),
    },
  });

  if (isTokenBilling && typeof tokenWalletBalanceData === "bigint") {
    return {
      isLoadingWalletBalance: isLoadingTokenWalletBalance,
      walletBalance: {
        decimals: chainConfig.billingCurrency.decimals,
        symbol: chainConfig.billingCurrency.symbol,
        value: tokenWalletBalanceData,
      } satisfies WalletBalanceView,
    };
  }

  return {
    isLoadingWalletBalance: isTokenBilling
      ? isLoadingTokenWalletBalance
      : isLoadingNativeWalletBalance,
    walletBalance: nativeWalletBalance
      ? {
          decimals: nativeWalletBalance.decimals,
          symbol: nativeWalletBalance.symbol,
          value: nativeWalletBalance.value,
        }
      : undefined,
  };
}

function UsageBarHeader({
  accountLabel,
  chainBadgeLabel,
  chainConfig,
  chainOptions,
  isMiniPay,
  isSwitchingChain,
  onChainChange,
  selectedChain,
}: {
  accountLabel: string;
  chainBadgeLabel: string;
  chainConfig: ProductChain;
  chainOptions: ProductChain[];
  isMiniPay: boolean;
  isSwitchingChain: boolean;
  onChainChange: (value: string) => void;
  selectedChain: ProductChainId;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <DatabaseIcon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium leading-none">Usage credits</p>
            <Badge variant={chainBadgeLabel === "Select chain" ? "outline" : "secondary"}>
              {chainBadgeLabel}
            </Badge>
          </div>
          <p className="mt-1 truncate text-muted-foreground text-xs">
            {accountLabel}
          </p>
        </div>
      </div>
      {isMiniPay ? (
        <Badge className="w-fit" variant="outline">
          USDT credits
        </Badge>
      ) : (
        <Select
          disabled={isSwitchingChain}
          onValueChange={onChainChange}
          value={selectedChain}
        >
          <SelectTrigger
            aria-label="Usage chain"
            className="w-full sm:w-44"
            size="sm"
          >
            <span className="truncate">
              {chainConfig.name} ({chainConfig.nativeSymbol})
            </span>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {chainOptions.map((chain) => (
                <SelectItem key={chain.id} value={chain.id}>
                  {chain.name} ({chain.nativeSymbol})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function UsageBarMetrics({ items }: { items: UsageMetricItem[] }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 lg:basis-full lg:grid-cols-4 lg:min-w-[34rem]">
      {items.map((item) => (
        <UsageMetric
          className={item.className}
          isLoading={item.isLoading}
          key={item.label}
          label={item.label}
          unit={item.unit}
          value={item.value}
        />
      ))}
    </div>
  );
}

function UsageBarActions({
  error,
  isConnected,
  isConnecting,
  isLoadingBalance,
  isMiniPay,
  isSigning,
  isSwitchingChain,
  onOpenWalletModal,
  onRefreshBalance,
}: {
  error: string;
  isConnected: boolean;
  isConnecting: boolean;
  isLoadingBalance: boolean;
  isMiniPay: boolean;
  isSigning: boolean;
  isSwitchingChain: boolean;
  onOpenWalletModal: WalletSession["openWalletModal"];
  onRefreshBalance: () => Promise<void>;
}) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {error ? (
          <Badge variant="destructive">
            <AlertCircleIcon data-icon="inline-start" />
            Issue
          </Badge>
        ) : null}
        <Button
          className="w-full sm:w-auto"
          disabled={isLoadingBalance || isSigning || isSwitchingChain}
          onClick={() => void onRefreshBalance()}
          size="sm"
          type="button"
          variant="outline"
        >
          {isLoadingBalance ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RefreshCcwIcon data-icon="inline-start" />
          )}
          Refresh
        </Button>
      </div>
    );
  }

  if (isMiniPay) {
    return (
      <div className="flex items-center gap-2">
        {error ? (
          <Badge variant="destructive">
            <AlertCircleIcon data-icon="inline-start" />
            Issue
          </Badge>
        ) : null}
        <Badge variant="outline">{isConnecting ? "Connecting" : "MiniPay"}</Badge>
        {isConnecting ? null : (
          <Button
            onClick={onOpenWalletModal}
            size="sm"
            type="button"
            variant="outline"
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <Badge variant="destructive">
          <AlertCircleIcon data-icon="inline-start" />
          Issue
        </Badge>
      ) : null}
      <Button
        className="w-full sm:w-auto"
        onClick={onOpenWalletModal}
        size="sm"
        type="button"
      >
        Connect
      </Button>
    </div>
  );
}

function UsageBarStatus({
  error,
  hasMiniPayConnectError,
}: {
  error: string;
  hasMiniPayConnectError: boolean;
}) {
  return (
    <>
      {error ? (
        <p className="text-destructive text-xs" role="status">
          {error}
        </p>
      ) : null}
      {hasMiniPayConnectError ? (
        <p className="text-destructive text-xs" role="status">
          Unlock MiniPay and try again.
        </p>
      ) : null}
    </>
  );
}

function UsageMetric({
  className,
  isLoading,
  label,
  unit,
  value,
}: {
  className?: string;
  isLoading: boolean;
  label: string;
  unit: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border bg-background px-2.5 py-2 sm:px-3",
        className,
      )}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-1 h-5 w-20" />
      ) : (
        <p
          className="mt-1 break-all font-semibold leading-tight text-sm sm:text-base"
          title={value}
        >
          {value}
        </p>
      )}
      <p className="mt-0.5 text-muted-foreground text-xs">{unit}</p>
    </div>
  );
}

function buildUsageMetricItems({
  balance,
  chainConfig,
  isConnected,
  isLoadingBalance,
  isLoadingWalletBalance,
  isMiniPay,
  walletBalance,
}: {
  balance: UsageBalancePayload | null;
  chainConfig: ProductChain;
  isConnected: boolean;
  isLoadingBalance: boolean;
  isLoadingWalletBalance: boolean;
  isMiniPay: boolean;
  walletBalance?: WalletBalanceView;
}): UsageMetricItem[] {
  const nativeSymbol = balance?.nativeSymbol ?? chainConfig.nativeSymbol;
  const shouldShowBalanceSkeleton = isLoadingBalance && !balance;
  const usageFallback = isConnected ? "0" : "-";

  return [
    {
      isLoading: isConnected && isLoadingWalletBalance && !walletBalance,
      label: isMiniPay ? "MiniPay" : "Wallet",
      unit: walletBalance?.symbol ?? chainConfig.nativeSymbol,
      value: getWalletMetricValue(walletBalance, isConnected),
    },
    {
      isLoading: shouldShowBalanceSkeleton,
      label: "Available",
      unit: nativeSymbol,
      value: formatUsageMetricAmount(
        balance?.balance.availableNative ?? balance?.balance.available0G,
        isMiniPay ? "Pending" : isConnected ? "0" : "Connect",
      ),
    },
    {
      className: HIDDEN_DESKTOP_METRIC_CLASS_NAME,
      isLoading: shouldShowBalanceSkeleton,
      label: "Reserved",
      unit: nativeSymbol,
      value: formatUsageMetricAmount(
        balance?.balance.reservedNative ?? balance?.balance.reserved0G,
        usageFallback,
      ),
    },
    {
      className: HIDDEN_DESKTOP_METRIC_CLASS_NAME,
      isLoading: shouldShowBalanceSkeleton,
      label: "Spent",
      unit: nativeSymbol,
      value: formatUsageMetricAmount(
        balance?.balance.lifetimeChargedNative ??
          balance?.balance.lifetimeCharged0G,
        usageFallback,
      ),
    },
  ];
}

function getWalletMetricValue(
  walletBalance: WalletBalanceView | undefined,
  isConnected: boolean,
) {
  if (!walletBalance) {
    return isConnected ? "0" : "-";
  }

  return formatTokenAmount(
    formatUnits(walletBalance.value, walletBalance.decimals),
  );
}

function formatUsageMetricAmount(value: string | undefined, fallback: string) {
  return formatTokenAmount(value ?? fallback);
}

function getConfiguredProductChains(
  configuredChains: ReturnType<typeof useChains>,
): ProductChain[] {
  const configuredChainIds = new Set(configuredChains.map((chain) => chain.id));
  const configuredProductChains = productChainOptions.filter((chain) =>
    configuredChainIds.has(chain.chainId),
  );

  return configuredProductChains.length
    ? configuredProductChains
    : productChainOptions;
}

function getChainBadgeLabel({
  chainName,
  isActiveChain,
  isMiniPay,
  isSwitchingChain,
}: {
  chainName: string;
  isActiveChain: boolean;
  isMiniPay: boolean;
  isSwitchingChain: boolean;
}) {
  if (isSwitchingChain) {
    return "Switching";
  }

  if (!isActiveChain) {
    return "Select chain";
  }

  return isMiniPay ? "Celo / USDT" : chainName;
}

function getAccountLabel({
  address,
  isConnected,
  isConnecting,
  isMiniPay,
}: {
  address: WalletSession["address"];
  isConnected: boolean;
  isConnecting: boolean;
  isMiniPay: boolean;
}) {
  if (isMiniPay) {
    if (isConnecting) {
      return "Connecting to MiniPay...";
    }

    return isConnected ? "MiniPay account connected" : "Open MiniPay account";
  }

  return isConnected && address ? shortenAddress(address) : "Wallet not connected";
}

function resolveSelectedProductChain(
  activeChainId: number,
  isMiniPay: boolean,
): ProductChainId {
  return isMiniPay ? "celo" : resolveProductChainId(activeChainId);
}

function resolveProductChainId(chainId: number): ProductChainId {
  return (
    productChainOptions.find((chain) => chain.chainId === chainId)?.id ??
    defaultProductChain
  );
}

function parseProductChainId(value: string): ProductChainId {
  return value === "celo" ? "celo" : defaultProductChain;
}

function formatTokenAmount(value: string) {
  const trimmedValue = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(trimmedValue);

  if (!match) {
    return value;
  }

  const [, sign, wholeValue, fractionValue = ""] = match;
  const cents = fractionValue.padEnd(2, "0").slice(0, 2);
  const shouldRound = Number(fractionValue[2] ?? "0") >= 5;

  if (!shouldRound) {
    return `${sign}${trimInteger(wholeValue)}.${cents}`;
  }

  const roundedCents = BigInt(`${wholeValue}${cents}`) + BigInt(1);
  const roundedValue = roundedCents.toString().padStart(3, "0");
  const roundedWhole = roundedValue.slice(0, -2);
  const roundedFraction = roundedValue.slice(-2);

  return `${sign}${trimInteger(roundedWhole)}.${roundedFraction}`;
}

function trimInteger(value: string) {
  return value.replace(/^0+(?=\d)/, "");
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

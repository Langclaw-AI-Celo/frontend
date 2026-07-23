"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CopyIcon,
  InfoIcon,
  Loader2Icon,
  RefreshCcwIcon,
  SendIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { erc20Abi, formatUnits, type Address, type Hash } from "viem";
import {
  useBalance,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  cacheWalletAuth,
  readCachedWalletAuth,
  useWalletSession,
} from "@/hooks/use-wallet-session";
import { useIsMiniPay } from "@/hooks/use-minipay";
import {
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  readFriendlyError,
  requestUsageWithdraw,
  verifyUsageDeposit,
  type UsageBalancePayload,
  type UsageDepositVerifyPayload,
  type UsageQuotePayload,
  type UsageVaultInfoPayload,
  type UsageWithdrawRequestPayload,
  type ProductChainId,
} from "@/lib/langclaw-api";
import {
  defaultProductChain,
  productChainOptions,
  resolveProductChain,
} from "@/lib/chains";
import {
  verifyCeloAttributionTransaction,
  withCeloAttribution,
} from "@/lib/celo-attribution";
import {
  parsePositiveBillingAmount,
  validateDepositTransaction,
  validateWithdrawalTransaction,
} from "@/lib/credits-validation";
import { createDepositClaim } from "@/lib/deposit-claim";
import {
  createUsageRequestCoordinator,
  shouldDisableBalanceRefresh,
  shouldDisableChainSelection,
  shouldResetMiniPayChain,
} from "@/lib/latest-request";
import { isMiniPayProvider } from "@/lib/minipay";
import { cn } from "@/lib/utils";

const usageVaultAbi = [
  {
    inputs: [{ name: "depositReference", type: "bytes32" }],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "depositReference", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    name: "depositTokenAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payer", type: "address" }],
    name: "authorizedWithdrawals",
    outputs: [{ name: "amount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawalAuthority",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function UsagePage() {
  const { address, getWalletAuth, isConnected, isSigning } = useWalletSession();
  const isMiniPay = useIsMiniPay();
  const [selectedChain, setSelectedChain] =
    useState<ProductChainId>(defaultProductChain);
  const chainConfig = resolveProductChain(selectedChain);
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: chainConfig.chainId });
  const { isPending: isApprovePending, writeContractAsync: writeApproveAsync } =
    useWriteContract();
  const { isPending: isDepositPending, writeContractAsync: writeDepositAsync } =
    useWriteContract();
  const {
    isPending: isWithdrawPending,
    writeContractAsync: writeWithdrawAsync,
  } = useWriteContract();
  const [quote, setQuote] = useState<UsageQuotePayload | null>(null);
  const [balance, setBalance] = useState<UsageBalancePayload | null>(null);
  const [vaultInfo, setVaultInfo] = useState<
    UsageVaultInfoPayload | UsageWithdrawRequestPayload | null
  >(null);
  const [deposit, setDeposit] = useState<UsageDepositVerifyPayload | null>(
    null,
  );
  const [withdraw, setWithdraw] = useState<UsageWithdrawRequestPayload | null>(
    null,
  );
  const [depositAmount, setDepositAmount] = useState("0.1");
  const [depositClaimSecret, setDepositClaimSecret] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositHash, setDepositHash] = useState<Hash | undefined>();
  const [withdrawHash, setWithdrawHash] = useState<Hash | undefined>();
  const [txHash, setTxHash] = useState("");
  const [claimSecret, setClaimSecret] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const autoCreditHashRef = useRef("");
  const usageRequestsRef = useRef(
    createUsageRequestCoordinator(defaultProductChain),
  );
  const verifiedAttributionHashesRef = useRef(new Set<string>());
  const resetUsageChainState = useCallback((nextChain: ProductChainId) => {
    usageRequestsRef.current.setContext(nextChain);
    setSelectedChain(nextChain);
    setQuote(null);
    setBalance(null);
    setVaultInfo(null);
    setDeposit(null);
    setWithdraw(null);
    setDepositHash(undefined);
    setWithdrawHash(undefined);
    setTxHash("");
    setReference("");
    setError("");
    setLoading("");
    setIsBalanceLoading(false);
    autoCreditHashRef.current = "";
  }, []);
  const {
    data: depositReceipt,
    isLoading: isConfirmingDeposit,
    isSuccess: isDepositConfirmed,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  const {
    data: withdrawReceipt,
    isLoading: isConfirmingWithdraw,
    isSuccess: isWithdrawConfirmed,
  } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  const vaultAddress = (vaultInfo?.vaultAddress ?? withdraw?.vaultAddress) as
    | `0x${string}`
    | undefined;
  const connectedWalletAddress = address as `0x${string}` | undefined;
  const billingCurrency =
    vaultInfo?.billingCurrency ??
    withdraw?.billingCurrency ??
    chainConfig.billingCurrency;
  const billingSymbol =
    balance?.nativeSymbol ?? billingCurrency.symbol ?? chainConfig.billingCurrency.symbol;
  const billingDecimals = billingCurrency.decimals;
  const billingTokenAddress = billingCurrency.tokenAddress as
    | Address
    | undefined;
  const feeCurrencyAddress = billingCurrency.feeCurrencyAddress as
    | Address
    | undefined;
  const isTokenBilling = Boolean(billingTokenAddress);
  const {
    data: nativeWalletBalance,
    isLoading: isLoadingNativeWalletBalance,
  } = useBalance({
    address: connectedWalletAddress,
    chainId: chainConfig.chainId,
    query: {
      enabled: Boolean(connectedWalletAddress && !isTokenBilling),
    },
  });
  const {
    data: tokenWalletBalanceData,
    isLoading: isLoadingTokenWalletBalance,
  } = useReadContract({
    abi: erc20Abi,
    address: billingTokenAddress,
    args: [
      connectedWalletAddress ?? "0x0000000000000000000000000000000000000000",
    ],
    functionName: "balanceOf",
    chainId: chainConfig.chainId,
    query: {
      enabled: Boolean(isTokenBilling && billingTokenAddress && connectedWalletAddress),
    },
  });
  const walletBalance =
    isTokenBilling && typeof tokenWalletBalanceData === "bigint"
      ? {
          decimals: billingDecimals,
          symbol: billingSymbol,
          value: tokenWalletBalanceData,
        }
      : nativeWalletBalance;
  const isLoadingWalletBalance = isTokenBilling
    ? isLoadingTokenWalletBalance
    : isLoadingNativeWalletBalance;
  const {
    data: authorizedWithdrawalData,
    isLoading: isLoadingAuthorizedWithdrawal,
    refetch: refetchAuthorizedWithdrawal,
  } = useReadContract({
    abi: usageVaultAbi,
    address: vaultAddress,
    args: [
      connectedWalletAddress ?? "0x0000000000000000000000000000000000000000",
    ],
    functionName: "authorizedWithdrawals",
    chainId: chainConfig.chainId,
    query: {
      enabled: Boolean(vaultAddress && connectedWalletAddress),
    },
  });
  const {
    data: depositAllowanceData,
    isLoading: isLoadingDepositAllowance,
    refetch: refetchDepositAllowance,
  } = useReadContract({
    abi: erc20Abi,
    address: billingTokenAddress,
    args: [
      connectedWalletAddress ?? "0x0000000000000000000000000000000000000000",
      vaultAddress ?? "0x0000000000000000000000000000000000000000",
    ],
    functionName: "allowance",
    chainId: chainConfig.chainId,
    query: {
      enabled: Boolean(isTokenBilling && billingTokenAddress && vaultAddress && connectedWalletAddress),
    },
  });
  const { data: withdrawalAuthorityData, refetch: refetchWithdrawalAuthority } =
    useReadContract({
      abi: usageVaultAbi,
      address: vaultAddress,
      functionName: "withdrawalAuthority",
      chainId: chainConfig.chainId,
      query: {
        enabled: Boolean(vaultAddress),
      },
    });
  const {
    data: vaultPausedData,
    isLoading: isLoadingVaultPaused,
    refetch: refetchVaultPaused,
  } = useReadContract({
    abi: usageVaultAbi,
    address: vaultAddress,
    functionName: "paused",
    chainId: chainConfig.chainId,
    query: {
      enabled: Boolean(vaultAddress),
    },
  });
  const authorizedWithdrawal =
    typeof authorizedWithdrawalData === "bigint"
      ? authorizedWithdrawalData
      : BigInt(0);
  const parsedWithdrawAmount = useMemo(
    () => parsePositiveBillingAmount(withdrawAmount, billingDecimals),
    [billingDecimals, withdrawAmount],
  );
  const parsedDepositAmount = useMemo(
    () => parsePositiveBillingAmount(depositAmount, billingDecimals),
    [billingDecimals, depositAmount],
  );
  const walletBillingBalance = walletBalance
    ? `${trimDecimal(formatUnits(walletBalance.value, walletBalance.decimals))} ${walletBalance.symbol}`
    : "";
  const hasNoBillingBalance =
    isConnected &&
    walletBalance !== undefined &&
    walletBalance.value === BigInt(0);
  const depositExceedsWalletBalance =
    parsedDepositAmount !== null &&
    walletBalance !== undefined &&
    parsedDepositAmount > walletBalance.value;
  const depositAllowance =
    typeof depositAllowanceData === "bigint" ? depositAllowanceData : BigInt(0);
  const needsDepositApproval =
    isTokenBilling &&
    parsedDepositAmount !== null &&
    depositAllowance < parsedDepositAmount;
  const isVaultPaused = vaultPausedData === true;
  const withdrawalAmountIsCovered =
    parsedWithdrawAmount !== null &&
    parsedWithdrawAmount <= authorizedWithdrawal;
  const canWithdrawOnchain =
    Boolean(vaultAddress) &&
    isConnected &&
    parsedWithdrawAmount !== null &&
    withdrawalAmountIsCovered &&
    !isVaultPaused &&
    !isWithdrawPending &&
    !isConfirmingWithdraw &&
    loading !== "onchain-withdraw";
  const isChainSelectionDisabled = shouldDisableChainSelection({
    isConfirmingTransaction: isConfirmingDeposit || isConfirmingWithdraw,
    isPendingTransaction:
      isApprovePending || isDepositPending || isWithdrawPending,
    isSigning,
    operationLoading: loading,
  });

  const regenerateDepositClaim = useCallback(() => {
    const claim = createDepositClaim();

    setDepositClaimSecret(claim.claimSecret);
    setDepositReference(claim.reference);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      regenerateDepositClaim();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [regenerateDepositClaim]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (shouldResetMiniPayChain(isMiniPay, selectedChain)) {
        resetUsageChainState("celo");
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isMiniPay, resetUsageChainState, selectedChain]);

  const getUsageWalletAuth = useCallback(async (chain = selectedChain) => {
    if (isMiniPayProvider() && address) {
      return readCachedWalletAuth(address, chain) ?? { address };
    }

    return getWalletAuth({ chain });
  }, [address, getWalletAuth, selectedChain]);

  const verifyConfirmedAttribution = useCallback(
    async (hash: Hash) => {
      const requestChain = selectedChain;

      if (
        !publicClient ||
        requestChain !== "celo" ||
        !usageRequestsRef.current.isCurrentContext(requestChain) ||
        verifiedAttributionHashesRef.current.has(hash)
      ) {
        return;
      }

      verifiedAttributionHashesRef.current.add(hash);
      const result = await verifyCeloAttributionTransaction({
        chain: requestChain,
        getTransaction: (transactionHash) =>
          publicClient.getTransaction({ hash: transactionHash }),
        hash,
      });

      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      if (result.status === "verified" || result.status === "skipped") {
        return;
      }

      const description =
        result.status === "mismatch"
          ? `Expected ${result.expectedCodes.join(", ")}; found ${result.codes.join(", ")}.`
          : result.status === "missing"
            ? "Confirmed calldata does not contain an ERC-8021 attribution tag."
            : "The RPC could not read the confirmed transaction calldata.";

      toast.warning("Celo attribution was not verified", { description });
    },
    [publicClient, selectedChain],
  );

  const loadQuote = useCallback(async (requestChain = selectedChain) => {
    await usageRequestsRef.current.runQuote(
      requestChain,
      () => getUsageQuote(requestChain),
      {
        onError(err) {
          const message = readFriendlyError(err, "Unable to load quote.");
          setError(message);
          toast.error(message);
        },
        onSuccess(payload) {
          setQuote(payload);
        },
      },
    );
  }, [selectedChain]);

  const refreshBalance = useCallback(async (requestChain = selectedChain) => {
    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    if (!isConnected) {
      usageRequestsRef.current.invalidateBalance();
      setBalance(null);
      setVaultInfo(null);
      setIsBalanceLoading(false);
      return;
    }

    setIsBalanceLoading(true);
    setError("");

    await usageRequestsRef.current.runBalance(
      requestChain,
      async () => {
        if (
          isMiniPayProvider() &&
          address &&
          !readCachedWalletAuth(address, requestChain)
        ) {
          return {
            balance: null,
            vault: await getUsageVaultInfo(requestChain),
          };
        }

        const wallet = await getUsageWalletAuth(requestChain);
        const [balance, vault] = await Promise.all([
          getUsageBalance(wallet, requestChain),
          requestUsageWithdraw(wallet, requestChain).catch(() => null),
        ]);

        return { balance, vault };
      },
      {
        onError(err) {
          const message = readFriendlyError(err, "Unable to load balance.");
          setError(message);
          toast.error(message);
        },
        onSettled() {
          setIsBalanceLoading(false);
        },
        onSuccess(result) {
          setBalance(result.balance);
          setVaultInfo(result.vault);
        },
      },
    );
  }, [address, getUsageWalletAuth, isConnected, selectedChain]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadQuote();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadQuote]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshBalance();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshBalance]);

  useEffect(() => {
    if (!isWithdrawConfirmed || !withdrawHash) {
      return;
    }

    void verifyConfirmedAttribution(withdrawHash);

    toast.success("Withdrawal completed", {
      description: `${shortHash(withdrawHash)} confirmed${
        withdrawReceipt?.blockNumber
          ? ` at block ${withdrawReceipt.blockNumber.toString()}`
          : ""
      }.`,
    });

    const timeoutId = window.setTimeout(() => {
      void refreshBalance();
      void refetchAuthorizedWithdrawal();
      void refetchVaultPaused();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    isWithdrawConfirmed,
    refetchAuthorizedWithdrawal,
    refetchVaultPaused,
    refreshBalance,
    verifyConfirmedAttribution,
    withdrawHash,
    withdrawReceipt?.blockNumber,
  ]);

  const handleRefreshVaultState = async () => {
    const requestChain = selectedChain;

    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    if (!vaultAddress) {
      showError(setError, "Load vault address first.");
      return;
    }

    setLoading("vault-state");
    setError("");

    await usageRequestsRef.current.runVaultState(
      requestChain,
      () => Promise.all([
        refetchAuthorizedWithdrawal(),
        refetchVaultPaused(),
        refetchWithdrawalAuthority(),
      ]),
      {
        onError(err) {
          const message = readFriendlyError(
            err,
            "Unable to refresh vault state.",
          );
          setError(message);
          toast.error(message);
        },
        onSettled() {
          setLoading("");
        },
        onSuccess() {
          toast.success("Vault state refreshed");
        },
      },
    );
  };

  const handleVerifyDeposit = useCallback(
    async (
      options: {
        claimSecret?: string;
        hash?: string;
        reference?: string;
        silent?: boolean;
      } = {},
    ) => {
      const requestChain = selectedChain;

      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      const hash = options.hash ?? (txHash.trim() || depositHash);

      if (!hash) {
        showError(setError, "Transaction hash is required.");
        return;
      }

      setLoading("deposit");
      setError("");
      setDeposit(null);
      let didVerify = false;

      await usageRequestsRef.current.runDeposit(
        requestChain,
        async () => {
          const wallet = await getUsageWalletAuth(requestChain);

          return verifyUsageDeposit({
            chain: requestChain,
            claimSecret:
              options.claimSecret ?? (claimSecret.trim() || undefined),
            reference: options.reference ?? (reference.trim() || undefined),
            txHash: hash,
            wallet,
          });
        },
        {
          onError(err) {
            const message = readFriendlyError(
              err,
              "Unable to verify deposit.",
            );
            setError(message);
            toast.error(message);
          },
          onSettled() {
            setLoading("");
          },
          onSuccess(payload) {
            didVerify = true;
            if (payload.walletSession?.sessionToken) {
              cacheWalletAuth(payload.walletSession, requestChain);
            }
            setDeposit(payload);
            toast.success(
              options.silent
                ? "Deposit credited automatically"
                : "Deposit credited",
              {
                description: `${payload.amountNative ?? payload.amount0G} ${
                  payload.nativeSymbol ?? billingSymbol
                } is ready to use.`,
              },
            );
          },
        },
      );

      if (didVerify) {
        await refreshBalance(requestChain);
      }
    },
    [
      billingSymbol,
      claimSecret,
      depositHash,
      getUsageWalletAuth,
      reference,
      refreshBalance,
      selectedChain,
      txHash,
    ],
  );

  useEffect(() => {
    if (
      !depositHash ||
      !isDepositConfirmed ||
      autoCreditHashRef.current === depositHash
    ) {
      return;
    }

    autoCreditHashRef.current = depositHash;
    void verifyConfirmedAttribution(depositHash);
    const timeoutId = window.setTimeout(() => {
      void handleVerifyDeposit({
        claimSecret,
        hash: depositHash,
        reference,
        silent: true,
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    depositHash,
    handleVerifyDeposit,
    isDepositConfirmed,
    claimSecret,
    reference,
    verifyConfirmedAttribution,
  ]);

  const handleSendDeposit = async () => {
    const requestChain = selectedChain;

    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    const depositVaultAddress = vaultInfo?.vaultAddress;

    if (!depositClaimSecret) {
      showError(setError, "Generate a private deposit claim first.");
      return;
    }

    const validationError = validateDepositTransaction({
      amount: parsedDepositAmount,
      billingSymbol,
      hasInsufficientWalletBalance:
        depositExceedsWalletBalance || hasNoBillingBalance,
      reference: depositReference,
      vaultAddress: depositVaultAddress,
    });

    if (validationError) {
      showError(setError, validationError);
      return;
    }

    const depositAmount = parsedDepositAmount!;
    const validatedVaultAddress = depositVaultAddress!;

    setLoading("send-deposit");
    setError("");
    setDeposit(null);

    try {
      await switchChainAsync?.({ chainId: chainConfig.chainId });
      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      const celoFeeRequest = feeCurrencyAddress
        ? { feeCurrency: feeCurrencyAddress }
        : {};

      if (isTokenBilling) {
        if (!billingTokenAddress) {
          showError(setError, `${billingSymbol} token address is not configured.`);
          return;
        }

        if (needsDepositApproval) {
          if (!publicClient) {
            showError(setError, "Network client is not ready.");
            return;
          }

          const approvalRequest = withCeloAttribution(requestChain, {
            abi: erc20Abi,
            address: billingTokenAddress,
            args: [validatedVaultAddress as Address, depositAmount],
            chainId: chainConfig.chainId,
            functionName: "approve",
            ...celoFeeRequest,
          });
          const approvalHash = await writeApproveAsync(
            approvalRequest as unknown as Parameters<typeof writeApproveAsync>[0],
          );

          if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
            return;
          }

          toast.success(`${billingSymbol} approval sent`, {
            description: `${shortHash(approvalHash)} is waiting for confirmation.`,
          });

          await publicClient.waitForTransactionReceipt({ hash: approvalHash });
          if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
            return;
          }

          await refetchDepositAllowance();
          if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
            return;
          }
        }
      }

      let hash: Hash;

      if (isTokenBilling) {
        const tokenDepositRequest = withCeloAttribution(requestChain, {
          abi: usageVaultAbi,
          address: validatedVaultAddress as `0x${string}`,
          args: [depositReference as `0x${string}`, depositAmount],
          chainId: chainConfig.chainId,
          functionName: "depositTokenAmount",
          ...celoFeeRequest,
        });
        hash = await writeDepositAsync(
          tokenDepositRequest as unknown as Parameters<
            typeof writeDepositAsync
          >[0],
        );
      } else {
        const nativeDepositRequest = withCeloAttribution(requestChain, {
          abi: usageVaultAbi,
          address: validatedVaultAddress as `0x${string}`,
          args: [depositReference as `0x${string}`],
          chainId: chainConfig.chainId,
          functionName: "deposit",
          value: depositAmount,
          ...celoFeeRequest,
        });
        hash = await writeDepositAsync(
          nativeDepositRequest as unknown as Parameters<
            typeof writeDepositAsync
          >[0],
        );
      }

      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      setDepositHash(hash);
      setTxHash(hash);
      setClaimSecret(depositClaimSecret);
      setReference(depositReference);
      regenerateDepositClaim();
      toast.success("Deposit transaction sent", {
        description: `${shortHash(hash)} is waiting for confirmation.`,
      });
    } catch (err) {
      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      const message = readFriendlyError(err, "Unable to send deposit.");
      setError(message);
      toast.error(message);
    } finally {
      if (usageRequestsRef.current.isCurrentContext(requestChain)) {
        setLoading("");
      }
    }
  };

  const handleLoadVault = async () => {
    const requestChain = selectedChain;

    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    setLoading("vault");
    setError("");

    await usageRequestsRef.current.runVault(
      requestChain,
      async () => {
        const cachedWallet = address
          ? readCachedWalletAuth(address, requestChain)
          : null;

        return isMiniPayProvider() && !cachedWallet
          ? getUsageVaultInfo(requestChain)
          : requestUsageWithdraw(
              cachedWallet ?? (await getWalletAuth({ chain: requestChain })),
              requestChain,
            );
      },
      {
        onError(err) {
          const message = readFriendlyError(err, "Unable to load vault.");
          setError(message);
          toast.error(message);
        },
        onSettled() {
          setLoading("");
        },
        onSuccess(payload) {
          setVaultInfo(payload);
          toast.success("Usage vault loaded", {
            description: shortHash(payload.vaultAddress),
          });
        },
      },
    );
  };

  const handleWithdrawRequest = async () => {
    const requestChain = selectedChain;

    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    if (!parsedWithdrawAmount) {
      showError(setError, "Enter a valid withdrawal amount greater than zero.");
      return;
    }

    setLoading("withdraw");
    setError("");
    setWithdraw(null);

    await usageRequestsRef.current.runWithdraw(
      requestChain,
      async () => {
        const wallet = await getUsageWalletAuth(requestChain);
        return requestUsageWithdraw(wallet, requestChain);
      },
      {
        onError(err) {
          const message = readFriendlyError(err, "Unable to request withdraw.");
          setError(message);
          toast.error(message);
        },
        onSettled() {
          setLoading("");
        },
        onSuccess(payload) {
          setWithdraw(payload);
          setVaultInfo(payload);
          toast.info("Withdraw request prepared", {
            description: "You can withdraw after Langclaw approves the amount.",
          });
        },
      },
    );
  };

  const handleWithdrawOnchain = async () => {
    const requestChain = selectedChain;

    if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
      return;
    }

    const validationError = validateWithdrawalTransaction({
      amount: parsedWithdrawAmount,
      isAuthorized: withdrawalAmountIsCovered,
      isVaultPaused,
      vaultAddress,
    });

    if (validationError) {
      showError(setError, validationError);
      return;
    }

    const withdrawalAmount = parsedWithdrawAmount!;

    setLoading("onchain-withdraw");
    setError("");

    try {
      await switchChainAsync?.({ chainId: chainConfig.chainId });
      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      const withdrawalRequest = withCeloAttribution(requestChain, {
        abi: usageVaultAbi,
        address: vaultAddress,
        args: [withdrawalAmount],
        chainId: chainConfig.chainId,
        functionName: "withdraw",
        ...(feeCurrencyAddress ? { feeCurrency: feeCurrencyAddress } : {}),
      });
      const hash = await writeWithdrawAsync(
        withdrawalRequest as unknown as Parameters<
          typeof writeWithdrawAsync
        >[0],
      );

      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      setWithdrawHash(hash);
      toast.success("Withdrawal transaction sent", {
        description: `${shortHash(hash)} is waiting for confirmation.`,
      });
    } catch (err) {
      if (!usageRequestsRef.current.isCurrentContext(requestChain)) {
        return;
      }

      const message = readFriendlyError(err, "Unable to withdraw from vault.");
      setError(message);
      toast.error(message);
    } finally {
      if (usageRequestsRef.current.isCurrentContext(requestChain)) {
        setLoading("");
      }
    }
  };

  const handleChainChange = (value: string) => {
    const nextChain = value === "celo" ? "celo" : "mantle";

    if (
      isChainSelectionDisabled ||
      (isMiniPay && nextChain !== "celo")
    ) {
      return;
    }

    resetUsageChainState(nextChain);
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">
            {isMiniPay ? "MiniPay credits" : "Credits & Balance"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Add {billingSymbol} credits, track spend, and withdraw unused balance.
          </p>
        </div>
        <Button
          disabled={shouldDisableBalanceRefresh({
            isBalanceLoading,
            isConnected,
            isSigning,
            operationLoading: loading,
          })}
          className="w-full sm:w-auto"
          onClick={() => void refreshBalance()}
          size="sm"
          variant="outline"
        >
          {isBalanceLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <RefreshCcwIcon className="size-4" />
          )}
          Refresh
        </Button>
      </div>

      {isMiniPay ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">Celo</Badge>
          <span className="text-muted-foreground">USDT credits</span>
        </div>
      ) : (
        <Select
          disabled={isChainSelectionDisabled}
          onValueChange={handleChainChange}
          value={selectedChain}
        >
          <SelectTrigger aria-label="Credits chain" className="w-40" size="sm">
            {chainConfig.name}
          </SelectTrigger>
          <SelectContent>
            {productChainOptions.map((chain) => (
              <SelectItem key={chain.id} value={chain.id}>
                {chain.name} ({chain.nativeSymbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something needs attention</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(hasNoBillingBalance || depositExceedsWalletBalance) && (
        <Alert>
          <InfoIcon className="size-4" />
          <AlertTitle>Insufficient account balance</AlertTitle>
          <AlertDescription>
            Your account has {walletBillingBalance || `0 ${billingSymbol}`}. Lower the deposit
            amount or add {billingSymbol} first.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
        <MetricCard
          label="Available"
          title={balance?.balance.availableNative ?? balance?.balance.available0G ?? "Connect wallet"}
          unit={billingSymbol}
        />
        <MetricCard
          label="Reserved"
          title={balance?.balance.reservedNative ?? balance?.balance.reserved0G ?? "0"}
          unit={billingSymbol}
        />
        <MetricCard
          className="col-span-2 sm:col-span-1"
          label="Estimated run"
          title={quote?.quote.estimatedCostNative ?? quote?.quote.estimatedCost0G ?? "Not available"}
          unit={quote?.quote.nativeSymbol ?? billingSymbol}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Balance overview</CardTitle>
            <CardDescription>
              Credits available for chat, research, and API requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">
                      {billingSymbol}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <UsageRow
                    label="Available"
                    token={balance?.balance.availableNative ?? balance?.balance.available0G}
                  />
                  <UsageRow
                    label="Reserved"
                    token={balance?.balance.reservedNative ?? balance?.balance.reserved0G}
                  />
                  <UsageRow
                    label="Lifetime deposited"
                    token={
                      balance?.balance.lifetimeDepositedNative ??
                      balance?.balance.lifetimeDeposited0G
                    }
                  />
                  <UsageRow
                    label="Lifetime charged"
                    token={
                      balance?.balance.lifetimeChargedNative ??
                      balance?.balance.lifetimeCharged0G
                    }
                  />
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Typical request</CardTitle>
            <CardDescription>
              Current estimate before a paid research run starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Detail label="Model" value={quote?.quote.model} />
            <Detail
              label="Estimated cost"
              value={
                quote?.quote.estimatedCostNative ?? quote?.quote.estimatedCost0G
                  ? `${quote.quote.estimatedCostNative ?? quote.quote.estimatedCost0G} ${quote.quote.nativeSymbol ?? billingSymbol}`
                  : undefined
              }
            />
            <Detail
              label="Prompt size"
              value={
                quote?.quote.estimatedPromptTokens
                  ? `${quote.quote.estimatedPromptTokens.toLocaleString()} tokens`
                  : undefined
              }
            />
            <Detail
              label="Answer size"
              value={
                quote?.quote.estimatedCompletionTokens
                  ? `${quote.quote.estimatedCompletionTokens.toLocaleString()} tokens`
                  : undefined
              }
            />
            <Detail
              label="Fetched"
              value={
                quote?.quote.priceFetchedAt
                  ? new Date(quote.quote.priceFetchedAt).toLocaleString()
                  : undefined
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg lg:col-span-2" size="sm">
          <CardHeader>
            <CardTitle>Add {billingSymbol} credits</CardTitle>
            <CardDescription>
              Confirm in {isMiniPay ? "MiniPay" : "your wallet"}. Langclaw
              updates your credits automatically after confirmation.
            </CardDescription>
            <CardAction>
              <Button
                disabled={loading === "vault" || isSigning}
                className="w-full sm:w-auto"
                onClick={() => void handleLoadVault()}
                size="sm"
                variant="outline"
              >
                {loading === "vault" ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <RefreshCcwIcon className="size-4" />
                )}
                Refresh vault
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="flex flex-col gap-2">
                <label className="text-sm" htmlFor="deposit-amount">
                  <span className="mb-1 block text-muted-foreground">
                    Amount
                  </span>
                  <Input
                    id="deposit-amount"
                    inputMode="decimal"
                    name="depositAmount"
                    onChange={(event) =>
                      setDepositAmount(event.currentTarget.value)
                    }
                    placeholder="0.1"
                    value={depositAmount}
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    disabled={
                      !vaultInfo?.vaultAddress ||
                      !isConnected ||
                      isDepositPending ||
                      isApprovePending ||
                      loading === "send-deposit" ||
                      !parsedDepositAmount ||
                      depositExceedsWalletBalance ||
                      hasNoBillingBalance
                    }
                    className="w-full sm:w-auto"
                    onClick={() => void handleSendDeposit()}
                    size="sm"
                  >
                    {isDepositPending || isApprovePending || loading === "send-deposit" ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <SendIcon className="size-4" />
                    )}
                    {needsDepositApproval ? "Approve & deposit" : "Send deposit"}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Account balance:{" "}
                  {isLoadingWalletBalance
                    ? "Loading"
                    : walletBillingBalance || "Connect wallet"}
                  {isTokenBilling && isLoadingDepositAllowance
                    ? " | allowance loading"
                    : ""}
                  </p>
              </div>
              <details className="group flex flex-col gap-2">
                <summary className="cursor-pointer text-muted-foreground text-sm">
                  Advanced receipt details
                </summary>
                <CopyField
                  copied={copied}
                  label="Vault address"
                  onCopy={setCopied}
                  value={vaultInfo?.vaultAddress ?? ""}
                />
                <CopyField
                  copied={copied}
                  label="Reference"
                  onCopy={setCopied}
                  value={depositReference}
                />
                <CopyField
                  copied={copied}
                  label="Private claim. Keep secret"
                  onCopy={setCopied}
                  value={depositClaimSecret}
                />
                <Button
                  className="w-full sm:w-fit"
                  onClick={regenerateDepositClaim}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Generate new claim
                </Button>
              </details>
            </div>
            <DepositStatus
              credited={deposit}
              hash={depositHash}
              isConfirmed={isDepositConfirmed}
              isConfirming={isConfirmingDeposit}
              receiptBlock={depositReceipt?.blockNumber?.toString()}
              symbol={billingSymbol}
            />
          </CardContent>
        </Card>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Credit existing deposit</CardTitle>
            <CardDescription>
              Paste a transaction hash to reconcile an older deposit.
            </CardDescription>
            <CardAction>
              <Button
                disabled={loading === "deposit" || isSigning}
                className="w-full sm:w-auto"
                onClick={() => void handleVerifyDeposit()}
                size="sm"
              >
                {loading === "deposit" ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ShieldCheckIcon className="size-4" />
                )}
                Verify
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label
                className="text-muted-foreground text-sm"
                htmlFor="existing-deposit-hash"
              >
                Transaction hash
              </label>
              <Input
                id="existing-deposit-hash"
                name="existingDepositHash"
                onChange={(event) => setTxHash(event.currentTarget.value)}
                placeholder="0x transaction hash"
                value={txHash}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="text-muted-foreground text-sm"
                htmlFor="existing-deposit-reference"
              >
                Reference
              </label>
              <Input
                id="existing-deposit-reference"
                name="existingDepositReference"
                onChange={(event) => setReference(event.currentTarget.value)}
                placeholder="reference (optional for receive deposits)"
                value={reference}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="text-muted-foreground text-sm"
                htmlFor="existing-deposit-claim"
              >
                Private claim
              </label>
              <Input
                autoComplete="off"
                id="existing-deposit-claim"
                name="existingDepositClaim"
                onChange={(event) => setClaimSecret(event.currentTarget.value)}
                placeholder="private claim for address-only verification"
                spellCheck={false}
                type="password"
                value={claimSecret}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Paste the reference for deposits sent outside the app. MiniPay
              also needs the private claim. A signed or cached wallet session
              can omit it.
            </p>
            {deposit && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <Detail
                  label="Credited"
                  value={deposit.credited ? "yes" : "no"}
                />
                <Detail
                  label="Amount"
                  value={`${deposit.amountNative ?? deposit.amount0G} ${deposit.nativeSymbol ?? billingSymbol}`}
                />
                <Detail
                  label="Balance after"
                  value={formatBillingNeuron(deposit.balanceAfter, billingDecimals)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Withdraw {billingSymbol}</CardTitle>
            <CardDescription>
              Prepare a withdrawal, then confirm it from{" "}
              {isMiniPay ? "MiniPay" : "your wallet"}.
            </CardDescription>
            <CardAction>
              <Button
                disabled={loading === "vault-state" || !vaultAddress}
                className="w-full sm:w-auto"
                onClick={() => void handleRefreshVaultState()}
                size="sm"
                variant="outline"
              >
                {loading === "vault-state" ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <RefreshCcwIcon className="size-4" />
                )}
                Refresh
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <label className="text-sm" htmlFor="withdraw-amount">
              <span className="mb-1 block text-muted-foreground">
                Amount to withdraw
              </span>
              <Input
                id="withdraw-amount"
                inputMode="decimal"
                name="withdrawAmount"
                onChange={(event) =>
                  setWithdrawAmount(event.currentTarget.value)
                }
                placeholder="0.05"
                value={withdrawAmount}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading === "withdraw" || isSigning || !isConnected}
                className="flex-1 sm:flex-none"
                onClick={() => void handleWithdrawRequest()}
                size="sm"
                variant="outline"
              >
                {loading === "withdraw" && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Prepare
              </Button>
              <Button
                disabled={!canWithdrawOnchain}
                className="flex-1 sm:flex-none"
                onClick={() => void handleWithdrawOnchain()}
                size="sm"
              >
                {isWithdrawPending ||
                isConfirmingWithdraw ||
                loading === "onchain-withdraw" ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                Withdraw
              </Button>
            </div>
            <Detail
              label="Vault"
              value={withdraw?.vaultAddress ?? vaultInfo?.vaultAddress}
            />
            <Detail label="Function" value={withdraw?.functionName} />
            <Detail
              label="Available"
              value={withdraw?.balance.availableNative ?? withdraw?.balance.available0G}
            />
            <Detail
              label="Authorized"
              value={
                isLoadingAuthorizedWithdrawal
                  ? "Loading"
                  : `${formatBillingUnits(authorizedWithdrawal, billingDecimals)} ${billingSymbol}`
              }
            />
            <Detail
              label="Requested amount"
              value={
                parsedWithdrawAmount === null
                  ? "Not available"
                  : `${formatBillingUnits(parsedWithdrawAmount, billingDecimals)} ${billingSymbol}`
              }
            />
            <Detail
              label="Withdrawal authority"
              value={String(withdrawalAuthorityData ?? "")}
            />
            <div
              aria-atomic="true"
              aria-label="Withdrawal transaction status"
              aria-live="polite"
              className="flex flex-wrap items-center gap-2"
              role="status"
            >
              <StatusBadge
                label={
                  isLoadingVaultPaused
                    ? "Vault loading"
                    : isVaultPaused
                      ? "Vault paused"
                      : "Vault active"
                }
                variant={isVaultPaused ? "destructive" : "secondary"}
              />
              <StatusBadge
                label={
                  withdrawalAmountIsCovered
                    ? "Allowance ready"
                    : "Waiting authorization"
                }
                variant={withdrawalAmountIsCovered ? "secondary" : "outline"}
              />
              {withdrawHash && (
                <StatusBadge
                  label={
                    isWithdrawConfirmed
                      ? `Withdraw confirmed${withdrawReceipt?.blockNumber ? ` #${withdrawReceipt.blockNumber.toString()}` : ""}`
                      : isConfirmingWithdraw
                        ? "Withdraw confirming"
                        : shortHash(withdrawHash) || "Withdraw sent"
                  }
                  variant={isWithdrawConfirmed ? "secondary" : "outline"}
                />
              )}
            </div>
            <Alert>
              <ShieldCheckIcon className="size-4" />
              <AlertTitle>Withdrawal approval</AlertTitle>
              <AlertDescription>
                The withdraw button unlocks once Langclaw approves this wallet
                and amount.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  className,
  label,
  title,
  unit,
}: {
  className?: string;
  label: string;
  title: string;
  unit: string;
}) {
  return (
    <Card className={cn("rounded-md", className)} size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="break-all text-xl sm:text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">
        {unit}
      </CardContent>
    </Card>
  );
}

function UsageRow({
  label,
  token,
}: {
  label: string;
  token?: string;
}) {
  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell className="text-right">{token ?? "Not available"}</TableCell>
    </TableRow>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value ?? "Not available"}</span>
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}) {
  return <Badge variant={variant}>{label}</Badge>;
}

function CopyField({
  copied,
  label,
  onCopy,
  value,
}: {
  copied: string;
  label: string;
  onCopy: (value: string) => void;
  value: string;
}) {
  const handleCopy = async () => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    onCopy(label);
    window.setTimeout(() => onCopy(""), 1200);
  };

  return (
    <div className="rounded-md border bg-muted/20 p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{label}</span>
        <Button
          aria-label={copied === label ? `${label} copied` : `Copy ${label}`}
          disabled={!value}
          onClick={() => void handleCopy()}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          {copied === label ? (
            <CheckCircle2Icon className="size-3" />
          ) : (
            <CopyIcon className="size-3" />
          )}
        </Button>
      </div>
      <p className="break-all font-mono text-xs">
        {value || "Load vault first"}
      </p>
    </div>
  );
}

function DepositStatus({
  credited,
  hash,
  isConfirmed,
  isConfirming,
  receiptBlock,
  symbol,
}: {
  credited: UsageDepositVerifyPayload | null;
  hash?: string;
  isConfirmed: boolean;
  isConfirming: boolean;
  receiptBlock?: string;
  symbol: string;
}) {
  if (!hash && !credited) {
    return (
      <div className="grid gap-2 text-sm md:grid-cols-3">
        <Step label="1" text="Load vault" />
        <Step label="2" text="Confirm deposit" />
        <Step label="3" text="Credit updates automatically" />
      </div>
    );
  }

  return (
    <div
      aria-atomic="true"
      aria-label="Deposit transaction status"
      aria-live="polite"
      className="rounded-md border bg-muted/30 p-3 text-sm"
      role="status"
    >
      <div className="grid gap-2 md:grid-cols-3">
        <Detail label="Tx hash" value={shortHash(hash)} />
        <Detail
          label="Confirmation"
          value={
            isConfirmed
              ? `confirmed${receiptBlock ? ` at ${receiptBlock}` : ""}`
              : isConfirming
                ? "confirming"
                : "pending"
          }
        />
        <Detail
          label="Credit"
          value={
            credited
              ? `${credited.credited ? "credited" : "already credited"} ${credited.amountNative ?? credited.amount0G} ${credited.nativeSymbol ?? symbol}`
              : isConfirmed
                ? "crediting"
                : "waiting for confirmation"
          }
        />
      </div>
    </div>
  );
}

function Step({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
        {label}
      </span>
      <span>{text}</span>
    </div>
  );
}

function shortHash(value?: string) {
  return value && value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}

function formatBillingUnits(value: bigint, decimals: number) {
  return trimDecimal(formatUnits(value, decimals));
}

function showError(setError: (message: string) => void, message: string) {
  setError(message);
  toast.error(message);
}

function formatBillingNeuron(value: string, decimals: number) {
  try {
    return trimDecimal(formatUnits(BigInt(value), decimals));
  } catch {
    return value;
  }
}

function trimDecimal(value: string) {
  return value.includes(".")
    ? value.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "")
    : value;
}

import {
  LangclawApiError,
  isConsistentProductChainResponse,
  isEvmAddressResponse,
  isNonEmptyResponseString,
  isNonNegativeResponseInteger,
  isOptionalPositiveResponseInteger,
  isOptionalProductChain,
  isOptionalResponseString,
  isResponseObject,
  isTransactionHashResponse,
  isValidResponseTimestamp,
  isWalletSession,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type {
  ProductChainId,
  UsageBalance,
  UsageBalancePayload,
  UsageDepositVerifyPayload,
  UsageQuote,
  UsageQuotePayload,
  UsageVaultInfoPayload,
  UsageWithdrawRequestPayload,
  WalletAuth,
} from "./types.ts";

export async function getUsageBalance(wallet: WalletAuth, chain?: ProductChainId) {
  const response = await postJson("/api/usage/balance", { chain, wallet });
  const payload = await readJsonResponse<UsageBalancePayload>(response);

  if (!isUsageBalancePayload(payload, wallet, chain)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function getUsageQuote(chain?: ProductChainId) {
  const response = await postJson("/api/usage/quote", { chain });
  const payload = await readJsonResponse<UsageQuotePayload>(response);

  if (payload.configured !== true || !isUsageQuote(payload.quote, chain)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function getUsageVaultInfo(chain?: ProductChainId) {
  const response = await postJson("/api/usage/vault", { chain });
  const payload = await readJsonResponse<UsageVaultInfoPayload>(response);

  if (!isUsageVaultInfo(payload, chain)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function verifyUsageDeposit(input: {
  chain?: ProductChainId;
  reference?: string;
  txHash: string;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/usage/deposit/verify", input);
  const payload = await readJsonResponse<UsageDepositVerifyPayload>(response);

  if (!isUsageDeposit(payload, input)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function requestUsageWithdraw(
  wallet: WalletAuth,
  chain?: ProductChainId
) {
  const response = await postJson("/api/usage/withdraw/request", { chain, wallet });
  const payload = await readJsonResponse<UsageWithdrawRequestPayload>(response);

  if (!isUsageWithdrawRequest(payload, wallet, chain)) {
    throw invalidUsageResponse();
  }

  return payload;
}

function isUsageBalancePayload(
  value: unknown,
  wallet: WalletAuth,
  requestedChain?: ProductChainId,
): value is UsageBalancePayload {
  if (!isResponseObject(value)) {
    return false;
  }

  const balance = value.balance;
  const quote = value.quote;
  const responseChain = readResponseChain(value.chain) ?? requestedChain;

  return (
    value.configured === true &&
    matchesRequestedChain(value, requestedChain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    matchesWalletAddress(value.wallet, wallet.address) &&
    isUsageBalance(balance, responseChain) &&
    (quote === undefined || isUsageQuote(quote, responseChain)) &&
    (!isResponseObject(balance) ||
      value.chain === undefined ||
      balance.chain === undefined ||
      value.chain === balance.chain) &&
    (!isResponseObject(balance) ||
      value.chainId === undefined ||
      balance.chainId === undefined ||
      value.chainId === balance.chainId)
  );
}

function isNonNegativeIntegerResponseString(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

function isOptionalNonNegativeIntegerResponseString(value: unknown) {
  return value === undefined || isNonNegativeIntegerResponseString(value);
}

function isNonNegativeDecimalResponseString(value: unknown): value is string {
  return typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value);
}

function isOptionalNonNegativeDecimalResponseString(value: unknown) {
  return value === undefined || isNonNegativeDecimalResponseString(value);
}

function isUsageBalance(
  value: unknown,
  requestedChain?: ProductChainId,
): value is UsageBalance {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    matchesRequestedChain(value, requestedChain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.nativeSymbol) &&
    [
      value.availableNeuron,
      value.reservedNeuron,
      value.lifetimeDepositedNeuron,
      value.lifetimeChargedNeuron,
    ].every(isNonNegativeIntegerResponseString) &&
    [
      value.available0G,
      value.reserved0G,
      value.lifetimeDeposited0G,
      value.lifetimeCharged0G,
    ].every(isNonNegativeDecimalResponseString) &&
    [
      value.availableNative,
      value.reservedNative,
      value.lifetimeDepositedNative,
      value.lifetimeChargedNative,
    ].every(isOptionalNonNegativeDecimalResponseString)
  );
}

function isUsageQuote(
  value: unknown,
  requestedChain?: ProductChainId,
): value is UsageQuote {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    matchesRequestedChain(value, requestedChain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    isNonEmptyResponseString(value.model) &&
    isNonEmptyResponseString(value.endpoint) &&
    isNonNegativeIntegerResponseString(value.promptPriceNeuron) &&
    isNonNegativeIntegerResponseString(value.completionPriceNeuron) &&
    isOptionalNonNegativeIntegerResponseString(value.imagePriceNeuron) &&
    isOptionalNonNegativeDecimalResponseString(value.promptPriceUsd) &&
    isOptionalNonNegativeDecimalResponseString(value.completionPriceUsd) &&
    isOptionalNonNegativeDecimalResponseString(value.imagePriceUsd) &&
    isNonNegativeResponseInteger(value.estimatedPromptTokens) &&
    isNonNegativeResponseInteger(value.estimatedCompletionTokens) &&
    isNonNegativeIntegerResponseString(value.estimatedCostNeuron) &&
    isNonNegativeDecimalResponseString(value.estimatedCost0G) &&
    isOptionalNonNegativeDecimalResponseString(value.estimatedCostNative) &&
    isValidResponseTimestamp(value.priceFetchedAt)
  );
}

function isUsageVaultInfo(
  value: unknown,
  requestedChain?: ProductChainId,
): value is UsageVaultInfoPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    matchesRequestedChain(value, requestedChain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    (value.billingCurrency === undefined ||
      isUsageBillingCurrency(value.billingCurrency)) &&
    (value.depositFunctionName === undefined ||
      value.depositFunctionName === "deposit" ||
      value.depositFunctionName === "depositTokenAmount") &&
    isEvmAddressResponse(value.vaultAddress)
  );
}

function isUsageBillingCurrency(value: unknown) {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isNonNegativeResponseInteger(value.decimals) &&
    isNonEmptyResponseString(value.name) &&
    isNonEmptyResponseString(value.symbol) &&
    (value.feeCurrencyAddress === undefined ||
      isEvmAddressResponse(value.feeCurrencyAddress)) &&
    (value.tokenAddress === undefined ||
      isEvmAddressResponse(value.tokenAddress))
  );
}

function isUsageDeposit(
  value: unknown,
  input: {
    chain?: ProductChainId;
    txHash: string;
    wallet: WalletAuth;
  },
): value is UsageDepositVerifyPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    matchesRequestedChain(value, input.chain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    matchesWalletAddress(value.wallet, input.wallet.address) &&
    (value.walletSession === undefined ||
      (isWalletSession(value.walletSession) &&
        matchesWalletAddress(
          value.walletSession.address,
          input.wallet.address,
        ))) &&
    isTransactionHashResponse(value.txHash) &&
    value.txHash.toLowerCase() === input.txHash.trim().toLowerCase() &&
    isNonNegativeIntegerResponseString(value.amountNeuron) &&
    isNonNegativeDecimalResponseString(value.amount0G) &&
    isOptionalNonNegativeDecimalResponseString(value.amountNative) &&
    typeof value.credited === "boolean" &&
    isNonNegativeIntegerResponseString(value.balanceBefore) &&
    isNonNegativeIntegerResponseString(value.balanceAfter)
  );
}

function isUsageWithdrawRequest(
  value: unknown,
  wallet: WalletAuth,
  requestedChain?: ProductChainId,
): value is UsageWithdrawRequestPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  const request = value as Record<string, unknown>;

  return (
    isUsageVaultInfo(value, requestedChain) &&
    matchesWalletAddress(request.wallet, wallet.address) &&
    request.functionName === "withdraw" &&
    isUsageBalance(request.balance, readResponseChain(request.chain) ?? requestedChain) &&
    isNonEmptyResponseString(request.note)
  );
}

function matchesRequestedChain(
  value: Record<string, unknown>,
  requestedChain?: ProductChainId,
) {
  const responseChain = readResponseChain(value.chain);

  return (
    isOptionalProductChain(value.chain) &&
    (requestedChain === undefined ||
      responseChain === undefined ||
      responseChain === requestedChain) &&
    isConsistentProductChainResponse(
      responseChain ?? requestedChain,
      value.chainId,
      value.chainName,
    )
  );
}

function readResponseChain(value: unknown): ProductChainId | undefined {
  return value === "celo" || value === "mantle" ? value : undefined;
}

function matchesWalletAddress(value: unknown, expected: string) {
  return (
    isEvmAddressResponse(value) &&
    value.toLowerCase() === expected.trim().toLowerCase()
  );
}

function invalidUsageResponse() {
  return new LangclawApiError("Backend returned invalid usage data.", 500);
}

import {
  LangclawApiError,
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

  if (!isUsageBalancePayload(payload)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function getUsageQuote(chain?: ProductChainId) {
  const response = await postJson("/api/usage/quote", { chain });
  const payload = await readJsonResponse<UsageQuotePayload>(response);

  if (payload.configured !== true || !isUsageQuote(payload.quote)) {
    throw invalidUsageResponse();
  }

  return payload;
}

export async function getUsageVaultInfo(chain?: ProductChainId) {
  const response = await postJson("/api/usage/vault", { chain });
  const payload = await readJsonResponse<UsageVaultInfoPayload>(response);

  if (!isUsageVaultInfo(payload)) {
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

  if (!isUsageDeposit(payload)) {
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

  if (!isUsageWithdrawRequest(payload)) {
    throw invalidUsageResponse();
  }

  return payload;
}

function isUsageBalancePayload(value: unknown): value is UsageBalancePayload {
  if (!isResponseObject(value)) {
    return false;
  }

  const balance = value.balance;
  const quote = value.quote;

  return (
    value.configured === true &&
    isOptionalProductChain(value.chain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    isEvmAddressResponse(value.wallet) &&
    isUsageBalance(balance) &&
    (quote === undefined || isUsageQuote(quote)) &&
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

function isNonNegativeDecimalResponseString(value: unknown): value is string {
  return typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value);
}

function isOptionalNonNegativeDecimalResponseString(value: unknown) {
  return value === undefined || isNonNegativeDecimalResponseString(value);
}

function isUsageBalance(value: unknown): value is UsageBalance {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isOptionalProductChain(value.chain) &&
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

function isUsageQuote(value: unknown): value is UsageQuote {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isOptionalProductChain(value.chain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    isNonEmptyResponseString(value.model) &&
    isNonEmptyResponseString(value.endpoint) &&
    isNonEmptyResponseString(value.promptPriceNeuron) &&
    isNonEmptyResponseString(value.completionPriceNeuron) &&
    isOptionalResponseString(value.imagePriceNeuron) &&
    isOptionalResponseString(value.promptPriceUsd) &&
    isOptionalResponseString(value.completionPriceUsd) &&
    isOptionalResponseString(value.imagePriceUsd) &&
    isNonNegativeResponseInteger(value.estimatedPromptTokens) &&
    isNonNegativeResponseInteger(value.estimatedCompletionTokens) &&
    isNonEmptyResponseString(value.estimatedCostNeuron) &&
    isNonEmptyResponseString(value.estimatedCost0G) &&
    isOptionalResponseString(value.estimatedCostNative) &&
    isValidResponseTimestamp(value.priceFetchedAt)
  );
}

function isUsageVaultInfo(value: unknown): value is UsageVaultInfoPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    isOptionalProductChain(value.chain) &&
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

function isUsageDeposit(value: unknown): value is UsageDepositVerifyPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    isOptionalProductChain(value.chain) &&
    isOptionalPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    isEvmAddressResponse(value.wallet) &&
    (value.walletSession === undefined || isWalletSession(value.walletSession)) &&
    isTransactionHashResponse(value.txHash) &&
    isNonEmptyResponseString(value.amountNeuron) &&
    isNonEmptyResponseString(value.amount0G) &&
    isOptionalResponseString(value.amountNative) &&
    typeof value.credited === "boolean" &&
    isNonEmptyResponseString(value.balanceBefore) &&
    isNonEmptyResponseString(value.balanceAfter)
  );
}

function isUsageWithdrawRequest(
  value: unknown,
): value is UsageWithdrawRequestPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  const request = value as Record<string, unknown>;

  return (
    isUsageVaultInfo(value) &&
    isEvmAddressResponse(request.wallet) &&
    request.functionName === "withdraw" &&
    isUsageBalance(request.balance) &&
    isNonEmptyResponseString(request.note)
  );
}

function invalidUsageResponse() {
  return new LangclawApiError("Backend returned invalid usage data.", 500);
}

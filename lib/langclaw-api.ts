import {
  LangclawApiError,
  isBoundedResponseInteger,
  isBoundedResponseNumber,
  isEvmAddressResponse,
  isFiniteResponseNumber,
  isFutureResponseTimestamp,
  isNonEmptyResponseString,
  isNonNegativeResponseInteger,
  isNonNegativeResponseNumber,
  isOptionalFiniteResponseNumber,
  isOptionalNonNegativeResponseInteger,
  isOptionalPositiveResponseInteger,
  isOptionalProductChain,
  isOptionalResponseString,
  isOptionalResponseTimestamp,
  isOptionalResponseTimestampAtOrAfter,
  isPositiveResponseInteger,
  isPositiveResponseNumber,
  isResponseObject,
  isUnsignedIntegerString,
  isValidResponseTimestamp,
  isWalletSession,
  postJson,
  readErrorMessage,
  readJsonResponse,
  readNdjson,
  readStreamObject,
  readStreamString,
} from "./langclaw-api/core.ts";

export { createWalletSession, requestWalletChallenge } from "./langclaw-api/auth.ts";

export { runDiscover, streamDiscover } from "./langclaw-api/discovery.ts";

export {
  CHAT_SESSIONS_UPDATED_EVENT,
  deleteChatSession,
  dispatchChatSessionsUpdated,
  getChatSession,
  listChatSessions,
  streamChat,
  updateChatSessionMetadata,
  upsertChatSession,
} from "./langclaw-api/chat.ts";

export { createApiKey, listApiKeys, revokeApiKey } from "./langclaw-api/api-keys.ts";

export {
  deleteManyMemoryRecords,
  deleteMemoryRecord,
  getMemoryDashboard,
  getMemorySettings,
  setManyMemoryStatuses,
  setMemoryStatus,
  updateMemorySettings,
} from "./langclaw-api/memory.ts";

export {
  getAutomationDashboard,
  createAutomationTask,
  updateAutomationTask,
  setAutomationTaskStatus,
  deleteAutomationTask,
  setAllAutomationTasksStatus,
  runAutomationTask,
  listAutomationRuns,
  getAutomationSettings,
  updateAutomationSettings,
  listInAppAutomationNotifications,
  markAutomationNotificationRead,
  markAllAutomationNotificationsRead,
  requestAutomationEmailLink,
  verifyAutomationEmailLink,
  unlinkAutomationEmail,
  createAutomationTelegramLink,
  pollAutomationTelegramLink,
  unlinkAutomationTelegram,
} from "./langclaw-api/automation.ts";

export {
  LangclawApiError,
  checkBackendHealth,
  getLangclawApiBaseUrl,
  getLangclawApiUrl,
  isWalletSignatureRequiredError,
  readFriendlyError,
} from "./langclaw-api/core.ts";

import type {
  SourceType,
  ProviderName,
  ProviderTraceStatus,
  ProviderTraceScope,
  ProviderTraceEntry,
  SourceCard,
  ProviderError,
  StepExecution,
  WorkflowProgressEvent,
  OrchestrationStep,
  FinalConclusion,
  FinalAnswer,
  FinalAnswerMeta,
  DiscoverSignalStatus,
  DiscoverSignalSection,
  DiscoverSignals,
  ResearchReportKind,
  ResearchReportSeverity,
  ResearchReportConfidence,
  DefiRankingCoverage,
  DefiRankingMetrics,
  ResearchReportEntity,
  ResearchReportTable,
  ResearchReportSection,
  ResearchReport,
  ZeroGStorageStatus,
  ZeroGChainStatus,
  ZeroGComputeStatus,
  ZeroGTokenUsage,
  ZeroGComputeBilling,
  ZeroGTeeVerification,
  ZeroGProof,
  ModelUsageReceipt,
  ChatMode,
  ProductChainId,
  DirectChatUsage,
  WorkflowChainContext,
  DiscoverPayload,
  DirectChatPayload,
  OnChainDomain,
  OnChainProvider,
  OnChainPlanSummary,
  OnChainToolCallEvent,
  OnChainToolResult,
  OnChainToolFinalPayload,
  StoredChatMessage,
  ChatSession,
  WalletAuth,
  WalletAuthPurpose,
  WalletChallenge,
  ApiKeyRecord,
  ApiKeyCreatePayload,
  AutomationTriggerType,
  AutomationFrequency,
  AutomationTaskStatus,
  AutomationRunStatus,
  AutomationTriggeredBy,
  AutomationNotificationChannel,
  AutomationInAppNotificationStatus,
  AutomationSettings,
  AutomationTask,
  AutomationRun,
  AutomationInAppNotification,
  AutomationStats,
  MemoryStatus,
  MemoryCategory,
  MemoryItem,
  MemoryStats,
  MemorySettings,
  MemoryDashboard,
  MemorySettingsInput,
  AutomationDashboard,
  AutomationTaskInput,
  AutomationSettingsInput,
  ChatStreamInput,
  ChatStreamChunk,
  DiscoverStreamInput,
  DiscoverStreamChunk,
  UsageBalance,
  UsageQuote,
  UsageBalancePayload,
  UsageQuotePayload,
  UsageDepositVerifyPayload,
  UsageWithdrawRequestPayload,
  UsageVaultInfoPayload,
  ProofDecision,
  ProofDecisionsPayload,
  StrategyAction,
  StrategyRecordStatus,
  StrategyBacktestParams,
  StrategyMarketBar,
  StrategyTrade,
  StrategyEquityPoint,
  StrategyMetrics,
  StrategySignal,
  TradingJournalProof,
  StrategyBacktestPayload,
  StrategyScanCandidate,
  StrategyScanPayload,
  StrategyPaperTradePayload,
  StrategyRunRecord,
  StrategyRunsPayload,
  StrategyBacktestResponse,
  StrategyPaperTradeResponse,
  StrategyScanResponse,
  AlphaWatchlistItem,
  AlphaWatchlistPayload,
  RouterPricing,
  RouterModel,
} from "./langclaw-api/types";

export type * from "./langclaw-api/types";





























































































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

function isTransactionHashResponse(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

function invalidUsageResponse() {
  return new LangclawApiError("Backend returned invalid usage data.", 500);
}

export async function listProofDecisions(limit = 20, chain?: ProductChainId) {
  const response = await postJson("/api/proofs/decisions", { chain, limit });
  const payload = await readJsonResponse<ProofDecisionsPayload>(response);

  if (!isProofDecisionsPayload(payload)) {
    throw new LangclawApiError(
      "Backend returned invalid proof decision data.",
      500,
    );
  }

  return payload;
}

function isProofDecisionsPayload(
  value: unknown,
): value is ProofDecisionsPayload {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    isOptionalProductChain(value.chain) &&
    isPositiveResponseInteger(value.chainId) &&
    isOptionalResponseString(value.chainName) &&
    isOptionalResponseString(value.nativeSymbol) &&
    Array.isArray(value.decisions) &&
    value.decisions.every(isProofDecision) &&
    isUnsignedIntegerString(value.nextDecisionId) &&
    isEvmAddressResponse(value.registryAddress)
  );
}

function isProofDecision(value: unknown): value is ProofDecision {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isUnsignedIntegerString(value.agentId) &&
    isValidResponseTimestamp(value.createdAt) &&
    isTransactionHashResponse(value.decisionHash) &&
    isUnsignedIntegerString(value.decisionId) &&
    isNonEmptyResponseString(value.evidenceUri) &&
    isOptionalResponseString(value.explorerUrl) &&
    isEvmAddressResponse(value.recorder) &&
    isNonEmptyResponseString(value.runId) &&
    isNonEmptyResponseString(value.signalType) &&
    (value.txHash === undefined || isTransactionHashResponse(value.txHash))
  );
}


export async function runStrategyBacktest(input: {
  chain?: ProductChainId;
  pairAddress?: string;
  queryId?: string;
}) {
  const response = await postJson("/api/strategy/backtest", input);
  const payload = await readJsonResponse<StrategyBacktestResponse>(response);

  if (payload.configured !== true || !isStrategyBacktest(payload.backtest)) {
    throw new LangclawApiError(
      "Backend returned invalid strategy backtest data.",
      500,
    );
  }

  return payload.backtest;
}

function isStrategyBacktest(value: unknown): value is StrategyBacktestPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const backtest = value as Record<string, unknown>;

  return (
    Array.isArray(backtest.bars) &&
    backtest.bars.every(isStrategyMarketBar) &&
    isOptionalProductChain(backtest.chain) &&
    isOptionalPositiveResponseInteger(backtest.chainId) &&
    isOptionalResponseString(backtest.chainName) &&
    Array.isArray(backtest.equityCurve) &&
    backtest.equityCurve.every(isStrategyEquityPoint) &&
    isValidResponseTimestamp(backtest.generatedAt) &&
    isStrategySignal(backtest.latestSignal) &&
    isNonEmptyResponseString(backtest.market) &&
    isStrategyMetrics(backtest.metrics) &&
    isNonEmptyResponseString(backtest.pairAddress) &&
    isStrategyParams(backtest.params) &&
    isNonEmptyResponseString(backtest.queryId) &&
    isNonEmptyResponseString(backtest.runId) &&
    isNonEmptyResponseString(backtest.sourceUrl) &&
    isNonEmptyResponseString(backtest.strategyId) &&
    isNonEmptyResponseString(backtest.title) &&
    Array.isArray(backtest.trades) &&
    backtest.trades.every(isStrategyTrade) &&
    (backtest.proof === undefined || isTradingJournalProof(backtest.proof))
  );
}

function isStrategyMarketBar(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const bar = value as Record<string, unknown>;

  return (
    isNonNegativeResponseNumber(bar.liquidityUsd) &&
    isOptionalFiniteResponseNumber(bar.netWhaleFlowUsd) &&
    isNonEmptyResponseString(bar.pairAddress) &&
    isPositiveResponseNumber(bar.priceUsd) &&
    isValidResponseTimestamp(bar.timestamp) &&
    isOptionalNonNegativeResponseInteger(bar.txCount) &&
    isNonNegativeResponseNumber(bar.volumeUsd)
  );
}

function isStrategyEquityPoint(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    isNonNegativeResponseNumber(point.equityUsd) &&
    isValidResponseTimestamp(point.timestamp)
  );
}

function isStrategySignal(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const signal = value as Record<string, unknown>;

  return (
    ["buy", "sell", "hold", "exit"].includes(String(signal.action)) &&
    isBoundedResponseNumber(signal.confidence, 0, 100) &&
    isNonNegativeResponseNumber(signal.liquidityUsd) &&
    isFiniteResponseNumber(signal.momentumBps) &&
    isPositiveResponseNumber(signal.priceUsd) &&
    isNonEmptyResponseString(signal.rationale) &&
    isNonNegativeResponseNumber(signal.volumeUsd)
  );
}

function isStrategyMetrics(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const metrics = value as Record<string, unknown>;

  return (
    isNonNegativeResponseNumber(metrics.finalEquityUsd) &&
    isPositiveResponseNumber(metrics.initialCapitalUsd) &&
    isNonNegativeResponseNumber(metrics.maxDrawdownBps) &&
    isFiniteResponseNumber(metrics.totalPnlBps) &&
    isFiniteResponseNumber(metrics.totalPnlUsd) &&
    isNonNegativeResponseInteger(metrics.tradeCount) &&
    isBoundedResponseNumber(metrics.winRate, 0, 100)
  );
}

function isStrategyParams(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const params = value as Record<string, unknown>;

  return [
    params.initialCapitalUsd,
    params.maxHoldHours,
    params.minLiquidityUsd,
    params.minMomentumBps,
    params.minVolumeMultiple,
    params.stopLossBps,
    params.takeProfitBps,
  ].every(isPositiveResponseNumber);
}

function isStrategyTrade(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const trade = value as Record<string, unknown>;
  const entryAt = trade.entryAt;
  const exitAt = trade.exitAt;

  return (
    isValidResponseTimestamp(entryAt) &&
    isPositiveResponseNumber(trade.entryPriceUsd) &&
    isValidResponseTimestamp(exitAt) &&
    Date.parse(exitAt) >= Date.parse(entryAt) &&
    isPositiveResponseNumber(trade.exitPriceUsd) &&
    isNonNegativeResponseNumber(trade.holdHours) &&
    isFiniteResponseNumber(trade.pnlBps) &&
    isFiniteResponseNumber(trade.pnlUsd) &&
    isNonEmptyResponseString(trade.reason)
  );
}

function isTradingJournalProof(value: unknown): value is TradingJournalProof {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const proof = value as Record<string, unknown>;

  return (
    ["buy", "sell", "hold", "exit"].includes(String(proof.action)) &&
    isNonEmptyResponseString(proof.agentId) &&
    isOptionalProductChain(proof.chain) &&
    isPositiveResponseInteger(proof.chainId) &&
    isOptionalResponseString(proof.chainName) &&
    isNonEmptyResponseString(proof.decisionHash) &&
    isNonEmptyResponseString(proof.evidenceUri) &&
    isFiniteResponseNumber(proof.pnlBps) &&
    isNonEmptyResponseString(proof.resultHash) &&
    ["anchored", "failed", "pending", "prepared"].includes(
      String(proof.status),
    ) &&
    ["backtested", "paper-opened", "paper-closed"].includes(
      String(proof.strategyStatus),
    )
  );
}










export async function scanStrategyPairs(input: {
  chain?: ProductChainId;
  limit?: number;
  queryId?: string;
}) {
  const response = await postJson("/api/strategy/scan-pairs", input);
  const payload = await readJsonResponse<StrategyScanResponse>(response);

  if (payload.configured !== true || !isStrategyScan(payload.scan)) {
    throw new LangclawApiError(
      "Backend returned invalid strategy scan data.",
      500,
    );
  }

  return payload.scan;
}

function isStrategyScan(value: unknown): value is StrategyScanPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const scan = value as Record<string, unknown>;

  return (
    isStrategyBacktest(scan.bestBacktest) &&
    isOptionalProductChain(scan.chain) &&
    isOptionalPositiveResponseInteger(scan.chainId) &&
    isOptionalResponseString(scan.chainName) &&
    Array.isArray(scan.candidates) &&
    scan.candidates.every(isStrategyScanCandidate) &&
    isValidResponseTimestamp(scan.generatedAt) &&
    isNonEmptyResponseString(scan.queryId) &&
    isNonNegativeResponseInteger(scan.scannedPairs) &&
    isNonEmptyResponseString(scan.selectedPairAddress) &&
    isNonEmptyResponseString(scan.sourceUrl)
  );
}

function isStrategyScanCandidate(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isStrategySignal(candidate.latestSignal) &&
    isValidResponseTimestamp(candidate.latestTimestamp) &&
    isNonEmptyResponseString(candidate.market) &&
    isStrategyMetrics(candidate.metrics) &&
    isNonEmptyResponseString(candidate.pairAddress) &&
    isPositiveResponseInteger(candidate.rank) &&
    isNonNegativeResponseInteger(candidate.rowCount) &&
    isFiniteResponseNumber(candidate.score) &&
    isNonEmptyResponseString(candidate.scoreReason) &&
    isNonNegativeResponseNumber(candidate.totalVolumeUsd)
  );
}

export async function openStrategyPaperTrade(input: {
  chain?: ProductChainId;
  backtest: StrategyBacktestPayload;
  notionalUsd?: number;
}) {
  const response = await postJson("/api/strategy/paper-trade", input);
  const payload = await readJsonResponse<StrategyPaperTradeResponse>(response);

  if (
    payload.configured !== true ||
    !isStrategyPaperTrade(payload.paperTrade)
  ) {
    throw new LangclawApiError(
      "Backend returned invalid strategy paper trade data.",
      500,
    );
  }

  return payload.paperTrade;
}

function isStrategyPaperTrade(
  value: unknown,
): value is StrategyPaperTradePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const paperTrade = value as Record<string, unknown>;
  const proof =
    paperTrade.proof &&
    typeof paperTrade.proof === "object" &&
    !Array.isArray(paperTrade.proof)
      ? (paperTrade.proof as Record<string, unknown>)
      : undefined;

  return (
    ["buy", "sell", "hold", "exit"].includes(String(paperTrade.action)) &&
    isOptionalProductChain(paperTrade.chain) &&
    isOptionalPositiveResponseInteger(paperTrade.chainId) &&
    isOptionalResponseString(paperTrade.chainName) &&
    isBoundedResponseNumber(paperTrade.confidence, 0, 100) &&
    isValidResponseTimestamp(paperTrade.generatedAt) &&
    isNonEmptyResponseString(paperTrade.market) &&
    isPositiveResponseNumber(paperTrade.notionalUsd) &&
    isNonEmptyResponseString(paperTrade.pairAddress) &&
    proof !== undefined &&
    isTradingJournalProof(proof) &&
    isNonEmptyResponseString(paperTrade.rationale) &&
    isNonEmptyResponseString(paperTrade.referenceBacktestRunId) &&
    isNonEmptyResponseString(paperTrade.runId) &&
    isNonEmptyResponseString(paperTrade.strategyId) &&
    proof?.action === paperTrade.action &&
    (paperTrade.chain === undefined ||
      proof.chain === undefined ||
      proof.chain === paperTrade.chain) &&
    (paperTrade.chainId === undefined || proof.chainId === paperTrade.chainId)
  );
}

export async function listStrategyRuns(limit = 25, chain?: ProductChainId) {
  const response = await postJson("/api/strategy/runs", { chain, limit });
  const payload = await readJsonResponse<StrategyRunsPayload>(response);

  if (!isStrategyRuns(payload)) {
    throw new LangclawApiError(
      "Backend returned invalid strategy run data.",
      500,
    );
  }

  return payload;
}

function isStrategyRuns(value: unknown): value is StrategyRunsPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const runs = value as Record<string, unknown>;

  return (
    isOptionalProductChain(runs.chain) &&
    isPositiveResponseInteger(runs.chainId) &&
    isOptionalResponseString(runs.chainName) &&
    typeof runs.configured === "boolean" &&
    isOptionalResponseString(runs.error) &&
    isOptionalResponseString(runs.journalAddress) &&
    isNonEmptyResponseString(runs.nextRecordId) &&
    Array.isArray(runs.records) &&
    runs.records.every(isStrategyRunRecord)
  );
}

function isStrategyRunRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    ["buy", "sell", "hold", "exit"].includes(String(record.action)) &&
    isNonEmptyResponseString(record.agentId) &&
    isOptionalProductChain(record.chain) &&
    isOptionalPositiveResponseInteger(record.chainId) &&
    isOptionalResponseString(record.chainName) &&
    isValidResponseTimestamp(record.createdAt) &&
    isNonEmptyResponseString(record.decisionHash) &&
    isNonEmptyResponseString(record.evidenceUri) &&
    isOptionalResponseString(record.explorerUrl) &&
    isNonEmptyResponseString(record.market) &&
    isFiniteResponseNumber(record.pnlBps) &&
    isNonEmptyResponseString(record.recordId) &&
    isNonEmptyResponseString(record.recorder) &&
    isNonEmptyResponseString(record.resultHash) &&
    isNonEmptyResponseString(record.runId) &&
    ["backtested", "paper-opened", "paper-closed"].includes(
      String(record.status),
    ) &&
    isNonEmptyResponseString(record.strategyId) &&
    isOptionalResponseString(record.txHash)
  );
}

export async function listAlphaWatchlist(wallet: WalletAuth) {
  const response = await postJson("/api/watchlist", {
    action: "list",
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  requireWatchlistConfigured(payload.configured);
  return requireWatchlistItems(payload.items);
}

export async function upsertAlphaWatchlistItem(
  wallet: WalletAuth,
  item: AlphaWatchlistItem,
) {
  const response = await postJson("/api/watchlist", {
    action: "upsert",
    item,
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  requireWatchlistConfigured(payload.configured);
  if (!isWatchlistItem(payload.item)) {
    throw invalidWatchlistResponse();
  }

  return payload.item;
}

export async function deleteAlphaWatchlistItem(
  wallet: WalletAuth,
  itemId: string,
) {
  const response = await postJson("/api/watchlist", {
    action: "delete",
    itemId,
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  requireWatchlistConfigured(payload.configured);
  return readWatchlistMutationFlag(payload.deleted);
}

export async function clearAlphaWatchlist(wallet: WalletAuth) {
  const response = await postJson("/api/watchlist", {
    action: "clear",
    wallet,
  });
  const payload = await readJsonResponse<AlphaWatchlistPayload>(response);

  requireWatchlistConfigured(payload.configured);
  return readWatchlistMutationFlag(payload.cleared);
}

function requireWatchlistConfigured(value: unknown) {
  if (value !== true) {
    throw invalidWatchlistResponse();
  }
}

function requireWatchlistItems(value: unknown) {
  if (!Array.isArray(value) || !value.every(isWatchlistItem)) {
    throw invalidWatchlistResponse();
  }

  return value as AlphaWatchlistItem[];
}

function isWatchlistItem(value: unknown): value is AlphaWatchlistItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    isValidResponseTimestamp(item.addedAt) &&
    isNonEmptyResponseString(item.caveat) &&
    isNonEmptyResponseString(item.chain) &&
    isNonNegativeResponseInteger(item.gapCount) &&
    isNonEmptyResponseString(item.id) &&
    isNonEmptyResponseString(item.intent) &&
    isNonEmptyResponseString(item.recommendation) &&
    isNonEmptyResponseString(item.signalType) &&
    isNonNegativeResponseInteger(item.sourceCount) &&
    isNonEmptyResponseString(item.subject) &&
    isNonEmptyResponseString(item.summary) &&
    isNonEmptyResponseString(item.title) &&
    [
      item.agentId,
      item.decisionHash,
      item.decisionId,
      item.evidenceUri,
      item.explorerUrl,
      item.proofTx,
    ].every(isOptionalResponseString)
  );
}


function readWatchlistMutationFlag(value: unknown) {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw invalidWatchlistResponse();
  }

  return value;
}

function invalidWatchlistResponse() {
  return new LangclawApiError("Backend returned invalid watchlist data.", 500);
}

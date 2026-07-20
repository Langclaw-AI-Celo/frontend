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
  isTransactionHashResponse,
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
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  verifyUsageDeposit,
  requestUsageWithdraw,
} from "./langclaw-api/usage.ts";

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

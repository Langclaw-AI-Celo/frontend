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

export { listProofDecisions } from "./langclaw-api/proof.ts";

export {
  runStrategyBacktest,
  scanStrategyPairs,
  openStrategyPaperTrade,
  listStrategyRuns,
} from "./langclaw-api/strategy.ts";

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

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

type ChatSessionsResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      error?: string;
      deleted?: boolean;
      session?: ChatSession | null;
      sessions?: ChatSession[];
    };

type ApiKeysResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      error?: string;
      key?: ApiKeyRecord;
      keys?: ApiKeyRecord[];
      secret?: string;
    };

type AutomationResponse<T> = T & {
  code?: string;
  configured?: boolean;
  error?: string;
};

type MemoryResponse =
  | {
      configured: false;
      error?: string;
    }
  | {
      configured: true;
      deleted?: boolean;
      deletedIds?: string[];
      error?: string;
      memories?: MemoryItem[];
      memory?: MemoryItem;
      settings?: MemorySettings;
      stats?: MemoryStats;
    };



export const CHAT_SESSIONS_UPDATED_EVENT = "langclaw-chat-sessions-updated";









export async function runDiscover(input: {
  topic: string;
  wallet?: WalletAuth;
  signal?: AbortSignal;
}) {
  const response = await postJson(
    "/api/discover",
    { topic: input.topic, wallet: input.wallet },
    input.signal,
  );

  return readJsonResponse<DiscoverPayload>(response);
}

export async function streamDiscover(input: DiscoverStreamInput) {
  const response = await postJson(
    "/api/discover/stream",
    { topic: input.topic, wallet: input.wallet },
    input.signal,
  );

  await readNdjson<DiscoverStreamChunk>(response, (chunk) => {
    if (chunk.type === "progress") {
      const event = readStreamObject<WorkflowProgressEvent>(
        chunk.event,
        response.status,
      );
      input.onProgress?.(event);
      return;
    }

    if (chunk.type === "result") {
      const payload = readStreamObject<DiscoverPayload>(
        chunk.payload,
        response.status,
      );
      input.onResult?.(payload);
      return;
    }

    if (chunk.type === "error") {
      input.onError?.(readErrorMessage(chunk.error));
      return;
    }

    throw new LangclawApiError(
      "Backend returned an unsupported streaming event.",
      response.status,
    );
  });
}

export async function streamChat(input: ChatStreamInput) {
  const toolMode = input.toolMode ?? (input.researchTrend ? "research" : "chat");
  const response = await postJson(
    "/api/chat/stream",
    {
      message: input.message,
      chain: input.chain,
      messages: input.messages ?? [],
      model: input.model,
      researchTrend: toolMode === "research",
      sessionId: input.sessionId,
      toolMode,
      useAgent: toolMode === "research",
      wallet: input.wallet,
    },
    input.signal,
  );

  await readNdjson<ChatStreamChunk>(response, (chunk) => {
    if (chunk.type === "direct_delta") {
      const delta = readStreamString(chunk.delta, response.status);
      input.onDirectDelta?.(delta);
      return;
    }

    if (chunk.type === "direct_reasoning_delta") {
      const delta = readStreamString(chunk.delta, response.status);
      input.onDirectReasoningDelta?.(delta);
      return;
    }

    if (chunk.type === "direct") {
      const payload = readStreamObject<DirectChatPayload>(
        chunk.payload,
        response.status,
      );
      input.onDirect?.(payload);
      return;
    }

    if (chunk.type === "mode") {
      const mode = readStreamString(chunk.mode, response.status, true);
      input.onMode?.(mode);
      return;
    }

    if (chunk.type === "tool_plan") {
      const plan = readStreamObject<OnChainPlanSummary>(
        chunk.plan,
        response.status,
      );
      input.onToolPlan?.(plan);
      return;
    }

    if (chunk.type === "tool_call") {
      const event = readStreamObject<OnChainToolCallEvent>(
        chunk.event,
        response.status,
      );
      input.onToolCall?.(event);
      return;
    }

    if (chunk.type === "tool_result") {
      const event = readStreamObject<OnChainToolResult>(
        chunk.event,
        response.status,
      );
      input.onToolResult?.(event);
      return;
    }

    if (chunk.type === "tool_final") {
      const payload = readStreamObject<OnChainToolFinalPayload>(
        chunk.payload,
        response.status,
      );
      input.onToolFinal?.(payload);
      return;
    }

    if (chunk.type === "progress") {
      const event = readStreamObject<WorkflowProgressEvent>(
        chunk.event,
        response.status,
      );
      input.onProgress?.(event);
      return;
    }

    if (chunk.type === "result") {
      const payload = readStreamObject<DiscoverPayload>(
        chunk.payload,
        response.status,
      );
      input.onResult?.(payload);
      return;
    }

    if (chunk.type === "error") {
      input.onError?.(readErrorMessage(chunk.error));
      return;
    }

    throw new LangclawApiError(
      "Backend returned an unsupported streaming event.",
      response.status,
    );
  });
}

export async function listChatSessions(wallet: WalletAuth) {
  const response = await chatSessionsRequest({ action: "list", wallet });

  return requireChatSessions(response.sessions);
}

export async function getChatSession(wallet: WalletAuth, sessionId: string) {
  const response = await chatSessionsRequest({
    action: "get",
    sessionId,
    wallet,
  });

  return readOptionalChatSession(response.session);
}

export async function upsertChatSession(
  wallet: WalletAuth,
  session: ChatSession,
) {
  const response = await chatSessionsRequest({
    action: "upsert",
    session,
    wallet,
  });

  return readOptionalChatSession(response.session);
}

export async function deleteChatSession(wallet: WalletAuth, sessionId: string) {
  const response = await chatSessionsRequest({
    action: "delete",
    sessionId,
    wallet,
  });

  if (typeof response.deleted !== "boolean") {
    throw invalidChatSessionResponse();
  }

  return response.deleted;
}

export async function updateChatSessionMetadata(
  wallet: WalletAuth,
  input: {
    pinned?: boolean;
    sessionId: string;
    title?: string;
  },
) {
  const response = await chatSessionsRequest({
    action: "update",
    pinned: input.pinned,
    sessionId: input.sessionId,
    title: input.title,
    wallet,
  });

  return readOptionalChatSession(response.session);
}

function requireChatSessions(value: unknown) {
  if (!Array.isArray(value) || !value.every(isChatSession)) {
    throw invalidChatSessionResponse();
  }

  return value as ChatSession[];
}

function readOptionalChatSession(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isChatSession(value)) {
    throw invalidChatSessionResponse();
  }

  return value as ChatSession;
}

function isChatSession(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const session = value as Record<string, unknown>;
  const createdAt = session.createdAt;
  const updatedAt = session.updatedAt;

  return (
    isNonEmptyResponseString(session.id) &&
    isNonEmptyResponseString(session.title) &&
    isValidResponseTimestamp(createdAt) &&
    isValidResponseTimestamp(updatedAt) &&
    Date.parse(updatedAt) >= Date.parse(createdAt) &&
    (session.pinned === undefined || typeof session.pinned === "boolean") &&
    Array.isArray(session.messages) &&
    session.messages.every(isStoredChatMessage)
  );
}

function isStoredChatMessage(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    isNonEmptyResponseString(message.id) &&
    (message.role === "assistant" || message.role === "user") &&
    typeof message.content === "string" &&
    (message.stopped === undefined || typeof message.stopped === "boolean")
  );
}





function invalidChatSessionResponse() {
  return new LangclawApiError(
    "Backend returned invalid chat session data.",
    500,
  );
}

export async function listApiKeys(wallet: WalletAuth) {
  const response = await apiKeysRequest({ action: "list", wallet });

  return requireApiKeys(response.keys);
}

export async function createApiKey(wallet: WalletAuth, name: string) {
  const response = await apiKeysRequest({ action: "create", name, wallet });

  if (
    !isApiKeyRecord(response.key) ||
    !isNonEmptyResponseString(response.secret)
  ) {
    throw invalidApiKeyResponse();
  }

  return {
    configured: true,
    key: response.key,
    secret: response.secret,
  } satisfies ApiKeyCreatePayload;
}

export async function revokeApiKey(wallet: WalletAuth, keyId: string) {
  const response = await apiKeysRequest({ action: "revoke", keyId, wallet });

  if (!isApiKeyRecord(response.key)) {
    throw invalidApiKeyResponse();
  }

  return response.key;
}

function requireApiKeys(value: unknown) {
  if (!Array.isArray(value) || !value.every(isApiKeyRecord)) {
    throw invalidApiKeyResponse();
  }

  return value as ApiKeyRecord[];
}

function isApiKeyRecord(value: unknown): value is ApiKeyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const key = value as Record<string, unknown>;
  const createdAt = key.createdAt;

  return (
    isNonEmptyResponseString(key.id) &&
    isNonEmptyResponseString(key.name) &&
    isNonEmptyResponseString(key.maskedKey) &&
    (key.status === "active" || key.status === "revoked") &&
    isValidResponseTimestamp(createdAt) &&
    isOptionalResponseString(key.prefix) &&
    isOptionalResponseString(key.suffix) &&
    isOptionalResponseTimestampAtOrAfter(key.lastUsedAt, createdAt) &&
    ((key.status === "active" && key.revokedAt === undefined) ||
      (key.status === "revoked" && isValidResponseTimestamp(key.revokedAt))) &&
    isOptionalResponseTimestampAtOrAfter(key.revokedAt, createdAt)
  );
}




function invalidApiKeyResponse() {
  return new LangclawApiError("Backend returned invalid API key data.", 500);
}

export async function getMemoryDashboard(wallet: WalletAuth) {
  const response = await memoryRequest({ action: "list", wallet });
  const memories = requireMemoryItems(response.memories);

  return {
    configured: true,
    memories,
    settings: requireMemorySettings(response.settings),
    stats:
      response.stats === undefined
        ? buildMemoryStats(memories)
        : requireMemoryStats(response.stats),
  } satisfies MemoryDashboard;
}

export async function setMemoryStatus(
  wallet: WalletAuth,
  memoryId: string,
  status: MemoryStatus,
) {
  const response = await memoryRequest({
    action: "status",
    memoryId,
    status,
    wallet,
  });

  return requireMemoryItem(response.memory);
}

export async function setManyMemoryStatuses(
  wallet: WalletAuth,
  memoryIds: string[],
  status: MemoryStatus,
) {
  const response = await memoryRequest({
    action: "bulk-status",
    memoryIds,
    status,
    wallet,
  });

  return requireMemoryItems(response.memories);
}

export async function deleteMemoryRecord(
  wallet: WalletAuth,
  memoryId: string,
) {
  const response = await memoryRequest({
    action: "delete",
    memoryId,
    wallet,
  });

  return readDeletedMemoryIds(
    response.deletedIds,
    readMemoryMutationFlag(response.deleted) ? [memoryId] : [],
  );
}

export async function deleteManyMemoryRecords(
  wallet: WalletAuth,
  memoryIds: string[],
) {
  const response = await memoryRequest({
    action: "bulk-delete",
    memoryIds,
    wallet,
  });

  return readDeletedMemoryIds(response.deletedIds, []);
}

export async function getMemorySettings(wallet: WalletAuth) {
  const response = await memorySettingsRequest({ action: "get", wallet });

  return requireMemorySettings(response.settings);
}

export async function updateMemorySettings(
  wallet: WalletAuth,
  settings: MemorySettingsInput,
) {
  const response = await memorySettingsRequest({
    action: "update",
    settings,
    wallet,
  });

  return requireMemorySettings(response.settings);
}

export async function getAutomationDashboard(wallet: WalletAuth) {
  const response = await postJson("/api/automation/tasks", {
    action: "list",
    wallet,
  });
  const payload = await readAutomationResponse<AutomationDashboard>(response);

  return requireAutomationDashboard(payload);
}

function requireAutomationDashboard(value: unknown) {
  if (!isAutomationDashboard(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function isAutomationDashboard(value: unknown): value is AutomationDashboard {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    value.configured === true &&
    Array.isArray(value.notifications) &&
    value.notifications.every(isAutomationNotification) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isAutomationTask) &&
    Array.isArray(value.recentRuns) &&
    value.recentRuns.every(isAutomationRun) &&
    isAutomationSettings(value.settings) &&
    isAutomationStats(value.stats)
  );
}

function isAutomationScheduleTime(value: unknown): value is string {
  return (
    typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
  );
}

function hasValidAutomationTaskDisplayStatus(
  status: unknown,
  displayStatus: unknown,
) {
  if (status === "active") {
    return displayStatus === "Active" || displayStatus === "Running";
  }

  if (status === "paused") {
    return displayStatus === "Paused";
  }

  return (
    (status === "draft" || status === "archived") &&
    displayStatus === "Draft"
  );
}

function isAutomationTask(value: unknown): value is AutomationTask {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;
  const lastRunAt = value.lastRunAt;
  const lastRunStatus = value.lastRunStatus;
  const updatedAt = value.updatedAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.name) &&
    isNonEmptyResponseString(value.project) &&
    isOptionalResponseString(value.prompt) &&
    isOptionalResponseString(value.model) &&
    ["schedule", "event", "webhook"].includes(String(value.triggerType)) &&
    (value.triggerType === "schedule"
      ? ["daily", "weekly", "monthly"].includes(
          String(value.scheduleFrequency),
        )
      : value.scheduleFrequency === undefined ||
        ["daily", "weekly", "monthly"].includes(
          String(value.scheduleFrequency),
        )) &&
    isAutomationScheduleTime(value.scheduleTime) &&
    (value.scheduleWeekday === undefined ||
      isBoundedResponseInteger(value.scheduleWeekday, 0, 6)) &&
    (value.scheduleMonthDay === undefined ||
      isBoundedResponseInteger(value.scheduleMonthDay, 1, 31)) &&
    isNonEmptyResponseString(value.timezone) &&
    isOptionalResponseString(value.eventName) &&
    isOptionalResponseString(value.webhookSlug) &&
    (value.triggerType !== "event" ||
      isNonEmptyResponseString(value.eventName)) &&
    (value.triggerType !== "webhook" ||
      isNonEmptyResponseString(value.webhookSlug)) &&
    ["draft", "active", "paused", "archived"].includes(
      String(value.status),
    ) &&
    hasValidAutomationTaskDisplayStatus(value.status, value.displayStatus) &&
    isNonEmptyResponseString(value.triggerLabel) &&
    isValidResponseTimestamp(createdAt) &&
    isValidResponseTimestamp(updatedAt) &&
    Date.parse(updatedAt) >= Date.parse(createdAt) &&
    ((lastRunAt === undefined && lastRunStatus === undefined) ||
      (isValidResponseTimestamp(lastRunAt) &&
        isAutomationRunStatus(lastRunStatus) &&
        Date.parse(lastRunAt) >= Date.parse(createdAt))) &&
    isOptionalResponseTimestampAtOrAfter(value.nextRunAt, createdAt) &&
    isNonNegativeResponseInteger(value.consecutiveFailures) &&
    isNonNegativeResponseInteger(value.maxRetries) &&
    isPositiveResponseInteger(value.failureThreshold)
  );
}

function hasValidAutomationRunLifecycle(value: Record<string, unknown>) {
  if (value.status === "queued") {
    return (
      value.startedAt === undefined &&
      value.completedAt === undefined &&
      value.durationMs === undefined
    );
  }

  if (value.status === "running") {
    return (
      isValidResponseTimestamp(value.startedAt) &&
      value.completedAt === undefined &&
      value.durationMs === undefined
    );
  }

  if (value.status === "canceled") {
    return (
      isValidResponseTimestamp(value.completedAt) &&
      ((value.startedAt === undefined && value.durationMs === undefined) ||
        (isValidResponseTimestamp(value.startedAt) &&
          isNonNegativeResponseInteger(value.durationMs)))
    );
  }

  return (
    isValidResponseTimestamp(value.startedAt) &&
    isValidResponseTimestamp(value.completedAt) &&
    isNonNegativeResponseInteger(value.durationMs)
  );
}

function hasMatchingAutomationRunDuration(value: Record<string, unknown>) {
  if (value.durationMs === undefined) {
    return true;
  }

  return (
    isValidResponseTimestamp(value.startedAt) &&
    isValidResponseTimestamp(value.completedAt) &&
    isNonNegativeResponseInteger(value.durationMs) &&
    value.durationMs === Date.parse(value.completedAt) - Date.parse(value.startedAt)
  );
}

function isAutomationRun(value: unknown): value is AutomationRun {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;
  const startedAt = value.startedAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.taskId) &&
    isOptionalResponseString(value.taskName) &&
    isAutomationRunStatus(value.status) &&
    ["schedule", "event", "webhook", "manual", "system"].includes(
      String(value.triggeredBy),
    ) &&
    isPositiveResponseInteger(value.attempt) &&
    isOptionalResponseTimestamp(value.scheduledFor) &&
    isValidResponseTimestamp(createdAt) &&
    isOptionalResponseTimestampAtOrAfter(startedAt, createdAt) &&
    isOptionalResponseTimestampAtOrAfter(
      value.completedAt,
      typeof startedAt === "string" ? startedAt : createdAt,
    ) &&
    hasValidAutomationRunLifecycle(value) &&
    hasMatchingAutomationRunDuration(value) &&
    (value.durationMs === undefined ||
      isNonNegativeResponseInteger(value.durationMs)) &&
    isOptionalResponseString(value.error)
  );
}

function isAutomationRunStatus(value: unknown): value is AutomationRunStatus {
  return [
    "queued",
    "running",
    "completed",
    "failed",
    "skipped",
    "canceled",
  ].includes(String(value));
}

function isAutomationNotification(
  value: unknown,
): value is AutomationInAppNotification {
  if (!isResponseObject(value)) {
    return false;
  }

  const createdAt = value.createdAt;

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.title) &&
    isNonEmptyResponseString(value.body) &&
    (value.status === "unread" || value.status === "read") &&
    isOptionalResponseString(value.taskId) &&
    isOptionalResponseString(value.runId) &&
    isValidResponseTimestamp(createdAt) &&
    ((value.status === "unread" && value.readAt === undefined) ||
      (value.status === "read" && isValidResponseTimestamp(value.readAt))) &&
    isOptionalResponseTimestampAtOrAfter(value.readAt, createdAt)
  );
}

function isAutomation0GAmount(value: unknown): value is string {
  return typeof value === "string" && /^\d+(?:\.\d{1,18})?$/.test(value);
}

function isAutomationSettings(value: unknown): value is AutomationSettings {
  if (!isResponseObject(value)) {
    return false;
  }

  const notificationChannels = value.notificationChannels;

  return (
    ["none", "3-attempts", "5-attempts"].includes(
      String(value.retryPolicy),
    ) &&
    ["email", "in-app", "none"].includes(
      String(value.failureNotification),
    ) &&
    Array.isArray(notificationChannels) &&
    notificationChannels.every((channel) =>
      ["email", "telegram", "in-app"].includes(String(channel)),
    ) &&
    new Set(notificationChannels).size === notificationChannels.length &&
    isOptionalResponseString(value.notificationEmail) &&
    isOptionalResponseTimestamp(value.notificationEmailLinkedAt) &&
    isOptionalResponseString(value.notificationEmailPending) &&
    typeof value.notificationEmailVerified === "boolean" &&
    (!value.notificationEmailVerified ||
      (isNonEmptyResponseString(value.notificationEmail) &&
        isValidResponseTimestamp(value.notificationEmailLinkedAt) &&
        notificationChannels.includes("email"))) &&
    isOptionalResponseString(value.telegramChatId) &&
    isOptionalResponseTimestamp(value.telegramLinkedAt) &&
    isOptionalResponseString(value.telegramUsername) &&
    typeof value.telegramVerified === "boolean" &&
    (!value.telegramVerified ||
      (isNonEmptyResponseString(value.telegramChatId) &&
        isValidResponseTimestamp(value.telegramLinkedAt) &&
        notificationChannels.includes("telegram"))) &&
    typeof value.autoPauseRepeatedFailures === "boolean" &&
    typeof value.writeRunLogsToMemory === "boolean" &&
    isAutomation0GAmount(value.dailyLimit0G) &&
    isAutomation0GAmount(value.monthlyCap0G) &&
    ["pause", "alert", "allow"].includes(String(value.limitBehavior)) &&
    isAutomation0GAmount(value.lowBalanceThreshold0G) &&
    ["notify", "pause", "continue"].includes(String(value.thresholdAction))
  );
}

function isAutomationStats(value: unknown): value is AutomationStats {
  if (!isResponseObject(value)) {
    return false;
  }

  const nextRunAt = value.nextRunAt;
  const nextRunTaskName = value.nextRunTaskName;

  return (
    [
      value.activeTasks,
      value.scheduledTasks,
      value.eventTasks,
      value.runningNow,
      value.pendingRuns,
      value.completedThisWeek,
    ].every(isNonNegativeResponseInteger) &&
    isBoundedResponseNumber(value.successRate, 0, 100) &&
    ((nextRunAt === undefined && nextRunTaskName === undefined) ||
      (isValidResponseTimestamp(nextRunAt) &&
        isNonEmptyResponseString(nextRunTaskName)))
  );
}



function invalidAutomationResponse() {
  return new LangclawApiError("Backend returned invalid automation data.", 500);
}

export async function createAutomationTask(
  wallet: WalletAuth,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "create",
    task,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function updateAutomationTask(
  wallet: WalletAuth,
  taskId: string,
  task: AutomationTaskInput,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "update",
    task,
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function setAutomationTaskStatus(
  wallet: WalletAuth,
  taskId: string,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume" : "pause",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ task: AutomationTask }>(
    response,
  );

  return requireAutomationTask(payload.task);
}

export async function deleteAutomationTask(
  wallet: WalletAuth,
  taskId: string,
) {
  const response = await postJson("/api/automation/tasks", {
    action: "delete",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ deleted?: boolean }>(response);

  return requireAutomationBoolean(payload.deleted);
}

export async function setAllAutomationTasksStatus(
  wallet: WalletAuth,
  status: Extract<AutomationTaskStatus, "active" | "paused">,
) {
  const response = await postJson("/api/automation/tasks", {
    action: status === "active" ? "resume-all" : "pause-all",
    wallet,
  });
  const payload = await readAutomationResponse<{ tasks: AutomationTask[] }>(
    response,
  );

  return requireAutomationTasks(payload.tasks);
}

function requireAutomationTask(value: unknown) {
  if (!isAutomationTask(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationTasks(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationTask)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationBoolean(value: unknown) {
  if (typeof value !== "boolean") {
    throw invalidAutomationResponse();
  }

  return value;
}

export async function runAutomationTask(wallet: WalletAuth, taskId: string) {
  const response = await postJson("/api/automation/runs", {
    action: "run",
    taskId,
    triggeredBy: "manual",
    wallet,
  });
  const payload = await readAutomationResponse<{ run: AutomationRun }>(
    response,
  );

  return requireAutomationRun(payload.run);
}

export async function listAutomationRuns(wallet: WalletAuth, taskId?: string) {
  const response = await postJson("/api/automation/runs", {
    action: "list",
    taskId,
    wallet,
  });
  const payload = await readAutomationResponse<{ runs: AutomationRun[] }>(
    response,
  );

  return requireAutomationRuns(payload.runs);
}

function requireAutomationRun(value: unknown) {
  if (!isAutomationRun(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationRuns(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationRun)) {
    throw invalidAutomationResponse();
  }

  return value;
}

export async function getAutomationSettings(wallet: WalletAuth) {
  const response = await postJson("/api/automation/settings", {
    action: "get",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function updateAutomationSettings(
  wallet: WalletAuth,
  settings: AutomationSettingsInput,
) {
  const response = await postJson("/api/automation/settings", {
    action: "update",
    settings,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function listInAppAutomationNotifications(
  wallet: WalletAuth,
  limit = 20,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "list-in-app",
    limit,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notifications: AutomationInAppNotification[];
  }>(response);

  return requireAutomationNotifications(payload.notifications);
}

export async function markAutomationNotificationRead(
  wallet: WalletAuth,
  notificationId: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-in-app-read",
    notificationId,
    wallet,
  });
  const payload = await readAutomationResponse<{
    notification: AutomationInAppNotification;
  }>(response);

  return requireAutomationNotification(payload.notification);
}

export async function markAllAutomationNotificationsRead(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "mark-all-in-app-read",
    wallet,
  });
  const payload = await readAutomationResponse<{ read?: boolean }>(response);

  return requireAutomationBoolean(payload.read);
}

export async function requestAutomationEmailLink(
  wallet: WalletAuth,
  email: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "request-email-link",
    email,
    wallet,
  });

  const payload = await readAutomationResponse<{
    link: { email: string; expiresAt: string; sent: boolean };
  }>(response);

  if (
    !isResponseObject(payload.link) ||
    !isNonEmptyResponseString(payload.link.email) ||
    !isFutureResponseTimestamp(payload.link.expiresAt) ||
    typeof payload.link.sent !== "boolean"
  ) {
    throw invalidAutomationResponse();
  }

  return payload;
}

export async function verifyAutomationEmailLink(
  wallet: WalletAuth,
  code: string,
) {
  const response = await postJson("/api/automation/notifications", {
    action: "verify-email-link",
    code,
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function unlinkAutomationEmail(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-email",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

export async function createAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "create-telegram-link",
    wallet,
  });
  const payload = await readAutomationResponse<{
    link: {
      botUsername: string;
      code: string;
      command: string;
      deepLink: string;
      expiresAt: string;
    };
  }>(response);

  return requireAutomationTelegramLink(payload.link);
}

export async function pollAutomationTelegramLink(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "poll-telegram-link",
    wallet,
  });

  const payload = await readAutomationResponse<{
    linked: boolean;
    settings?: AutomationSettings;
    status: string;
  }>(response);

  const isLinked =
    payload.linked === true &&
    payload.status === "linked" &&
    isAutomationSettings(payload.settings);
  const isPending =
    payload.linked === false &&
    payload.status === "pending" &&
    payload.settings === undefined;

  if (!isLinked && !isPending) {
    throw invalidAutomationResponse();
  }

  return payload;
}

export async function unlinkAutomationTelegram(wallet: WalletAuth) {
  const response = await postJson("/api/automation/notifications", {
    action: "unlink-telegram",
    wallet,
  });
  const payload = await readAutomationResponse<{
    settings: AutomationSettings;
  }>(response);

  return requireAutomationSettings(payload.settings);
}

function requireAutomationSettings(value: unknown) {
  if (!isAutomationSettings(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationNotifications(value: unknown) {
  if (!Array.isArray(value) || !value.every(isAutomationNotification)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationNotification(value: unknown) {
  if (!isAutomationNotification(value)) {
    throw invalidAutomationResponse();
  }

  return value;
}

function requireAutomationTelegramLink(value: unknown) {
  if (!isResponseObject(value)) {
    throw invalidAutomationResponse();
  }

  const botUsername = value.botUsername;
  const code = value.code;
  const command = value.command;
  const deepLink = value.deepLink;

  if (
    typeof botUsername !== "string" ||
    !/^[A-Za-z0-9_]{5,32}$/.test(botUsername) ||
    typeof code !== "string" ||
    !/^[A-Za-z0-9]{4,32}$/.test(code) ||
    command !== `/link ${code}` ||
    deepLink !==
      `https://t.me/${botUsername}?start=${encodeURIComponent(code)}` ||
    !isFutureResponseTimestamp(value.expiresAt)
  ) {
    throw invalidAutomationResponse();
  }

  return value as {
    botUsername: string;
    code: string;
    command: string;
    deepLink: string;
    expiresAt: string;
  };
}

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

export function dispatchChatSessionsUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CHAT_SESSIONS_UPDATED_EVENT));
}

async function chatSessionsRequest(body: {
  action: "delete" | "get" | "list" | "update" | "upsert";
  pinned?: boolean;
  wallet: WalletAuth;
  sessionId?: string;
  session?: ChatSession;
  title?: string;
}) {
  const response = await postJson("/api/chat/sessions", body);
  const payload = await readJsonResponse<ChatSessionsResponse>(response);

  if (payload.configured === false) {
    throw new LangclawApiError(
      payload.error || "Chat session storage is not configured.",
      503,
    );
  }

  if (payload.configured !== true) {
    throw invalidChatSessionResponse();
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function apiKeysRequest(body: {
  action: "create" | "list" | "revoke";
  keyId?: string;
  name?: string;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/api-keys", body);
  const payload = await readJsonResponse<ApiKeysResponse>(response);

  if (payload.configured === false) {
    throw new LangclawApiError(
      payload.error || "API keys are not configured.",
      503,
    );
  }

  if (payload.configured !== true) {
    throw invalidApiKeyResponse();
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function memoryRequest(body: {
  action: "bulk-delete" | "bulk-status" | "delete" | "list" | "status";
  memoryId?: string;
  memoryIds?: string[];
  status?: MemoryStatus;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/memory", body);
  const payload = await readJsonResponse<MemoryResponse>(response);

  if (payload.configured === false) {
    throw new LangclawApiError(
      payload.error || "Memory storage is not configured.",
      503,
    );
  }

  if (payload.configured !== true) {
    throw invalidMemoryResponse();
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function memorySettingsRequest(body: {
  action: "get" | "update";
  settings?: MemorySettingsInput;
  wallet: WalletAuth;
}) {
  const response = await postJson("/api/memory/settings", body);
  const payload = await readJsonResponse<MemoryResponse>(response);

  if (payload.configured === false) {
    throw new LangclawApiError(
      payload.error || "Memory settings are not configured.",
      503,
    );
  }

  if (payload.configured !== true) {
    throw invalidMemoryResponse();
  }

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload;
}

async function readAutomationResponse<T>(response: Response) {
  const payload = await readJsonResponse<AutomationResponse<T>>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  return payload as T;
}

function requireMemoryItems(value: unknown) {
  if (!Array.isArray(value) || !value.every(isMemoryItem)) {
    throw invalidMemoryResponse();
  }

  return value as MemoryItem[];
}

function requireMemoryItem(value: unknown) {
  if (!isMemoryItem(value)) {
    throw invalidMemoryResponse();
  }

  return value;
}

function isMemoryItem(value: unknown): value is MemoryItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const memory = value as Record<string, unknown>;
  const lastUsed = memory.lastUsed;
  const updatedAt = memory.updatedAt;

  return (
    isNonEmptyResponseString(memory.id) &&
    isNonEmptyResponseString(memory.memory) &&
    ["Preference", "Project", "Workflow", "Personal", "API"].includes(
      String(memory.category),
    ) &&
    isNonEmptyResponseString(memory.scope) &&
    (memory.status === "active" || memory.status === "disabled") &&
    isNonEmptyResponseString(memory.source) &&
    isValidResponseTimestamp(lastUsed) &&
    isValidResponseTimestamp(updatedAt) &&
    Date.parse(lastUsed) <= Date.parse(updatedAt) &&
    typeof memory.confidence === "number" &&
    Number.isFinite(memory.confidence) &&
    memory.confidence >= 0 &&
    memory.confidence <= 100
  );
}

function requireMemorySettings(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidMemoryResponse();
  }

  const settings = value as Record<string, unknown>;

  if (
    typeof settings.autoDisableLowConfidence !== "boolean" ||
    typeof settings.captureEnabled !== "boolean" ||
    typeof settings.crossChatRecall !== "boolean" ||
    typeof settings.projectScopedRecall !== "boolean" ||
    !Number.isInteger(settings.retentionDays) ||
    (settings.retentionDays as number) < 0 ||
    !isValidResponseTimestamp(settings.updatedAt)
  ) {
    throw invalidMemoryResponse();
  }

  return value as MemorySettings;
}

function requireMemoryStats(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidMemoryResponse();
  }

  const stats = value as Record<string, unknown>;

  if (
    ![stats.active, stats.disabled, stats.projectScoped, stats.total].every(
      (entry) => typeof entry === "number" && Number.isInteger(entry) && entry >= 0,
    ) ||
    (stats.active as number) + (stats.disabled as number) !== stats.total ||
    (stats.projectScoped as number) > (stats.total as number)
  ) {
    throw invalidMemoryResponse();
  }

  return value as MemoryStats;
}

function readDeletedMemoryIds(value: unknown, fallback: string[]) {
  if (value === undefined) {
    return fallback;
  }

  if (!Array.isArray(value) || !value.every(isNonEmptyResponseString)) {
    throw invalidMemoryResponse();
  }

  return value as string[];
}

function readMemoryMutationFlag(value: unknown) {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw invalidMemoryResponse();
  }

  return value;
}

function invalidMemoryResponse() {
  return new LangclawApiError("Backend returned invalid memory data.", 500);
}

function buildMemoryStats(memories: MemoryItem[]): MemoryStats {
  return {
    active: memories.filter((memory) => memory.status === "active").length,
    disabled: memories.filter((memory) => memory.status === "disabled").length,
    projectScoped: memories.filter((memory) => memory.scope !== "Global").length,
    total: memories.length,
  };
}

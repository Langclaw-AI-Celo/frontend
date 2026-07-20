import {
  CHAT_SESSIONS_UPDATED_EVENT,
  LangclawApiError,
  getLangclawApiBaseUrl,
  getLangclawApiUrl,
  checkBackendHealth,
  requestWalletChallenge,
  createWalletSession,
  runDiscover,
  streamDiscover,
  streamChat,
  listChatSessions,
  getChatSession,
  upsertChatSession,
  deleteChatSession,
  updateChatSessionMetadata,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  getMemoryDashboard,
  setMemoryStatus,
  setManyMemoryStatuses,
  deleteMemoryRecord,
  deleteManyMemoryRecords,
  getMemorySettings,
  updateMemorySettings,
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
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  verifyUsageDeposit,
  requestUsageWithdraw,
  listProofDecisions,
  runStrategyBacktest,
  scanStrategyPairs,
  openStrategyPaperTrade,
  listStrategyRuns,
  listAlphaWatchlist,
  upsertAlphaWatchlistItem,
  deleteAlphaWatchlistItem,
  clearAlphaWatchlist,
  dispatchChatSessionsUpdated,
  readFriendlyError,
  isWalletSignatureRequiredError,
} from "../lib/langclaw-api.ts";

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
} from "../lib/langclaw-api.ts";

export const langclawApiRuntimeContract = {
  CHAT_SESSIONS_UPDATED_EVENT,
  LangclawApiError,
  getLangclawApiBaseUrl,
  getLangclawApiUrl,
  checkBackendHealth,
  requestWalletChallenge,
  createWalletSession,
  runDiscover,
  streamDiscover,
  streamChat,
  listChatSessions,
  getChatSession,
  upsertChatSession,
  deleteChatSession,
  updateChatSessionMetadata,
  listApiKeys,
  createApiKey,
  revokeApiKey,
  getMemoryDashboard,
  setMemoryStatus,
  setManyMemoryStatuses,
  deleteMemoryRecord,
  deleteManyMemoryRecords,
  getMemorySettings,
  updateMemorySettings,
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
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  verifyUsageDeposit,
  requestUsageWithdraw,
  listProofDecisions,
  runStrategyBacktest,
  scanStrategyPairs,
  openStrategyPaperTrade,
  listStrategyRuns,
  listAlphaWatchlist,
  upsertAlphaWatchlistItem,
  deleteAlphaWatchlistItem,
  clearAlphaWatchlist,
  dispatchChatSessionsUpdated,
  readFriendlyError,
  isWalletSignatureRequiredError,
} as const;

export type LangclawApiTypeContract = {
  SourceType: SourceType;
  ProviderName: ProviderName;
  ProviderTraceStatus: ProviderTraceStatus;
  ProviderTraceScope: ProviderTraceScope;
  ProviderTraceEntry: ProviderTraceEntry;
  SourceCard: SourceCard;
  ProviderError: ProviderError;
  StepExecution: StepExecution;
  WorkflowProgressEvent: WorkflowProgressEvent;
  OrchestrationStep: OrchestrationStep;
  FinalConclusion: FinalConclusion;
  FinalAnswer: FinalAnswer;
  FinalAnswerMeta: FinalAnswerMeta;
  DiscoverSignalStatus: DiscoverSignalStatus;
  DiscoverSignalSection: DiscoverSignalSection;
  DiscoverSignals: DiscoverSignals;
  ResearchReportKind: ResearchReportKind;
  ResearchReportSeverity: ResearchReportSeverity;
  ResearchReportConfidence: ResearchReportConfidence;
  DefiRankingCoverage: DefiRankingCoverage;
  DefiRankingMetrics: DefiRankingMetrics;
  ResearchReportEntity: ResearchReportEntity;
  ResearchReportTable: ResearchReportTable;
  ResearchReportSection: ResearchReportSection;
  ResearchReport: ResearchReport;
  ZeroGStorageStatus: ZeroGStorageStatus;
  ZeroGChainStatus: ZeroGChainStatus;
  ZeroGComputeStatus: ZeroGComputeStatus;
  ZeroGTokenUsage: ZeroGTokenUsage;
  ZeroGComputeBilling: ZeroGComputeBilling;
  ZeroGTeeVerification: ZeroGTeeVerification;
  ZeroGProof: ZeroGProof;
  ModelUsageReceipt: ModelUsageReceipt;
  ChatMode: ChatMode;
  ProductChainId: ProductChainId;
  DirectChatUsage: DirectChatUsage;
  WorkflowChainContext: WorkflowChainContext;
  DiscoverPayload: DiscoverPayload;
  DirectChatPayload: DirectChatPayload;
  OnChainDomain: OnChainDomain;
  OnChainProvider: OnChainProvider;
  OnChainPlanSummary: OnChainPlanSummary;
  OnChainToolCallEvent: OnChainToolCallEvent;
  OnChainToolResult: OnChainToolResult;
  OnChainToolFinalPayload: OnChainToolFinalPayload;
  StoredChatMessage: StoredChatMessage;
  ChatSession: ChatSession;
  WalletAuth: WalletAuth;
  WalletAuthPurpose: WalletAuthPurpose;
  WalletChallenge: WalletChallenge;
  ApiKeyRecord: ApiKeyRecord;
  ApiKeyCreatePayload: ApiKeyCreatePayload;
  AutomationTriggerType: AutomationTriggerType;
  AutomationFrequency: AutomationFrequency;
  AutomationTaskStatus: AutomationTaskStatus;
  AutomationRunStatus: AutomationRunStatus;
  AutomationTriggeredBy: AutomationTriggeredBy;
  AutomationNotificationChannel: AutomationNotificationChannel;
  AutomationInAppNotificationStatus: AutomationInAppNotificationStatus;
  AutomationSettings: AutomationSettings;
  AutomationTask: AutomationTask;
  AutomationRun: AutomationRun;
  AutomationInAppNotification: AutomationInAppNotification;
  AutomationStats: AutomationStats;
  MemoryStatus: MemoryStatus;
  MemoryCategory: MemoryCategory;
  MemoryItem: MemoryItem;
  MemoryStats: MemoryStats;
  MemorySettings: MemorySettings;
  MemoryDashboard: MemoryDashboard;
  MemorySettingsInput: MemorySettingsInput;
  AutomationDashboard: AutomationDashboard;
  AutomationTaskInput: AutomationTaskInput;
  AutomationSettingsInput: AutomationSettingsInput;
  ChatStreamInput: ChatStreamInput;
  ChatStreamChunk: ChatStreamChunk;
  DiscoverStreamInput: DiscoverStreamInput;
  DiscoverStreamChunk: DiscoverStreamChunk;
  UsageBalance: UsageBalance;
  UsageQuote: UsageQuote;
  UsageBalancePayload: UsageBalancePayload;
  UsageQuotePayload: UsageQuotePayload;
  UsageDepositVerifyPayload: UsageDepositVerifyPayload;
  UsageWithdrawRequestPayload: UsageWithdrawRequestPayload;
  UsageVaultInfoPayload: UsageVaultInfoPayload;
  ProofDecision: ProofDecision;
  ProofDecisionsPayload: ProofDecisionsPayload;
  StrategyAction: StrategyAction;
  StrategyRecordStatus: StrategyRecordStatus;
  StrategyBacktestParams: StrategyBacktestParams;
  StrategyMarketBar: StrategyMarketBar;
  StrategyTrade: StrategyTrade;
  StrategyEquityPoint: StrategyEquityPoint;
  StrategyMetrics: StrategyMetrics;
  StrategySignal: StrategySignal;
  TradingJournalProof: TradingJournalProof;
  StrategyBacktestPayload: StrategyBacktestPayload;
  StrategyScanCandidate: StrategyScanCandidate;
  StrategyScanPayload: StrategyScanPayload;
  StrategyPaperTradePayload: StrategyPaperTradePayload;
  StrategyRunRecord: StrategyRunRecord;
  StrategyRunsPayload: StrategyRunsPayload;
  StrategyBacktestResponse: StrategyBacktestResponse;
  StrategyPaperTradeResponse: StrategyPaperTradeResponse;
  StrategyScanResponse: StrategyScanResponse;
  AlphaWatchlistItem: AlphaWatchlistItem;
  AlphaWatchlistPayload: AlphaWatchlistPayload;
  RouterPricing: RouterPricing;
  RouterModel: RouterModel;
};

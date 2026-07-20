export {
  LangclawApiError,
  checkBackendHealth,
  getLangclawApiBaseUrl,
  getLangclawApiUrl,
  isWalletSignatureRequiredError,
  readFriendlyError,
} from "./langclaw-api/core.ts";

export {
  requestWalletChallenge,
  createWalletSession,
} from "./langclaw-api/auth.ts";

export {
  runDiscover,
  streamDiscover,
} from "./langclaw-api/discovery.ts";

export {
  CHAT_SESSIONS_UPDATED_EVENT,
  streamChat,
  listChatSessions,
  getChatSession,
  upsertChatSession,
  deleteChatSession,
  updateChatSessionMetadata,
  dispatchChatSessionsUpdated,
} from "./langclaw-api/chat.ts";

export {
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from "./langclaw-api/api-keys.ts";

export {
  getMemoryDashboard,
  setMemoryStatus,
  setManyMemoryStatuses,
  deleteMemoryRecord,
  deleteManyMemoryRecords,
  getMemorySettings,
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
  listProofDecisions,
} from "./langclaw-api/proof.ts";

export {
  runStrategyBacktest,
  scanStrategyPairs,
  openStrategyPaperTrade,
  listStrategyRuns,
} from "./langclaw-api/strategy.ts";

export {
  listAlphaWatchlist,
  upsertAlphaWatchlistItem,
  deleteAlphaWatchlistItem,
  clearAlphaWatchlist,
} from "./langclaw-api/watchlist.ts";

export type * from "./langclaw-api/types.ts";

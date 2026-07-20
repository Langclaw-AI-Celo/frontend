export type SourceType =
  | "x_post"
  | "github_repo"
  | "docs_page"
  | "hackquest_hackathon"
  | "hackquest_project";

export type ProviderName =
  | "X"
  | "GitHub"
  | "Tavily"
  | "HackQuest"
  | "Surf"
  | "Nansen"
  | "Elfa";

export type ProviderTraceStatus = "success" | "failed" | "skipped";

export type ProviderTraceScope =
  | "celo-premium"
  | "mantle-premium"
  | "legacy-fallback"
  | "legacy-default"
  | "out-of-scope";

export type ProviderTraceEntry = {
  provider: string;
  status: ProviderTraceStatus;
  scope: ProviderTraceScope;
  message: string;
  sourceCount?: number;
};

export type SourceCard = {
  id: string;
  type: SourceType;
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  excerpt: string;
  metrics?: Record<string, string | number | undefined>;
  provider: ProviderName;
};

export type ProviderError = {
  provider: ProviderName;
  message: string;
};

export type StepExecution =
  | "openclaw-agent"
  | "typescript-tool"
  | "openai"
  | "evidence-bundle"
  | "chain-proof"
  | "mantle-chain"
  | "deterministic-fallback";

export type WorkflowProgressEvent = {
  stepId: string;
  agent: string;
  skill: string;
  status: "pending" | "running" | "complete" | "failed";
  summary: string;
  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  execution?: StepExecution;
  model?: string;
  sessionId?: string;
  error?: string;
};

export type OrchestrationStep = {
  agent: string;
  skill: string;
  status: "complete" | "failed";
  summary: string;
  execution?: StepExecution;
  model?: string;
  sessionId?: string;
  error?: string;
};

export type FinalConclusion = {
  headline: string;
  summary: string;
  keySignals: Array<{
    label: string;
    text: string;
    sourceId?: string;
    sourceIds: string[];
  }>;
  recommendation: string;
  qualityNote: string;
  generatedBy: "Final Conclusion Agent";
};

export type FinalAnswer = {
  title?: string;
  answer: string;
  answerMarkdown?: string;
  bullets: string[];
  recommendation?: string;
  caveat?: string;
  generatedBy: "Final Conclusion Agent";
};

export type FinalAnswerMeta = {
  synthesis: "openai" | "openclaw-ai" | "deterministic-fallback";
  execution?: StepExecution;
  model?: string;
  requestedModel?: string;
  usedModel?: string;
  modelHonored?: boolean;
  sessionId?: string;
  transport?: string;
  fallbackFrom?: string;
  error?: string;
};

export type DiscoverSignalStatus =
  | "success"
  | "partial"
  | "skipped"
  | "failed";

export type DiscoverSignalSection = {
  status: DiscoverSignalStatus;
  summary: string;
  providers: string[];
  sourceIds: string[];
  toolIds: string[];
  caveat?: string;
};

export type DiscoverSignals = {
  social: DiscoverSignalSection;
  onchain: DiscoverSignalSection;
  combined: DiscoverSignalSection;
};

export type ResearchReportKind =
  | "liquidity-anomaly"
  | "smart-money"
  | "market-brief"
  | "defi-yield"
  | "token-discovery"
  | "mixed-research";

export type ResearchReportSeverity =
  | "high"
  | "medium"
  | "watch"
  | "fragile"
  | "info";

export type ResearchReportConfidence =
  | "high"
  | "medium"
  | "low"
  | "insufficient";

export type DefiRankingCoverage =
  | "composite"
  | "tvl+apy"
  | "context-only";

export type DefiRankingMetrics = {
  score?: number | null;
  tvlUsd?: number | null;
  bestApy?: number | null;
  momentumScore?: number | null;
  poolCount?: number | null;
  coverage?: DefiRankingCoverage | null;
};

export type ResearchReportEntity = {
  id: string;
  label: string;
  category: string;
  rank: number;
  severity: ResearchReportSeverity;
  summary: string;
  metrics: Record<string, string | number | null>;
  sourceIds: string[];
  toolIds: string[];
};

export type ResearchReportTable = {
  id: string;
  title: string;
  description?: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
};

export type ResearchReportSection = {
  id: string;
  title: string;
  markdown: string;
  sourceIds: string[];
  toolIds: string[];
};

export type ResearchReport = {
  kind: ResearchReportKind;
  title: string;
  asOfUtc: string;
  executiveSummary: string;
  bottomLine: string;
  confidence: ResearchReportConfidence;
  entities: ResearchReportEntity[];
  tables: ResearchReportTable[];
  sections: ResearchReportSection[];
  caveats: string[];
  recommendations: string[];
};

export type ZeroGStorageStatus = "prepared" | "uploaded" | "skipped" | "failed";

export type ZeroGChainStatus =
  | "prepared"
  | "pending"
  | "anchored"
  | "skipped"
  | "failed";

export type ZeroGComputeStatus = "used" | "skipped" | "failed";

export type ZeroGTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  maxTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ZeroGComputeBilling = {
  inputCostNeuron?: string;
  outputCostNeuron?: string;
  totalCostNeuron?: string;
  source: "router-trace" | "token-estimate" | "reserved-estimate";
};

export type ZeroGTeeVerification = {
  requested: boolean;
  routerVerified?: boolean | null;
  independentVerified?: boolean | null;
  status:
    | "not-requested"
    | "router-verified"
    | "router-unverified"
    | "router-missing"
    | "independent-verified"
    | "independent-failed"
    | "independent-unavailable"
    | "independent-error";
  chatId?: string;
  error?: string;
};

export type ZeroGProof = {
  storage: {
    status: ZeroGStorageStatus;
    evidenceUri: string;
    rootHash?: string;
    txHash?: string;
    explorerUrl?: string;
    indexerRpc?: string;
    error?: string;
  };
  chain: {
    status: ZeroGChainStatus;
    briefHash: string;
    chain?: ProductChainId;
    decisionHash?: string;
    decisionId?: string;
    agentId?: string;
    signalType?: string;
    txHash?: string;
    explorerUrl?: string;
    registryAddress?: string;
    chainId?: number;
    chainName?: string;
    nativeSymbol?: string;
    error?: string;
  };
  compute?: {
    status: ZeroGComputeStatus;
    model?: string;
    requestedModel?: string;
    usedModel?: string;
    modelHonored?: boolean;
    fallbackFrom?: string;
    endpoint?: string;
    chatId?: string;
    requestId?: string;
    provider?: string;
    teeVerified?: boolean | null;
    teeVerification?: ZeroGTeeVerification;
    usage?: ZeroGTokenUsage;
    billing?: ZeroGComputeBilling;
    error?: string;
  };
};

export type ModelUsageReceipt = {
  wallet: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  nativeSymbol?: string;
  model: string;
  requestId?: string;
  provider?: string;
  teeVerified?: boolean | null;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  maxTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  promptPriceNeuron: string;
  completionPriceNeuron: string;
  reservedNeuron: string;
  rawCostNeuron: string;
  markupBps: number;
  markupNeuron: string;
  chargedNeuron: string;
  releasedNeuron: string;
  balanceBefore: string;
  balanceAfter: string;
  costSource: "router-trace" | "token-estimate" | "reserved-estimate";
  meter?: Record<string, unknown>;
  totalCostNeuron?: string;
  status: "charged" | "estimated" | "refunded" | "failed_after_charge";
};

export type ChatMode = "chat" | "onchain" | "research";

export type ProductChainId = "mantle" | "celo";

export type DirectChatUsage = ZeroGTokenUsage & {
  meter?: Record<string, unknown>;
  model: string;
  totalCostNeuron?: string;
};

export type WorkflowChainContext = {
  productChain: {
    id: string;
    name: string;
    chainId: number;
    nativeSymbol: string;
  };
  analysisChain: {
    id: string;
    name: string;
    chainId: number;
    nativeSymbol?: string;
    source: "product-fallback" | "prompt";
    supported: boolean;
  };
  unsupportedAnalysisChain?: {
    id: string;
    name: string;
  };
};

export type DiscoverPayload = {
  topic: string;
  generatedAt: string;
  chainContext?: WorkflowChainContext;
  sources: SourceCard[];
  errors: ProviderError[];
  providerTrace?: ProviderTraceEntry[];
  signals?: DiscoverSignals;
  report?: ResearchReport;
  onChain?: OnChainToolFinalPayload;
  onChainSkippedReason?: string;
  orchestration: {
    runtime: "openclaw" | "typescript";
    steps: OrchestrationStep[];
  };
  finalConclusion: FinalConclusion;
  finalAnswer: FinalAnswer;
  finalAnswerMeta?: FinalAnswerMeta;
  agentOutputs?: {
    planner?: {
      summary: string;
      providerPlan: Array<{
        provider: ProviderName;
        query: string;
        purpose: string;
      }>;
      scoringFocus: string[];
    };
    trend?: {
      summary: string;
      topTrend: string;
      score: number;
      rankedTrends: Array<{
        label: string;
        score: number;
        why: string;
        sourceIds: string[];
      }>;
    };
    evidence?: {
      bundleSummary: string;
      storageStatus: ZeroGStorageStatus;
      evidenceUri: string;
      rootHash?: string;
      storageTxHash?: string;
      storageExplorerUrl?: string;
      error?: string;
      claimMap: Array<{
        claim: string;
        sourceIds: string[];
      }>;
    };
    verifier?: {
      verificationSummary: string;
      unsupportedClaims: string[];
      briefHashInput: string;
      storageStatus: ZeroGStorageStatus;
      chainStatus: ZeroGChainStatus;
      chainTxHash?: string;
      chainExplorerUrl?: string;
      registryAddress?: string;
      error?: string;
    };
  };
  proof?: ZeroGProof;
  zeroG?: ZeroGProof;
  usage?: ModelUsageReceipt;
};

export type DirectChatPayload = {
  answer: string;
  model?: string;
  requestedModel?: string;
  usedModel?: string;
  fallbackFrom?: string;
  modelHonored?: boolean;
  source?: "openai" | "fallback";
  teeVerified?: boolean | null;
  teeVerification?: ZeroGTeeVerification;
  title?: string;
  usage?: DirectChatUsage;
  error?: string;
};

export type OnChainDomain =
  | "token_discovery"
  | "market_data"
  | "pair_liquidity"
  | "wallet_portfolio"
  | "wallet_pnl"
  | "smart_money"
  | "defi_tvl"
  | "yield_pools"
  | "token_security"
  | "honeypot_detection"
  | "address_approval_risk"
  | "social_sentiment"
  | "raw_onchain_query"
  | "trading_signal_analysis";

export type OnChainProvider =
  | "alchemy"
  | "coingecko"
  | "defillama"
  | "dexscreener"
  | "dune"
  | "elfa"
  | "etherscan"
  | "geckoterminal"
  | "goplus"
  | "local"
  | "nansen"
  | "surf";

export type OnChainPlanSummary = {
  analysisSource?: "product-fallback" | "prompt";
  capabilities?: {
    chain: string;
    chainName: string;
    marketData: unknown;
    notes: string[];
    security: unknown;
    smartMoney: unknown;
    structuredOnChain: string;
  };
  intent: string;
  chain: string;
  chainId: number;
  chainName: string;
  commands: Array<{
    commandId: string;
    domain: OnChainDomain;
    provider: OnChainProvider;
    reason: string;
    title: string;
  }>;
  domainCount: number;
  nativeSymbol: string;
  providerGaps?: string[];
  providerTrace?: ProviderTraceEntry[];
  productChain?: ProductChainId;
  productChainId?: number;
  productChainName?: string;
  rawQuery?: string;
  query?: string;
  registryCommandCount: number;
  tokenAddress?: string;
  walletAddress?: string;
};

export type OnChainToolCallEvent = {
  commandId: string;
  domain: OnChainDomain;
  provider: OnChainProvider;
  reason: string;
  title: string;
};

export type OnChainToolResult = {
  attemptedProviders?: OnChainProvider[];
  commandId: string;
  data?: unknown;
  domain: OnChainDomain;
  error?: string;
  fallbackReason?: string;
  latencyMs: number;
  provider: OnChainProvider;
  scope?: ProviderTraceScope;
  sourceUrl?: string;
  status: "failed" | "skipped" | "success";
  summary: string;
  title: string;
};

export type OnChainToolFinalPayload = {
  answer: string;
  bullets: string[];
  caveat: string;
  generatedAt: string;
  plan: OnChainPlanSummary;
  providerTrace?: ProviderTraceEntry[];
  proof?: ZeroGProof;
  recommendation: string;
  report?: ResearchReport;
  title: string;
  tools: OnChainToolResult[];
  usage?: ModelUsageReceipt;
};

export type StoredChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  chain?: ProductChainId;
  mode?: ChatMode;
  model?: string;
  result?: DiscoverPayload;
  directAnswer?: DirectChatPayload;
  onChain?: OnChainToolFinalPayload;
  progressEvents?: WorkflowProgressEvent[];
  error?: string;
  stopped?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  messages: StoredChatMessage[];
};

export type WalletAuth = {
  address: string;
  message?: string;
  sessionExpiresAt?: string;
  sessionToken?: string;
  signature?: string;
};

export type WalletAuthPurpose = "api-key:create" | "session";

export type WalletChallenge = {
  address: string;
  chainId: number;
  domain: string;
  expiresAt: string;
  issuedAt: string;
  message: string;
  nonce: string;
  purpose: WalletAuthPurpose;
  uri: string;
};

export type ApiKeyRecord = {
  id: string;
  name: string;
  prefix?: string;
  suffix?: string;
  maskedKey: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
};

export type ApiKeyCreatePayload = {
  configured: true;
  key: ApiKeyRecord;
  secret: string;
};

export type AutomationTriggerType = "schedule" | "event" | "webhook";

export type AutomationFrequency = "daily" | "weekly" | "monthly";

export type AutomationTaskStatus = "draft" | "active" | "paused" | "archived";

export type AutomationRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "canceled";

export type AutomationTriggeredBy =
  | "schedule"
  | "event"
  | "webhook"
  | "manual"
  | "system";

export type AutomationNotificationChannel = "email" | "telegram" | "in-app";

export type AutomationInAppNotificationStatus = "unread" | "read";

export type AutomationSettings = {
  retryPolicy: "none" | "3-attempts" | "5-attempts";
  failureNotification: "email" | "in-app" | "none";
  notificationChannels: AutomationNotificationChannel[];
  notificationEmail?: string;
  notificationEmailLinkedAt?: string;
  notificationEmailPending?: string;
  notificationEmailVerified: boolean;
  telegramChatId?: string;
  telegramLinkedAt?: string;
  telegramUsername?: string;
  telegramVerified: boolean;
  autoPauseRepeatedFailures: boolean;
  writeRunLogsToMemory: boolean;
  dailyLimit0G: string;
  monthlyCap0G: string;
  limitBehavior: "pause" | "alert" | "allow";
  lowBalanceThreshold0G: string;
  thresholdAction: "notify" | "pause" | "continue";
};

export type AutomationTask = {
  id: string;
  name: string;
  project: string;
  prompt?: string;
  model?: string;
  triggerType: AutomationTriggerType;
  scheduleFrequency?: AutomationFrequency;
  scheduleTime: string;
  scheduleWeekday?: number;
  scheduleMonthDay?: number;
  timezone: string;
  eventName?: string;
  webhookSlug?: string;
  status: AutomationTaskStatus;
  displayStatus: "Draft" | "Active" | "Paused" | "Running";
  triggerLabel: string;
  lastRunAt?: string;
  lastRunStatus?: AutomationRunStatus;
  nextRunAt?: string;
  consecutiveFailures: number;
  maxRetries: number;
  failureThreshold: number;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRun = {
  id: string;
  taskId: string;
  taskName?: string;
  status: AutomationRunStatus;
  triggeredBy: AutomationTriggeredBy;
  attempt: number;
  scheduledFor?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
  usage?: unknown;
  createdAt: string;
};

export type AutomationInAppNotification = {
  id: string;
  title: string;
  body: string;
  status: AutomationInAppNotificationStatus;
  taskId?: string;
  runId?: string;
  metadata: unknown;
  readAt?: string;
  createdAt: string;
};

export type AutomationStats = {
  activeTasks: number;
  scheduledTasks: number;
  eventTasks: number;
  runningNow: number;
  successRate: number;
  nextRunAt?: string;
  nextRunTaskName?: string;
  pendingRuns: number;
  completedThisWeek: number;
};

export type MemoryStatus = "active" | "disabled";

export type MemoryCategory =
  | "Preference"
  | "Project"
  | "Workflow"
  | "Personal"
  | "API";

export type MemoryItem = {
  id: string;
  memory: string;
  category: MemoryCategory;
  scope: string;
  status: MemoryStatus;
  source: string;
  lastUsed: string;
  updatedAt: string;
  confidence: number;
};

export type MemoryStats = {
  active: number;
  disabled: number;
  projectScoped: number;
  total: number;
};

export type MemorySettings = {
  autoDisableLowConfidence: boolean;
  captureEnabled: boolean;
  crossChatRecall: boolean;
  projectScopedRecall: boolean;
  retentionDays: number;
  updatedAt: string;
};

export type MemoryDashboard = {
  configured: true;
  memories: MemoryItem[];
  settings: MemorySettings;
  stats: MemoryStats;
};

export type MemorySettingsInput = Partial<
  Pick<
    MemorySettings,
    | "autoDisableLowConfidence"
    | "captureEnabled"
    | "crossChatRecall"
    | "projectScopedRecall"
    | "retentionDays"
  >
>;

export type AutomationDashboard = {
  configured: true;
  notifications: AutomationInAppNotification[];
  tasks: AutomationTask[];
  recentRuns: AutomationRun[];
  settings: AutomationSettings;
  stats: AutomationStats;
};

export type AutomationTaskInput = {
  name?: string;
  project?: string;
  prompt?: string;
  model?: string;
  triggerType?: AutomationTriggerType;
  scheduleFrequency?: AutomationFrequency;
  scheduleTime?: string;
  scheduleWeekday?: number;
  scheduleMonthDay?: number;
  timezone?: string;
  eventName?: string;
  status?: Extract<AutomationTaskStatus, "draft" | "active" | "paused">;
};

export type AutomationSettingsInput = Partial<
  Pick<
    AutomationSettings,
    | "autoPauseRepeatedFailures"
    | "dailyLimit0G"
    | "failureNotification"
    | "limitBehavior"
    | "lowBalanceThreshold0G"
    | "monthlyCap0G"
    | "notificationChannels"
    | "notificationEmail"
    | "retryPolicy"
    | "telegramChatId"
    | "thresholdAction"
    | "writeRunLogsToMemory"
  >
>;

export type ChatStreamInput = {
  chain?: ProductChainId;
  message: string;
  messages?: Array<Pick<StoredChatMessage, "role" | "content">>;
  model?: string;
  researchTrend?: boolean;
  sessionId?: string;
  toolMode?: ChatMode;
  wallet?: WalletAuth;
  signal?: AbortSignal;
  onDirectDelta?: (delta: string) => void;
  onDirectReasoningDelta?: (delta: string) => void;
  onDirect?: (payload: DirectChatPayload) => void;
  onMode?: (mode: string) => void;
  onToolCall?: (event: OnChainToolCallEvent) => void;
  onToolFinal?: (payload: OnChainToolFinalPayload) => void;
  onToolPlan?: (plan: OnChainPlanSummary) => void;
  onToolResult?: (event: OnChainToolResult) => void;
  onProgress?: (event: WorkflowProgressEvent) => void;
  onResult?: (payload: DiscoverPayload) => void;
  onError?: (message: string) => void;
};

export type ChatStreamChunk =
  | {
      type: "direct_delta";
      delta?: string;
    }
  | {
      type: "direct_reasoning_delta";
      delta?: string;
    }
  | {
      type: "direct";
      payload?: DirectChatPayload;
    }
  | {
      type: "mode";
      mode?: string;
    }
  | {
      type: "tool_plan";
      plan?: OnChainPlanSummary;
    }
  | {
      type: "tool_call";
      event?: OnChainToolCallEvent;
    }
  | {
      type: "tool_result";
      event?: OnChainToolResult;
    }
  | {
      type: "tool_final";
      payload?: OnChainToolFinalPayload;
    }
  | {
      type: "progress";
      event?: WorkflowProgressEvent;
    }
  | {
      type: "result";
      payload?: DiscoverPayload;
    }
  | {
      type: "error";
      error?: string;
    };

export type DiscoverStreamInput = {
  topic: string;
  wallet?: WalletAuth;
  signal?: AbortSignal;
  onProgress?: (event: WorkflowProgressEvent) => void;
  onResult?: (payload: DiscoverPayload) => void;
  onError?: (message: string) => void;
};

export type DiscoverStreamChunk =
  | {
      type: "progress";
      event?: WorkflowProgressEvent;
    }
  | {
      type: "result";
      payload?: DiscoverPayload;
    }
  | {
      type: "error";
      error?: string;
    };

export type UsageBalance = {
  chain?: ProductChainId;
  chainId?: number;
  nativeSymbol?: string;
  availableNeuron: string;
  available0G: string;
  availableNative?: string;
  reservedNeuron: string;
  reserved0G: string;
  reservedNative?: string;
  lifetimeDepositedNeuron: string;
  lifetimeDeposited0G: string;
  lifetimeDepositedNative?: string;
  lifetimeChargedNeuron: string;
  lifetimeCharged0G: string;
  lifetimeChargedNative?: string;
};

export type UsageQuote = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  model: string;
  nativeSymbol?: string;
  endpoint: string;
  promptPriceNeuron: string;
  completionPriceNeuron: string;
  imagePriceNeuron?: string;
  promptPriceUsd?: string;
  completionPriceUsd?: string;
  imagePriceUsd?: string;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedCostNeuron: string;
  estimatedCost0G: string;
  estimatedCostNative?: string;
  priceFetchedAt: string;
};

export type UsageBalancePayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  nativeSymbol?: string;
  wallet: string;
  balance: UsageBalance;
  quote?: UsageQuote;
};

export type UsageQuotePayload = {
  configured: true;
  quote: UsageQuote;
};

export type UsageDepositVerifyPayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  nativeSymbol?: string;
  wallet: string;
  walletSession?: WalletAuth;
  txHash: string;
  amountNeuron: string;
  amount0G: string;
  amountNative?: string;
  credited: boolean;
  balanceBefore: string;
  balanceAfter: string;
};

export type UsageWithdrawRequestPayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  billingCurrency?: {
    decimals: number;
    feeCurrencyAddress?: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
  };
  depositFunctionName?: "deposit" | "depositTokenAmount";
  nativeSymbol?: string;
  wallet: string;
  vaultAddress: string;
  functionName: "withdraw";
  balance: UsageBalance;
  note: string;
};

export type UsageVaultInfoPayload = {
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  configured: true;
  billingCurrency?: {
    decimals: number;
    feeCurrencyAddress?: string;
    name: string;
    symbol: string;
    tokenAddress?: string;
  };
  depositFunctionName?: "deposit" | "depositTokenAmount";
  nativeSymbol?: string;
  vaultAddress: string;
};

export type ProofDecision = {
  agentId: string;
  createdAt: string;
  decisionHash: string;
  decisionId: string;
  evidenceUri: string;
  explorerUrl?: string;
  recorder: string;
  runId: string;
  signalType: string;
  txHash?: string;
};

export type ProofDecisionsPayload = {
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  configured: true;
  decisions: ProofDecision[];
  nativeSymbol?: string;
  nextDecisionId: string;
  registryAddress: string;
};

export type StrategyAction = "buy" | "sell" | "hold" | "exit";

export type StrategyRecordStatus =
  | "backtested"
  | "paper-opened"
  | "paper-closed";

export type StrategyBacktestParams = {
  initialCapitalUsd: number;
  maxHoldHours: number;
  minLiquidityUsd: number;
  minMomentumBps: number;
  minVolumeMultiple: number;
  stopLossBps: number;
  takeProfitBps: number;
};

export type StrategyMarketBar = {
  liquidityUsd: number;
  netWhaleFlowUsd?: number;
  pairAddress: string;
  priceUsd: number;
  timestamp: string;
  txCount?: number;
  volumeUsd: number;
};

export type StrategyTrade = {
  entryAt: string;
  entryPriceUsd: number;
  exitAt: string;
  exitPriceUsd: number;
  holdHours: number;
  pnlBps: number;
  pnlUsd: number;
  reason: string;
};

export type StrategyEquityPoint = {
  equityUsd: number;
  timestamp: string;
};

export type StrategyMetrics = {
  finalEquityUsd: number;
  initialCapitalUsd: number;
  maxDrawdownBps: number;
  totalPnlBps: number;
  totalPnlUsd: number;
  tradeCount: number;
  winRate: number;
};

export type StrategySignal = {
  action: StrategyAction;
  confidence: number;
  liquidityUsd: number;
  momentumBps: number;
  priceUsd: number;
  rationale: string;
  volumeUsd: number;
};

export type TradingJournalProof = {
  action: StrategyAction;
  agentId: string;
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  decisionHash: string;
  error?: string;
  evidenceUri: string;
  explorerUrl?: string;
  journalAddress?: string;
  pnlBps: number;
  recordId?: string;
  resultHash: string;
  status: "anchored" | "failed" | "pending" | "prepared";
  strategyStatus: StrategyRecordStatus;
  txHash?: string;
};

export type StrategyBacktestPayload = {
  bars: StrategyMarketBar[];
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  equityCurve: StrategyEquityPoint[];
  generatedAt: string;
  latestSignal: StrategySignal;
  market: string;
  metrics: StrategyMetrics;
  pairAddress: string;
  params: StrategyBacktestParams;
  proof?: TradingJournalProof;
  queryId: string;
  runId: string;
  sourceUrl: string;
  strategyId: string;
  title: string;
  trades: StrategyTrade[];
};

export type StrategyScanCandidate = {
  latestSignal: StrategySignal;
  latestTimestamp: string;
  market: string;
  metrics: StrategyMetrics;
  pairAddress: string;
  rank: number;
  rowCount: number;
  score: number;
  scoreReason: string;
  totalVolumeUsd: number;
};

export type StrategyScanPayload = {
  bestBacktest: StrategyBacktestPayload;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  candidates: StrategyScanCandidate[];
  generatedAt: string;
  queryId: string;
  scannedPairs: number;
  selectedPairAddress: string;
  sourceUrl: string;
};

export type StrategyPaperTradePayload = {
  action: StrategyAction;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  confidence: number;
  generatedAt: string;
  market: string;
  notionalUsd: number;
  pairAddress: string;
  proof: TradingJournalProof;
  rationale: string;
  referenceBacktestRunId: string;
  runId: string;
  strategyId: string;
};

export type StrategyRunRecord = {
  action: StrategyAction;
  agentId: string;
  chain?: ProductChainId;
  chainId?: number;
  chainName?: string;
  createdAt: string;
  decisionHash: string;
  evidenceUri: string;
  explorerUrl?: string;
  market: string;
  pnlBps: number;
  recordId: string;
  recorder: string;
  resultHash: string;
  runId: string;
  status: StrategyRecordStatus;
  strategyId: string;
  txHash?: string;
};

export type StrategyRunsPayload = {
  chain?: ProductChainId;
  chainId: number;
  chainName?: string;
  configured: boolean;
  error?: string;
  journalAddress?: string;
  nextRecordId: string;
  records: StrategyRunRecord[];
};

export type StrategyBacktestResponse = {
  backtest: StrategyBacktestPayload;
  configured: true;
};

export type StrategyPaperTradeResponse = {
  configured: true;
  paperTrade: StrategyPaperTradePayload;
};

export type StrategyScanResponse = {
  configured: true;
  scan: StrategyScanPayload;
};

export type AlphaWatchlistItem = {
  addedAt: string;
  agentId?: string;
  caveat: string;
  chain: string;
  decisionHash?: string;
  decisionId?: string;
  evidenceUri?: string;
  explorerUrl?: string;
  gapCount: number;
  id: string;
  intent: string;
  proofTx?: string;
  recommendation: string;
  signalType: string;
  sourceCount: number;
  subject: string;
  summary: string;
  title: string;
};

export type AlphaWatchlistPayload = {
  cleared?: boolean;
  configured: true;
  deleted?: boolean;
  item?: AlphaWatchlistItem;
  itemId?: string;
  items?: AlphaWatchlistItem[];
};

export type RouterPricing = {
  prompt?: string;
  completion?: string;
  image?: string;
  [key: string]: string | undefined;
};

export type RouterModel = {
  id: string;
  name?: string;
  type?: string;
  context_length?: number;
  max_completion_tokens?: number;
  supported_parameters?: string[];
  supported_formats?: string[];
  pricing?: RouterPricing;
  pricing_usd?: RouterPricing;
  provider_count?: number;
  [key: string]: unknown;
};

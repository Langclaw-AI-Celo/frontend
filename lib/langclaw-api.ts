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

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://nanta.tech:3002"
    : "http://localhost:3001";

export const CHAT_SESSIONS_UPDATED_EVENT = "langclaw-chat-sessions-updated";

export class LangclawApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.name = "LangclawApiError";
    this.status = status;
  }
}

export function getLangclawApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_LANGCLAW_API_URL?.replace(/\/+$/, "") ||
    DEFAULT_BACKEND_URL
  );
}

export function getLangclawApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getLangclawApiBaseUrl()}${normalizedPath}`;
}

export async function checkBackendHealth() {
  const response = await getRequest("/health");
  const payload = await readJsonResponse<{
    ok: boolean;
    service: string;
  }>(response);

  if (payload.ok !== true || !isNonEmptyResponseString(payload.service)) {
    throw new LangclawApiError("Backend returned invalid health data.", 500);
  }

  return payload;
}

export async function requestWalletChallenge(input: {
  address: string;
  chainId?: number;
  purpose?: WalletAuthPurpose;
}) {
  const response = await postJson("/api/wallet/challenge", input);
  const payload = await readJsonResponse<{
    challenge?: WalletChallenge;
    configured: true;
    error?: string;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (!payload.challenge) {
    throw new LangclawApiError("Wallet challenge was not returned.", 500);
  }

  if (
    !isWalletChallenge(payload.challenge) ||
    payload.challenge.address.toLowerCase() !== input.address.trim().toLowerCase() ||
    (input.chainId !== undefined && payload.challenge.chainId !== input.chainId) ||
    payload.challenge.purpose !== (input.purpose ?? "session")
  ) {
    throw new LangclawApiError(
      "Backend returned invalid wallet challenge data.",
      500,
    );
  }

  return payload.challenge;
}

function isWalletChallenge(value: unknown): value is WalletChallenge {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const challenge = value as Record<string, unknown>;
  const issuedAt =
    typeof challenge.issuedAt === "string"
      ? Date.parse(challenge.issuedAt)
      : Number.NaN;
  const expiresAt =
    typeof challenge.expiresAt === "string"
      ? Date.parse(challenge.expiresAt)
      : Number.NaN;

  return (
    isEvmAddressResponse(challenge.address) &&
    isPositiveResponseInteger(challenge.chainId) &&
    isNonEmptyResponseString(challenge.domain) &&
    Number.isFinite(issuedAt) &&
    Number.isFinite(expiresAt) &&
    expiresAt > issuedAt &&
    expiresAt > Date.now() &&
    isNonEmptyResponseString(challenge.message) &&
    isNonEmptyResponseString(challenge.nonce) &&
    (challenge.purpose === "api-key:create" ||
      challenge.purpose === "session") &&
    isNonEmptyResponseString(challenge.uri)
  );
}

export async function createWalletSession(wallet: WalletAuth) {
  const response = await postJson("/api/wallet/session", { wallet });
  const payload = await readJsonResponse<{
    configured: true;
    error?: string;
    wallet?: WalletAuth;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (!payload.wallet?.sessionToken) {
    throw new LangclawApiError("Wallet session was not returned.", 500);
  }

  if (
    !isWalletSession(payload.wallet) ||
    payload.wallet.address.toLowerCase() !== wallet.address.trim().toLowerCase()
  ) {
    throw new LangclawApiError(
      "Backend returned invalid wallet session data.",
      500,
    );
  }

  return payload.wallet;
}

function isWalletSession(value: unknown): value is WalletAuth {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const wallet = value as Record<string, unknown>;

  return (
    isEvmAddressResponse(wallet.address) &&
    isNonEmptyResponseString(wallet.sessionToken) &&
    isFutureResponseTimestamp(wallet.sessionExpiresAt) &&
    isOptionalResponseString(wallet.message) &&
    isOptionalResponseString(wallet.signature)
  );
}

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

function isNonEmptyResponseString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isEvmAddressResponse(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isValidResponseTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim()) &&
    Number.isFinite(Date.parse(value))
  );
}

function isFutureResponseTimestamp(value: unknown) {
  return isValidResponseTimestamp(value) && Date.parse(value) > Date.now();
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

  return (
    isNonEmptyResponseString(key.id) &&
    isNonEmptyResponseString(key.name) &&
    isNonEmptyResponseString(key.maskedKey) &&
    (key.status === "active" || key.status === "revoked") &&
    isValidResponseTimestamp(key.createdAt) &&
    isOptionalResponseString(key.prefix) &&
    isOptionalResponseString(key.suffix) &&
    isOptionalResponseTimestamp(key.lastUsedAt) &&
    ((key.status === "active" && key.revokedAt === undefined) ||
      (key.status === "revoked" && isValidResponseTimestamp(key.revokedAt)))
  );
}

function isOptionalResponseString(value: unknown) {
  return value === undefined || isNonEmptyResponseString(value);
}

function isOptionalResponseTimestamp(value: unknown) {
  return value === undefined || isValidResponseTimestamp(value);
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

function isAutomationTask(value: unknown): value is AutomationTask {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.name) &&
    isNonEmptyResponseString(value.project) &&
    isOptionalResponseString(value.prompt) &&
    isOptionalResponseString(value.model) &&
    ["schedule", "event", "webhook"].includes(String(value.triggerType)) &&
    (value.scheduleFrequency === undefined ||
      ["daily", "weekly", "monthly"].includes(
        String(value.scheduleFrequency),
      )) &&
    isNonEmptyResponseString(value.scheduleTime) &&
    (value.scheduleWeekday === undefined ||
      isBoundedResponseInteger(value.scheduleWeekday, 0, 6)) &&
    (value.scheduleMonthDay === undefined ||
      isBoundedResponseInteger(value.scheduleMonthDay, 1, 31)) &&
    isNonEmptyResponseString(value.timezone) &&
    isOptionalResponseString(value.eventName) &&
    isOptionalResponseString(value.webhookSlug) &&
    ["draft", "active", "paused", "archived"].includes(
      String(value.status),
    ) &&
    ["Draft", "Active", "Paused", "Running"].includes(
      String(value.displayStatus),
    ) &&
    isNonEmptyResponseString(value.triggerLabel) &&
    isOptionalResponseTimestamp(value.lastRunAt) &&
    (value.lastRunStatus === undefined ||
      isAutomationRunStatus(value.lastRunStatus)) &&
    isOptionalResponseTimestamp(value.nextRunAt) &&
    isNonNegativeResponseInteger(value.consecutiveFailures) &&
    isNonNegativeResponseInteger(value.maxRetries) &&
    isPositiveResponseInteger(value.failureThreshold) &&
    isValidResponseTimestamp(value.createdAt) &&
    isValidResponseTimestamp(value.updatedAt)
  );
}

function isAutomationRun(value: unknown): value is AutomationRun {
  if (!isResponseObject(value)) {
    return false;
  }

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
    isOptionalResponseTimestamp(value.startedAt) &&
    isOptionalResponseTimestamp(value.completedAt) &&
    (value.durationMs === undefined ||
      isNonNegativeResponseInteger(value.durationMs)) &&
    isOptionalResponseString(value.error) &&
    isValidResponseTimestamp(value.createdAt)
  );
}

function isAutomationRunStatus(value: unknown) {
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

  return (
    isNonEmptyResponseString(value.id) &&
    isNonEmptyResponseString(value.title) &&
    isNonEmptyResponseString(value.body) &&
    (value.status === "unread" || value.status === "read") &&
    isOptionalResponseString(value.taskId) &&
    isOptionalResponseString(value.runId) &&
    isOptionalResponseTimestamp(value.readAt) &&
    isValidResponseTimestamp(value.createdAt)
  );
}

function isAutomationSettings(value: unknown): value is AutomationSettings {
  if (!isResponseObject(value)) {
    return false;
  }

  return (
    ["none", "3-attempts", "5-attempts"].includes(
      String(value.retryPolicy),
    ) &&
    ["email", "in-app", "none"].includes(
      String(value.failureNotification),
    ) &&
    Array.isArray(value.notificationChannels) &&
    value.notificationChannels.every((channel) =>
      ["email", "telegram", "in-app"].includes(String(channel)),
    ) &&
    isOptionalResponseString(value.notificationEmail) &&
    isOptionalResponseTimestamp(value.notificationEmailLinkedAt) &&
    isOptionalResponseString(value.notificationEmailPending) &&
    typeof value.notificationEmailVerified === "boolean" &&
    isOptionalResponseString(value.telegramChatId) &&
    isOptionalResponseTimestamp(value.telegramLinkedAt) &&
    isOptionalResponseString(value.telegramUsername) &&
    typeof value.telegramVerified === "boolean" &&
    typeof value.autoPauseRepeatedFailures === "boolean" &&
    typeof value.writeRunLogsToMemory === "boolean" &&
    isNonEmptyResponseString(value.dailyLimit0G) &&
    isNonEmptyResponseString(value.monthlyCap0G) &&
    ["pause", "alert", "allow"].includes(String(value.limitBehavior)) &&
    isNonEmptyResponseString(value.lowBalanceThreshold0G) &&
    ["notify", "pause", "continue"].includes(String(value.thresholdAction))
  );
}

function isAutomationStats(value: unknown): value is AutomationStats {
  if (!isResponseObject(value)) {
    return false;
  }

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
    isOptionalResponseTimestamp(value.nextRunAt) &&
    isOptionalResponseString(value.nextRunTaskName)
  );
}

function isResponseObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBoundedResponseInteger(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  return (
    isFiniteResponseNumber(value) &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
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
    !isValidResponseTimestamp(payload.link.expiresAt) ||
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

  if (
    typeof payload.linked !== "boolean" ||
    !isNonEmptyResponseString(payload.status) ||
    (payload.settings !== undefined &&
      !isAutomationSettings(payload.settings))
  ) {
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

  if (
    ![
      value.botUsername,
      value.code,
      value.command,
      value.deepLink,
    ].every(isNonEmptyResponseString) ||
    !isValidResponseTimestamp(value.expiresAt)
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
      value.available0G,
      value.reservedNeuron,
      value.reserved0G,
      value.lifetimeDepositedNeuron,
      value.lifetimeDeposited0G,
      value.lifetimeChargedNeuron,
      value.lifetimeCharged0G,
    ].every(isNonEmptyResponseString) &&
    [
      value.availableNative,
      value.reservedNative,
      value.lifetimeDepositedNative,
      value.lifetimeChargedNative,
    ].every(isOptionalResponseString)
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

function isUnsignedIntegerString(value: unknown) {
  return typeof value === "string" && /^(0|[1-9]\d*)$/.test(value);
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

  return (
    isValidResponseTimestamp(trade.entryAt) &&
    isPositiveResponseNumber(trade.entryPriceUsd) &&
    isValidResponseTimestamp(trade.exitAt) &&
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

function isOptionalProductChain(value: unknown) {
  return value === undefined || value === "celo" || value === "mantle";
}

function isFiniteResponseNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveResponseNumber(value: unknown) {
  return isFiniteResponseNumber(value) && value > 0;
}

function isNonNegativeResponseNumber(value: unknown) {
  return isFiniteResponseNumber(value) && value >= 0;
}

function isPositiveResponseInteger(value: unknown) {
  return isPositiveResponseNumber(value) && Number.isInteger(value);
}

function isOptionalPositiveResponseInteger(value: unknown) {
  return value === undefined || isPositiveResponseInteger(value);
}

function isOptionalFiniteResponseNumber(value: unknown) {
  return value === undefined || isFiniteResponseNumber(value);
}

function isOptionalNonNegativeResponseInteger(value: unknown) {
  return value === undefined || isNonNegativeResponseInteger(value);
}

function isBoundedResponseNumber(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  return (
    isFiniteResponseNumber(value) && value >= minimum && value <= maximum
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

function isNonNegativeResponseInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
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

  return (
    isNonEmptyResponseString(memory.id) &&
    isNonEmptyResponseString(memory.memory) &&
    ["Preference", "Project", "Workflow", "Personal", "API"].includes(
      String(memory.category),
    ) &&
    isNonEmptyResponseString(memory.scope) &&
    (memory.status === "active" || memory.status === "disabled") &&
    isNonEmptyResponseString(memory.source) &&
    isValidResponseTimestamp(memory.lastUsed) &&
    isValidResponseTimestamp(memory.updatedAt) &&
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

export function readFriendlyError(error: unknown, fallback: string) {
  const messages = readErrorMessages(error);
  const message = messages[0] || fallback;
  const searchableMessage = messages.join("\n") || fallback;
  const providerCode = readProviderErrorCode(error);
  const status = error instanceof LangclawApiError ? error.status : 0;
  const insufficientBalanceSymbol = readInsufficientBalanceSymbol(searchableMessage);

  if (insufficientBalanceSymbol) {
    return `Insufficient ${insufficientBalanceSymbol} balance. Add ${insufficientBalanceSymbol} credits before running this request.`;
  }

  if (status === 402) {
    return "Insufficient usage balance. Add credits before running this request.";
  }

  if (
    error instanceof LangclawApiError &&
    (error.code === "telegram_link_required" ||
      (status === 403 && /telegram connection is required/i.test(message)))
  ) {
    return "Connect Telegram to continue.";
  }

  if (/minipay session required/i.test(searchableMessage)) {
    return "MiniPay session required. Open the Credits page, add or verify a USDT deposit, then continue without a wallet signature.";
  }

  if (/minipay does not use wallet signature prompts/i.test(searchableMessage)) {
    return "This MiniPay action needs a fresh wallet signature. Use a browser wallet outside MiniPay for signature-only actions.";
  }

  if (/wallet signature or api key is required/i.test(searchableMessage)) {
    return "Connect and approve your wallet to continue.";
  }

  if (/wallet signature is required/i.test(searchableMessage)) {
    return "Approve the wallet prompt to continue.";
  }

  if (
    providerCode === 4001 ||
    providerCode === "ACTION_REJECTED" ||
    /(?:user )?(?:rejected|denied)(?: the)? (?:request|transaction|signature)|request rejected/i.test(
      searchableMessage,
    )
  ) {
    return "You rejected the wallet request.";
  }

  if (
    /wallet session (?:has )?(?:expired|invalid|revoked)|invalid_wallet_session|session token (?:expired|invalid)/i.test(
      searchableMessage,
    )
  ) {
    return "Your wallet session expired. Reconnect and approve your wallet.";
  }

  if (
    /connector (?:not connected|unavailable)|wallet (?:is )?(?:not connected|disconnected)|no connector|provider disconnected/i.test(
      searchableMessage,
    )
  ) {
    return "Reconnect your wallet and try again.";
  }

  if (
    /chain (?:is )?not (?:configured|supported)|switchchain|switch chain|unrecognized chain|wallet_(?:add|switch)ethereumchain|unsupported chain|wrong network/i.test(
      searchableMessage,
    )
  ) {
    return "Switch your wallet to the selected network and try again.";
  }

  if (
    /insufficient funds(?: for (?:gas|intrinsic transaction cost))?|funds for gas|exceeds the balance of the account/i.test(
      searchableMessage,
    )
  ) {
    return "Your wallet does not have enough funds for this transaction and network fee.";
  }

  if (
    /transaction (?:was )?replaced|replacement transaction|transaction .*cancelled|transaction .*canceled/i.test(
      searchableMessage,
    )
  ) {
    return "The transaction was replaced or cancelled in your wallet. Check its latest status.";
  }

  if (
    /execution reverted|contract function .*revert|transaction .*revert|revert reason/i.test(
      searchableMessage,
    )
  ) {
    return "The transaction reverted. Check the amount, allowance, and contract state.";
  }

  if (
    /nonce (?:too low|too high|has already been used)|already known|replacement transaction underpriced|transaction underpriced/i.test(
      searchableMessage,
    )
  ) {
    return "Your wallet transaction state is out of date. Refresh and try again.";
  }

  if (
    /estimate gas|gas estimation|intrinsic gas|fee cap|base fee|max fee per gas|gas required exceeds allowance/i.test(
      searchableMessage,
    )
  ) {
    return "The network could not estimate or cover the transaction fee. Refresh and try again.";
  }

  if (
    /rpc (?:request )?failed|failed to fetch|fetch failed|network (?:request |connection )?(?:failed|error)|timeout|timed out|http request failed|connection refused|socket hang up/i.test(
      searchableMessage,
    )
  ) {
    return "The wallet network is unavailable. Check your connection and try again.";
  }

  if (/supabase/i.test(searchableMessage)) {
    return "Account storage is not ready yet. Check backend configuration.";
  }

  return message || fallback;
}

function readErrorMessages(error: unknown) {
  const messages: string[] = [];
  collectErrorMessages(error, messages, new Set<object>());
  return [...new Set(messages)];
}

function collectErrorMessages(
  error: unknown,
  messages: string[],
  seen: Set<object>,
) {
  if (typeof error === "string") {
    const message = error.trim();

    if (message) {
      messages.push(message);
    }
    return;
  }

  if (!error || typeof error !== "object" || seen.has(error)) {
    return;
  }

  seen.add(error);
  const record = error as {
    cause?: unknown;
    details?: unknown;
    message?: unknown;
    reason?: unknown;
    shortMessage?: unknown;
  };

  for (const candidate of [
    record.shortMessage,
    record.message,
    record.reason,
    record.details,
  ]) {
    if (typeof candidate === "string" && candidate.trim()) {
      messages.push(candidate.trim());
    }
  }

  collectErrorMessages(record.cause, messages, seen);
}

function readProviderErrorCode(error: unknown): number | string | undefined {
  const seen = new Set<object>();
  let current = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as { cause?: unknown; code?: unknown };

    if (typeof record.code === "number" || typeof record.code === "string") {
      return record.code;
    }

    current = record.cause;
  }

  return undefined;
}

function readInsufficientBalanceSymbol(message: string) {
  const match = message.match(/insufficient\s+(mnt|usdt|celo)\s+balance/i);

  return match?.[1]?.toUpperCase() ?? "";
}

export function isWalletSignatureRequiredError(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  return /wallet signature( or api key)? is required/i.test(message);
}

async function getRequest(
  path: string,
  headers?: Record<string, string>,
  signal?: AbortSignal,
) {
  return fetch(getLangclawApiUrl(path), {
    cache: "no-store",
    headers,
    signal,
  });
}

async function postJson(path: string, body: unknown, signal?: AbortSignal) {
  return fetch(getLangclawApiUrl(path), {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
}

async function readJsonResponse<T>(response: Response) {
  let payload: {
    code?: unknown;
    error?: unknown;
  } | null;

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    if (response.ok) {
      throw new LangclawApiError(
        "Backend returned an invalid JSON response.",
        response.status,
      );
    }

    payload = null;
  }

  if (!response.ok) {
    throw new LangclawApiError(
      normalizeError(payload?.error) ||
        `Request failed with status ${response.status}.`,
      response.status,
      typeof payload?.code === "string" ? payload.code : undefined,
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new LangclawApiError(
      "Backend returned an unexpected JSON response.",
      response.status,
    );
  }

  return payload as T;
}

async function readNdjson<TChunk>(
  response: Response,
  onChunk: (chunk: TChunk) => void,
) {
  if (!response.ok) {
    await readJsonResponse(response);
    return;
  }

  if (!response.body) {
    throw new LangclawApiError(
      "Streaming response was empty.",
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      onChunk(parseNdjsonChunk<TChunk>(trimmed, response.status));
    }
  }

  const remaining = buffer.trim();

  if (remaining) {
    onChunk(parseNdjsonChunk<TChunk>(remaining, response.status));
  }
}

function parseNdjsonChunk<TChunk>(value: string, status: number) {
  let chunk: unknown;

  try {
    chunk = JSON.parse(value);
  } catch {
    throw new LangclawApiError(
      "Backend returned an invalid streaming response.",
      status,
    );
  }

  if (!chunk || typeof chunk !== "object" || Array.isArray(chunk)) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  const type = (chunk as Record<string, unknown>).type;

  if (typeof type !== "string" || !type.trim()) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  return chunk as TChunk;
}

function readErrorMessage(value: unknown) {
  return normalizeError(value) || "Langclaw request failed.";
}

function readStreamObject<T>(value: unknown, status: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  return value as T;
}

function readStreamString(
  value: unknown,
  status: number,
  requireContent = false,
) {
  if (
    typeof value !== "string" ||
    (requireContent && value.trim().length === 0)
  ) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  return value;
}

function normalizeError(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }
  }

  return "";
}

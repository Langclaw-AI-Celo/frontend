import { safeExternalUrl } from "../external-url.ts";

import {
  LangclawApiError,
  isBoundedResponseNumber,
  isConsistentProductChainResponse,
  isEvmAddressResponse,
  isFiniteResponseNumber,
  isNonEmptyResponseString,
  isNonNegativeResponseInteger,
  isNonNegativeResponseNumber,
  isOptionalFiniteResponseNumber,
  isOptionalNonNegativeResponseInteger,
  isOptionalPositiveResponseInteger,
  isOptionalProductChain,
  isOptionalResponseString,
  isPositiveResponseInteger,
  isPositiveResponseNumber,
  isTransactionHashResponse,
  isUnsignedIntegerString,
  isValidResponseTimestamp,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type {
  ProductChainId,
  StrategyBacktestPayload,
  StrategyBacktestResponse,
  StrategyPaperTradePayload,
  StrategyPaperTradeResponse,
  StrategyRunsPayload,
  StrategyScanPayload,
  StrategyScanResponse,
  TradingJournalProof,
} from "./types.ts";

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
    isConsistentProductChainResponse(
      backtest.chain,
      backtest.chainId,
      backtest.chainName,
    ) &&
    Array.isArray(backtest.equityCurve) &&
    backtest.equityCurve.every(isStrategyEquityPoint) &&
    isValidResponseTimestamp(backtest.generatedAt) &&
    isStrategySignal(backtest.latestSignal) &&
    isNonEmptyResponseString(backtest.market) &&
    isStrategyMetrics(backtest.metrics) &&
    isEvmAddressResponse(backtest.pairAddress) &&
    isStrategyParams(backtest.params) &&
    isNonEmptyResponseString(backtest.queryId) &&
    isNonEmptyResponseString(backtest.runId) &&
    isExternalUrlResponse(backtest.sourceUrl) &&
    isNonEmptyResponseString(backtest.strategyId) &&
    isNonEmptyResponseString(backtest.title) &&
    Array.isArray(backtest.trades) &&
    backtest.trades.every(isStrategyTrade) &&
    isConsistentStrategyIdentity(
      backtest.chain,
      backtest.pairAddress,
      backtest.market,
      backtest.strategyId,
    ) &&
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
    isEvmAddressResponse(bar.pairAddress) &&
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
    isUnsignedIntegerString(proof.agentId) &&
    isOptionalProductChain(proof.chain) &&
    isPositiveResponseInteger(proof.chainId) &&
    isOptionalResponseString(proof.chainName) &&
    isConsistentProductChainResponse(
      proof.chain,
      proof.chainId,
      proof.chainName,
    ) &&
    isTransactionHashResponse(proof.decisionHash) &&
    isOptionalResponseString(proof.error) &&
    isNonEmptyResponseString(proof.evidenceUri) &&
    isOptionalExternalUrlResponse(proof.explorerUrl) &&
    isOptionalEvmAddress(proof.journalAddress) &&
    isFiniteResponseNumber(proof.pnlBps) &&
    isOptionalUnsignedIntegerString(proof.recordId) &&
    isTransactionHashResponse(proof.resultHash) &&
    ["anchored", "failed", "pending", "prepared"].includes(
      String(proof.status),
    ) &&
    ["backtested", "paper-opened", "paper-closed"].includes(
      String(proof.strategyStatus),
    ) &&
    isOptionalTransactionHash(proof.txHash)
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
    isConsistentProductChainResponse(scan.chain, scan.chainId, scan.chainName) &&
    Array.isArray(scan.candidates) &&
    scan.candidates.every((candidate) =>
      isStrategyScanCandidate(candidate, scan.chain),
    ) &&
    isValidResponseTimestamp(scan.generatedAt) &&
    isNonEmptyResponseString(scan.queryId) &&
    isNonNegativeResponseInteger(scan.scannedPairs) &&
    isEvmAddressResponse(scan.selectedPairAddress) &&
    isExternalUrlResponse(scan.sourceUrl)
  );
}

function isStrategyScanCandidate(value: unknown, chain: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isStrategySignal(candidate.latestSignal) &&
    isValidResponseTimestamp(candidate.latestTimestamp) &&
    isNonEmptyResponseString(candidate.market) &&
    isStrategyMetrics(candidate.metrics) &&
    isEvmAddressResponse(candidate.pairAddress) &&
    isPositiveResponseInteger(candidate.rank) &&
    isNonNegativeResponseInteger(candidate.rowCount) &&
    isFiniteResponseNumber(candidate.score) &&
    isNonEmptyResponseString(candidate.scoreReason) &&
    isNonNegativeResponseNumber(candidate.totalVolumeUsd) &&
    isConsistentStrategyIdentity(
      chain,
      candidate.pairAddress,
      candidate.market,
    )
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
    isConsistentProductChainResponse(
      paperTrade.chain,
      paperTrade.chainId,
      paperTrade.chainName,
    ) &&
    isBoundedResponseNumber(paperTrade.confidence, 0, 100) &&
    isValidResponseTimestamp(paperTrade.generatedAt) &&
    isNonEmptyResponseString(paperTrade.market) &&
    isPositiveResponseNumber(paperTrade.notionalUsd) &&
    isEvmAddressResponse(paperTrade.pairAddress) &&
    proof !== undefined &&
    isTradingJournalProof(proof) &&
    isNonEmptyResponseString(paperTrade.rationale) &&
    isNonEmptyResponseString(paperTrade.referenceBacktestRunId) &&
    isNonEmptyResponseString(paperTrade.runId) &&
    isNonEmptyResponseString(paperTrade.strategyId) &&
    isConsistentStrategyIdentity(
      paperTrade.chain,
      paperTrade.pairAddress,
      paperTrade.market,
      paperTrade.strategyId,
    ) &&
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
    isConsistentProductChainResponse(runs.chain, runs.chainId, runs.chainName) &&
    typeof runs.configured === "boolean" &&
    isOptionalResponseString(runs.error) &&
    isOptionalEvmAddress(runs.journalAddress) &&
    isUnsignedIntegerString(runs.nextRecordId) &&
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
    isUnsignedIntegerString(record.agentId) &&
    isOptionalProductChain(record.chain) &&
    isOptionalPositiveResponseInteger(record.chainId) &&
    isOptionalResponseString(record.chainName) &&
    isConsistentProductChainResponse(
      record.chain,
      record.chainId,
      record.chainName,
    ) &&
    isValidResponseTimestamp(record.createdAt) &&
    isTransactionHashResponse(record.decisionHash) &&
    isNonEmptyResponseString(record.evidenceUri) &&
    isOptionalExternalUrlResponse(record.explorerUrl) &&
    isNonEmptyResponseString(record.market) &&
    isFiniteResponseNumber(record.pnlBps) &&
    isUnsignedIntegerString(record.recordId) &&
    isEvmAddressResponse(record.recorder) &&
    isTransactionHashResponse(record.resultHash) &&
    isNonEmptyResponseString(record.runId) &&
    ["backtested", "paper-opened", "paper-closed"].includes(
      String(record.status),
    ) &&
    isNonEmptyResponseString(record.strategyId) &&
    isConsistentStrategyIdentity(
      record.chain,
      undefined,
      record.market,
      record.strategyId,
    ) &&
    isOptionalTransactionHash(record.txHash)
  );
}

function isConsistentStrategyIdentity(
  chain: unknown,
  pairAddress: unknown,
  market: unknown,
  strategyId?: unknown,
) {
  if (chain === undefined) {
    return true;
  }

  if (
    (chain !== "celo" && chain !== "mantle") ||
    typeof market !== "string"
  ) {
    return false;
  }

  const marketPrefix = `${chain}:`;
  const marketPairAddress = market.startsWith(marketPrefix)
    ? market.slice(marketPrefix.length)
    : undefined;

  if (
    typeof marketPairAddress !== "string" ||
    !isEvmAddressResponse(marketPairAddress)
  ) {
    return false;
  }

  return (
    (pairAddress === undefined ||
      (typeof pairAddress === "string" &&
        marketPairAddress.toLowerCase() === pairAddress.toLowerCase())) &&
    (strategyId === undefined ||
      (typeof strategyId === "string" && strategyId.startsWith(`${chain}-`)))
  );
}

function isOptionalEvmAddress(value: unknown) {
  return value === undefined || isEvmAddressResponse(value);
}

function isOptionalUnsignedIntegerString(value: unknown) {
  return value === undefined || isUnsignedIntegerString(value);
}

function isOptionalTransactionHash(value: unknown) {
  return value === undefined || isTransactionHashResponse(value);
}

function isExternalUrlResponse(value: unknown) {
  return safeExternalUrl(value) !== undefined;
}

function isOptionalExternalUrlResponse(value: unknown) {
  return value === undefined || isExternalUrlResponse(value);
}

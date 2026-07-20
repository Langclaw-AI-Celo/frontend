import type { WalletAuth } from "./types.ts";

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://nanta.tech:3002"
    : "http://localhost:3001";
const MAX_JSON_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_NDJSON_CHUNK_CHARACTERS = 1_048_576;

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
  const configured = process.env.NEXT_PUBLIC_LANGCLAW_API_URL?.trim();

  if (!configured) {
    return DEFAULT_BACKEND_URL;
  }

  const candidate = configured.replace(/\/+$/, "");

  try {
    const url = new URL(candidate);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new TypeError("Unsafe backend URL.");
    }
  } catch {
    throw new LangclawApiError(
      "Backend URL must be an absolute HTTP or HTTPS URL without credentials, query, or fragment.",
      500,
    );
  }

  return candidate;
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

export function isNonEmptyResponseString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

export function isEvmAddressResponse(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isTransactionHashResponse(value: unknown) {
  return typeof value === "string" && /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function isValidResponseTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Boolean(value.trim()) &&
    Number.isFinite(Date.parse(value))
  );
}

export function isFutureResponseTimestamp(value: unknown) {
  return isValidResponseTimestamp(value) && Date.parse(value) > Date.now();
}

export function isWalletSession(value: unknown): value is WalletAuth {
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

export function isOptionalResponseString(value: unknown) {
  return value === undefined || isNonEmptyResponseString(value);
}

export function isOptionalResponseTimestamp(value: unknown) {
  return value === undefined || isValidResponseTimestamp(value);
}

export function isOptionalResponseTimestampAtOrAfter(
  value: unknown,
  earliest: string,
) {
  return (
    value === undefined ||
    (isValidResponseTimestamp(value) &&
      Date.parse(value) >= Date.parse(earliest))
  );
}

export function isResponseObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isBoundedResponseInteger(
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

export function isUnsignedIntegerString(value: unknown) {
  return typeof value === "string" && /^(0|[1-9]\d*)$/.test(value);
}

export function isOptionalProductChain(value: unknown) {
  return value === undefined || value === "celo" || value === "mantle";
}

export function isConsistentProductChainResponse(
  chain: unknown,
  chainId: unknown,
  chainName: unknown,
) {
  if (chain === undefined) {
    return true;
  }

  const expected =
    chain === "celo"
      ? { chainId: 42220, chainName: "Celo" }
      : chain === "mantle"
        ? { chainId: 5000, chainName: "Mantle" }
        : undefined;

  return Boolean(
    expected &&
      (chainId === undefined || chainId === expected.chainId) &&
      (chainName === undefined || chainName === expected.chainName),
  );
}

export function isFiniteResponseNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isPositiveResponseNumber(value: unknown) {
  return isFiniteResponseNumber(value) && value > 0;
}

export function isNonNegativeResponseNumber(value: unknown) {
  return isFiniteResponseNumber(value) && value >= 0;
}

export function isPositiveResponseInteger(value: unknown) {
  return isPositiveResponseNumber(value) && Number.isInteger(value);
}

export function isOptionalPositiveResponseInteger(value: unknown) {
  return value === undefined || isPositiveResponseInteger(value);
}

export function isOptionalFiniteResponseNumber(value: unknown) {
  return value === undefined || isFiniteResponseNumber(value);
}

export function isOptionalNonNegativeResponseInteger(value: unknown) {
  return value === undefined || isNonNegativeResponseInteger(value);
}

export function isBoundedResponseNumber(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  return (
    isFiniteResponseNumber(value) && value >= minimum && value <= maximum
  );
}

export function isNonNegativeResponseInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
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

export async function getRequest(
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

export async function postJson(path: string, body: unknown, signal?: AbortSignal) {
  return fetch(getLangclawApiUrl(path), {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    signal,
  });
}

export async function readJsonResponse<T>(response: Response) {
  let payload: {
    code?: unknown;
    error?: unknown;
  } | null;

  try {
    payload = JSON.parse(await readLimitedJsonResponseText(response)) as typeof payload;
  } catch (error) {
    if (error instanceof LangclawApiError) {
      throw error;
    }

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

async function readLimitedJsonResponseText(response: Response) {
  const declaredLength = response.headers.get("content-length");

  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > MAX_JSON_RESPONSE_BYTES
  ) {
    throw oversizedJsonResponse(response.status);
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      return text + decoder.decode();
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_JSON_RESPONSE_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw oversizedJsonResponse(response.status);
    }

    text += decoder.decode(value, { stream: true });
  }
}

function oversizedJsonResponse(status: number) {
  return new LangclawApiError(
    "Backend JSON response exceeded the size limit.",
    status,
  );
}

export async function readNdjson<TChunk>(
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
      assertNdjsonChunkSize(line, response.status);
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      onChunk(parseNdjsonChunk<TChunk>(trimmed, response.status));
    }

    assertNdjsonChunkSize(buffer, response.status);
  }

  buffer += decoder.decode();
  assertNdjsonChunkSize(buffer, response.status);
  const remaining = buffer.trim();

  if (remaining) {
    onChunk(parseNdjsonChunk<TChunk>(remaining, response.status));
  }
}

function assertNdjsonChunkSize(value: string, status: number) {
  if (value.length > MAX_NDJSON_CHUNK_CHARACTERS) {
    throw new LangclawApiError(
      "Backend streaming response exceeded the size limit.",
      status,
    );
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

export function readErrorMessage(value: unknown) {
  return normalizeError(value) || "Langclaw request failed.";
}

export function readStreamObject<T>(value: unknown, status: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  return value as T;
}

export function readStreamString(
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

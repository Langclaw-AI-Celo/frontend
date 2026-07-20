import {
  LangclawApiError,
  isNonEmptyResponseString,
  isOptionalResponseString,
  isOptionalResponseTimestampAtOrAfter,
  isValidResponseTimestamp,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type { ApiKeyCreatePayload, ApiKeyRecord, WalletAuth } from "./types.ts";

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

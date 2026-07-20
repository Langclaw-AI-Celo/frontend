import {
  LangclawApiError,
  isNonEmptyResponseString,
  isValidResponseTimestamp,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type {
  MemoryDashboard,
  MemoryItem,
  MemorySettings,
  MemorySettingsInput,
  MemoryStats,
  MemoryStatus,
  WalletAuth,
} from "./types.ts";

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

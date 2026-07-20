import {
  LangclawApiError,
  isNonEmptyResponseString,
  isOptionalResponseString,
  isResponseObject,
  isValidResponseTimestamp,
  postJson,
  readErrorMessage,
  readJsonResponse,
  readNdjson,
  readStreamObject,
  readStreamString,
} from "./core.ts";

import type {
  ChatSession,
  ChatStreamChunk,
  ChatStreamInput,
  DirectChatPayload,
  DiscoverPayload,
  OnChainPlanSummary,
  OnChainToolCallEvent,
  OnChainToolFinalPayload,
  OnChainToolResult,
  WalletAuth,
  WorkflowProgressEvent,
} from "./types.ts";

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

export const CHAT_SESSIONS_UPDATED_EVENT = "langclaw-chat-sessions-updated";

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
      const payload = readDirectChatPayload(chunk.payload, response.status);
      input.onDirect?.(payload);
      return;
    }

    if (chunk.type === "mode") {
      const mode = readStreamString(chunk.mode, response.status, true);

      if (mode !== "agent") {
        throw new LangclawApiError(
          "Backend returned an unexpected streaming response.",
          response.status,
        );
      }

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

function readDirectChatPayload(value: unknown, status: number) {
  const payload = readStreamObject<Record<string, unknown>>(value, status);

  if (
    typeof payload.answer !== "string" ||
    !isOptionalResponseString(payload.error) ||
    !isOptionalResponseString(payload.fallbackFrom) ||
    !isOptionalResponseString(payload.model) ||
    !isOptionalResponseString(payload.requestedModel) ||
    !isOptionalResponseString(payload.title) ||
    !isOptionalResponseString(payload.usedModel) ||
    (payload.modelHonored !== undefined &&
      typeof payload.modelHonored !== "boolean") ||
    (payload.source !== undefined &&
      payload.source !== "openai" &&
      payload.source !== "fallback") ||
    (payload.teeVerified !== undefined &&
      payload.teeVerified !== null &&
      typeof payload.teeVerified !== "boolean") ||
    (payload.teeVerification !== undefined &&
      !isResponseObject(payload.teeVerification)) ||
    (payload.usage !== undefined && !isResponseObject(payload.usage))
  ) {
    throw new LangclawApiError(
      "Backend returned an unexpected streaming response.",
      status,
    );
  }

  return payload as DirectChatPayload;
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

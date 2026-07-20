import {
  LangclawApiError,
  postJson,
  readErrorMessage,
  readJsonResponse,
  readNdjson,
  readStreamObject,
} from "./core.ts";

import type {
  DiscoverPayload,
  DiscoverStreamChunk,
  DiscoverStreamInput,
  WalletAuth,
  WorkflowProgressEvent,
} from "./types.ts";

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

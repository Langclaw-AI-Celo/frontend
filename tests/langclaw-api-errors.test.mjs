import assert from "node:assert/strict";
import test from "node:test";

import {
  checkBackendHealth,
  createApiKey,
  deleteManyMemoryRecords,
  getChatSession,
  getMemoryDashboard,
  getMemorySettings,
  LangclawApiError,
  listApiKeys,
  listChatSessions,
  readFriendlyError,
  revokeApiKey,
  setMemoryStatus,
  streamChat,
  streamDiscover,
} from "../lib/langclaw-api.ts";

test("successful responses reject invalid JSON bodies", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response("not-json", {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  await assert.rejects(
    checkBackendHealth(),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned an invalid JSON response." &&
      error.status === 200,
  );
});

test("successful responses reject non-object JSON bodies", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const body of [null, [], "invalid"]) {
    globalThis.fetch = async () => Response.json(body);

    await assert.rejects(
      checkBackendHealth(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned an unexpected JSON response." &&
        error.status === 200,
    );
  }
});

test("chat session responses reject malformed collections and records", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    sessionToken: "test-session",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const sessions of [
    "invalid",
    [null],
    [chatSessionRecord({ messages: "invalid" })],
    [
      chatSessionRecord({
        messages: [{ content: "hello", id: "m1", role: "tool" }],
      }),
    ],
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, sessions });

    await assert.rejects(
      listChatSessions(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid chat session data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      session: chatSessionRecord({ updatedAt: "not-a-date" }),
    });

  await assert.rejects(
    getChatSession(wallet, "session-1"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid chat session data." &&
      error.status === 500,
  );
});

test("API key responses reject malformed collections and records", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    sessionToken: "test-session",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const keys of [
    "invalid",
    [null],
    [apiKeyRecord({ createdAt: "invalid" })],
  ]) {
    globalThis.fetch = async () => Response.json({ configured: true, keys });

    await assert.rejects(
      listApiKeys(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid API key data." &&
        error.status === 500,
    );
  }

  for (const request of [
    () => createApiKey(wallet, "Research key"),
    () => revokeApiKey(wallet, "key-1"),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, key: "invalid", secret: 123 });

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid API key data." &&
        error.status === 500,
    );
  }
});

test("memory responses reject malformed records, settings, stats, and IDs", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    sessionToken: "test-session",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { memories: "invalid", settings: memorySettings() },
    {
      memories: [memoryRecord({ confidence: 101 })],
      settings: memorySettings(),
    },
    { memories: [], settings: "invalid" },
    { memories: [], settings: memorySettings(), stats: { total: "0" } },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, ...payload });

    await assert.rejects(
      getMemoryDashboard(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid memory data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({ configured: true, memory: { id: "memory-1" } });
  await assert.rejects(
    setMemoryStatus(wallet, "memory-1", "disabled"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid memory data." &&
      error.status === 500,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, settings: [] });
  await assert.rejects(
    getMemorySettings(wallet),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid memory data." &&
      error.status === 500,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, deletedIds: "memory-1" });
  await assert.rejects(
    deleteManyMemoryRecords(wallet, ["memory-1"]),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid memory data." &&
      error.status === 500,
  );
});

test("streaming responses reject malformed NDJSON chunks", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response("not-json\n", {
      headers: { "Content-Type": "application/x-ndjson" },
      status: 200,
    });

  await assert.rejects(
    streamDiscover({ topic: "CELO" }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned an invalid streaming response." &&
      error.status === 200,
  );
});

test("streaming responses reject non-object NDJSON chunks", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const body of ["null\n", "[]\n", '"invalid"\n']) {
    globalThis.fetch = async () =>
      new Response(body, {
        headers: { "Content-Type": "application/x-ndjson" },
        status: 200,
      });

    await assert.rejects(
      streamDiscover({ topic: "CELO" }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned an unexpected streaming response." &&
        error.status === 200,
    );
  }
});

test("streaming responses reject chunks without an event type", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const body of [
    "{}\n",
    '{"type":null}\n',
    '{"type":42}\n',
    '{"type":" "}\n',
  ]) {
    globalThis.fetch = async () =>
      new Response(body, {
        headers: { "Content-Type": "application/x-ndjson" },
        status: 200,
      });

    await assert.rejects(
      streamDiscover({ topic: "CELO" }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned an unexpected streaming response." &&
        error.status === 200,
    );
  }
});

test("streams reject unsupported event types", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response('{"type":"reslt","payload":{}}\n', {
      headers: { "Content-Type": "application/x-ndjson" },
      status: 200,
    });

  for (const request of [
    () => streamDiscover({ topic: "CELO" }),
    () => streamChat({ message: "Check CELO" }),
  ]) {
    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned an unsupported streaming event." &&
        error.status === 200,
    );
  }
});

test("streams reject malformed object event payloads", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const cases = [
    [
      () => streamDiscover({ topic: "CELO" }),
      [
        '{"type":"progress","event":[]}\n',
        '{"type":"result"}\n',
        '{"type":"result","payload":"invalid"}\n',
      ],
    ],
    [
      () => streamChat({ message: "Check CELO" }),
      [
        '{"type":"direct","payload":42}\n',
        '{"type":"tool_plan","plan":null}\n',
        '{"type":"tool_call","event":"invalid"}\n',
        '{"type":"tool_result","event":[]}\n',
        '{"type":"tool_final"}\n',
        '{"type":"progress","event":false}\n',
        '{"type":"result","payload":"invalid"}\n',
      ],
    ],
  ];

  for (const [request, bodies] of cases) {
    for (const body of bodies) {
      globalThis.fetch = async () =>
        new Response(body, {
          headers: { "Content-Type": "application/x-ndjson" },
          status: 200,
        });

      await assert.rejects(
        request(),
        (error) =>
          error instanceof LangclawApiError &&
          error.message === "Backend returned an unexpected streaming response." &&
          error.status === 200,
      );
    }
  }
});

test("chat streams reject malformed scalar event payloads", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const body of [
    '{"type":"direct_delta","delta":42}\n',
    '{"type":"direct_reasoning_delta"}\n',
    '{"type":"mode","mode":{}}\n',
    '{"type":"mode","mode":" "}\n',
  ]) {
    globalThis.fetch = async () =>
      new Response(body, {
        headers: { "Content-Type": "application/x-ndjson" },
        status: 200,
      });

    await assert.rejects(
      streamChat({ message: "Check CELO" }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned an unexpected streaming response." &&
        error.status === 200,
    );
  }
});

test("insufficient balance errors keep the currency reported by the backend", () => {
  for (const symbol of ["CELO", "MNT", "USDT"]) {
    const message = readFriendlyError(
      new LangclawApiError(`Insufficient ${symbol} balance.`, 402),
      "Request failed.",
    );

    assert.equal(
      message,
      `Insufficient ${symbol} balance. Add ${symbol} credits before running this request.`,
    );
  }
});

function chatSessionRecord(overrides = {}) {
  return {
    createdAt: "2026-07-19T05:00:00.000Z",
    id: "session-1",
    messages: [],
    pinned: false,
    title: "CELO research",
    updatedAt: "2026-07-19T05:01:00.000Z",
    ...overrides,
  };
}

function apiKeyRecord(overrides = {}) {
  return {
    createdAt: "2026-07-19T05:00:00.000Z",
    id: "key-1",
    maskedKey: "lc_live_••••1234",
    name: "Research key",
    status: "active",
    ...overrides,
  };
}

function memoryRecord(overrides = {}) {
  return {
    category: "Project",
    confidence: 90,
    id: "memory-1",
    lastUsed: "2026-07-19",
    memory: "Prefer Celo for this project.",
    scope: "Langclaw",
    source: "Chat",
    status: "active",
    updatedAt: "2026-07-19",
    ...overrides,
  };
}

function memorySettings(overrides = {}) {
  return {
    autoDisableLowConfidence: true,
    captureEnabled: true,
    crossChatRecall: true,
    projectScopedRecall: true,
    retentionDays: 365,
    updatedAt: "2026-07-19T05:00:00.000Z",
    ...overrides,
  };
}

test("payment errors without a currency use neutral credit guidance", () => {
  const message = readFriendlyError(
    new LangclawApiError("Payment required.", 402),
    "Request failed.",
  );

  assert.equal(
    message,
    "Insufficient usage balance. Add credits before running this request.",
  );
});

test("wallet failures use short actionable messages", () => {
  const cases = [
    [
      { code: 4001, message: "User rejected the request." },
      "You rejected the wallet request.",
    ],
    [
      new Error("Wallet session expired."),
      "Your wallet session expired. Reconnect and approve your wallet.",
    ],
    [
      new Error("Connector not connected"),
      "Reconnect your wallet and try again.",
    ],
    [
      new Error("Chain not configured for connector"),
      "Switch your wallet to the selected network and try again.",
    ],
  ];

  for (const [error, expected] of cases) {
    assert.equal(readFriendlyError(error, "Request failed."), expected);
  }
});

test("transaction failures normalize common wallet and RPC errors", () => {
  const cases = [
    [
      new Error("insufficient funds for gas * price + value"),
      "Your wallet does not have enough funds for this transaction and network fee.",
    ],
    [
      new Error("execution reverted: vault paused"),
      "The transaction reverted. Check the amount, allowance, and contract state.",
    ],
    [
      new Error("Transaction replaced and cancelled"),
      "The transaction was replaced or cancelled in your wallet. Check its latest status.",
    ],
    [
      new Error("nonce too low"),
      "Your wallet transaction state is out of date. Refresh and try again.",
    ],
    [
      new Error("failed to estimate gas fees"),
      "The network could not estimate or cover the transaction fee. Refresh and try again.",
    ],
    [
      new Error("RPC Request failed: timeout"),
      "The wallet network is unavailable. Check your connection and try again.",
    ],
  ];

  for (const [error, expected] of cases) {
    assert.equal(readFriendlyError(error, "Transaction failed."), expected);
  }
});

test("friendly errors read provider fields and preserve specific backend messages", () => {
  assert.equal(
    readFriendlyError(
      {
        message: "Contract call failed.",
        shortMessage: "The contract function reverted.",
      },
      "Transaction failed.",
    ),
    "The transaction reverted. Check the amount, allowance, and contract state.",
  );
  assert.equal(
    readFriendlyError(
      new LangclawApiError("Withdrawal amount exceeds authorization.", 400),
      "Request failed.",
    ),
    "Withdrawal amount exceeds authorization.",
  );
});

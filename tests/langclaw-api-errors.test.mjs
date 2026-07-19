import assert from "node:assert/strict";
import test from "node:test";

import {
  checkBackendHealth,
  clearAlphaWatchlist,
  createApiKey,
  createAutomationTask,
  createWalletSession,
  deleteAutomationTask,
  deleteAlphaWatchlistItem,
  deleteManyMemoryRecords,
  getAutomationDashboard,
  getChatSession,
  getMemoryDashboard,
  getMemorySettings,
  LangclawApiError,
  listApiKeys,
  listAlphaWatchlist,
  listAutomationRuns,
  listChatSessions,
  listStrategyRuns,
  openStrategyPaperTrade,
  readFriendlyError,
  requestWalletChallenge,
  revokeApiKey,
  runAutomationTask,
  runStrategyBacktest,
  scanStrategyPairs,
  setAllAutomationTasksStatus,
  setAutomationTaskStatus,
  setMemoryStatus,
  streamChat,
  streamDiscover,
  updateAutomationTask,
  upsertAlphaWatchlistItem,
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

test("backend health rejects malformed service status data", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { ok: "true", service: "langclaw-celo-backend" },
    { ok: true, service: "" },
    { ok: true },
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      checkBackendHealth(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid health data." &&
        error.status === 500,
    );
  }
});

test("wallet challenge responses reject malformed signing data", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const challenge = walletChallengeRecord();

  for (const invalidChallenge of [
    { ...challenge, chainId: "42220" },
    { ...challenge, expiresAt: "invalid" },
    { ...challenge, purpose: "withdraw" },
    { ...challenge, nonce: "" },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ challenge: invalidChallenge, configured: true });

    await assert.rejects(
      requestWalletChallenge({ address: challenge.address, chainId: 42220 }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid wallet challenge data." &&
        error.status === 500,
    );
  }
});

test("wallet session responses reject malformed session credentials", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    signature: "0xsigned",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const session of [
    { ...wallet, sessionExpiresAt: "2026-07-19T06:00:00.000Z", sessionToken: 42 },
    { ...wallet, address: "invalid", sessionExpiresAt: "2026-07-19T06:00:00.000Z", sessionToken: "token" },
    { ...wallet, sessionExpiresAt: "invalid", sessionToken: "token" },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, wallet: session });

    await assert.rejects(
      createWalletSession(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid wallet session data." &&
        error.status === 500,
    );
  }
});

test("automation dashboards reject malformed task, run, and settings data", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();
  const valid = automationDashboardRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { ...valid, tasks: "invalid" },
    { ...valid, recentRuns: [{ ...valid.recentRuns[0], attempt: "1" }] },
    { ...valid, settings: { ...valid.settings, notificationChannels: "email" } },
    { ...valid, stats: { ...valid.stats, activeTasks: -1 } },
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      getAutomationDashboard(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () => Response.json(valid);
  assert.deepEqual(await getAutomationDashboard(wallet), valid);
});

test("automation task mutations reject malformed records and flags", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const request of [
    () => createAutomationTask(wallet, { name: "Task" }),
    () => updateAutomationTask(wallet, "task-1", { name: "Task" }),
    () => setAutomationTaskStatus(wallet, "task-1", "active"),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, task: { id: "task-1" } });

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({ configured: true, deleted: "false" });
  await assert.rejects(
    deleteAutomationTask(wallet, "task-1"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid automation data.",
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, tasks: [automationTaskRecord({ id: "" })] });
  await assert.rejects(
    setAllAutomationTasksStatus(wallet, "paused"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid automation data.",
  );
});

test("automation run responses reject malformed records and collections", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, run: automationRunRecord({ status: "done" }) });
  await assert.rejects(
    runAutomationTask(wallet, "task-1"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid automation data.",
  );

  for (const runs of ["invalid", [automationRunRecord({ createdAt: "invalid" })]]) {
    globalThis.fetch = async () => Response.json({ configured: true, runs });

    await assert.rejects(
      listAutomationRuns(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data.",
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

test("watchlist responses reject malformed items and mutation flags", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    sessionToken: "test-session",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const items of ["invalid", [null], [watchlistRecord({ sourceCount: -1 })]]) {
    globalThis.fetch = async () => Response.json({ configured: true, items });

    await assert.rejects(
      listAlphaWatchlist(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid watchlist data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({ configured: true, item: "invalid" });
  await assert.rejects(
    upsertAlphaWatchlistItem(wallet, watchlistRecord()),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid watchlist data." &&
      error.status === 500,
  );

  for (const [request, responseBody] of [
    [() => deleteAlphaWatchlistItem(wallet, "watch-1"), { deleted: "false" }],
    [() => clearAlphaWatchlist(wallet), { cleared: 1 }],
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, ...responseBody });

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid watchlist data." &&
        error.status === 500,
    );
  }
});

test("strategy backtests reject malformed response records", async (t) => {
  const originalFetch = globalThis.fetch;
  const valid = strategyBacktestRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const backtest of [
    undefined,
    "invalid",
    { ...valid, bars: "invalid" },
    {
      ...valid,
      latestSignal: { ...valid.latestSignal, action: "transfer" },
    },
    { ...valid, metrics: { ...valid.metrics, tradeCount: "0" } },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, backtest });

    await assert.rejects(
      runStrategyBacktest({ chain: "celo", queryId: "123" }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid strategy backtest data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({ configured: true, backtest: valid });
  assert.deepEqual(
    await runStrategyBacktest({ chain: "celo", queryId: "123" }),
    valid,
  );
});

test("strategy pair scans reject malformed response records", async (t) => {
  const originalFetch = globalThis.fetch;
  const valid = strategyScanRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const scan of [
    undefined,
    "invalid",
    { ...valid, bestBacktest: {} },
    { ...valid, candidates: "invalid" },
    {
      ...valid,
      candidates: [{ ...valid.candidates[0], rank: "1" }],
    },
  ]) {
    globalThis.fetch = async () => Response.json({ configured: true, scan });

    await assert.rejects(
      scanStrategyPairs({ chain: "celo", queryId: "123" }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid strategy scan data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () => Response.json({ configured: true, scan: valid });
  assert.deepEqual(
    await scanStrategyPairs({ chain: "celo", queryId: "123" }),
    valid,
  );
});

test("strategy paper trades reject malformed response records", async (t) => {
  const originalFetch = globalThis.fetch;
  const backtest = strategyBacktestRecord();
  const valid = strategyPaperTradeRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const paperTrade of [
    undefined,
    "invalid",
    { ...valid, action: "transfer" },
    { ...valid, notionalUsd: "1000" },
    { ...valid, proof: { status: "anchored" } },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, paperTrade });

    await assert.rejects(
      openStrategyPaperTrade({ backtest, chain: "celo", notionalUsd: 1_000 }),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid strategy paper trade data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () =>
    Response.json({ configured: true, paperTrade: valid });
  assert.deepEqual(
    await openStrategyPaperTrade({
      backtest,
      chain: "celo",
      notionalUsd: 1_000,
    }),
    valid,
  );
});

test("strategy run history rejects malformed response records", async (t) => {
  const originalFetch = globalThis.fetch;
  const valid = strategyRunsRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { ...valid, chainId: "42220" },
    { ...valid, nextRecordId: 1 },
    { ...valid, records: "invalid" },
    {
      ...valid,
      records: [{ ...valid.records[0], status: "unknown" }],
    },
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      listStrategyRuns(25, "celo"),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid strategy run data." &&
        error.status === 500,
    );
  }

  globalThis.fetch = async () => Response.json(valid);
  assert.deepEqual(await listStrategyRuns(25, "celo"), valid);
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

function walletChallengeRecord(overrides = {}) {
  return {
    address: "0x1111111111111111111111111111111111111111",
    chainId: 42220,
    domain: "langclawcelo.vercel.app",
    expiresAt: "2026-07-19T05:05:00.000Z",
    issuedAt: "2026-07-19T05:00:00.000Z",
    message: "Sign in to Langclaw.",
    nonce: "nonce-1",
    purpose: "session",
    uri: "https://langclawcelo.vercel.app",
    ...overrides,
  };
}

function walletSessionRecord(overrides = {}) {
  return {
    address: "0x1111111111111111111111111111111111111111",
    sessionExpiresAt: "2026-07-19T06:00:00.000Z",
    sessionToken: "test-session",
    ...overrides,
  };
}

function automationTaskRecord(overrides = {}) {
  return {
    consecutiveFailures: 0,
    createdAt: "2026-07-19T05:00:00.000Z",
    displayStatus: "Active",
    failureThreshold: 3,
    id: "task-1",
    maxRetries: 3,
    metadata: {},
    name: "Daily Celo review",
    project: "Langclaw",
    scheduleFrequency: "daily",
    scheduleTime: "09:00",
    status: "active",
    timezone: "Asia/Jakarta",
    triggerLabel: "Daily at 09:00",
    triggerType: "schedule",
    updatedAt: "2026-07-19T05:00:00.000Z",
    ...overrides,
  };
}

function automationRunRecord(overrides = {}) {
  return {
    attempt: 1,
    createdAt: "2026-07-19T05:00:00.000Z",
    id: "run-1",
    status: "completed",
    taskId: "task-1",
    taskName: "Daily Celo review",
    triggeredBy: "manual",
    ...overrides,
  };
}

function automationNotificationRecord(overrides = {}) {
  return {
    body: "Daily Celo review completed.",
    createdAt: "2026-07-19T05:00:00.000Z",
    id: "notification-1",
    metadata: {},
    status: "unread",
    title: "Automation completed",
    ...overrides,
  };
}

function automationSettingsRecord(overrides = {}) {
  return {
    autoPauseRepeatedFailures: true,
    dailyLimit0G: "1",
    failureNotification: "in-app",
    limitBehavior: "pause",
    lowBalanceThreshold0G: "0.1",
    monthlyCap0G: "10",
    notificationChannels: ["in-app"],
    notificationEmailVerified: false,
    retryPolicy: "3-attempts",
    telegramVerified: false,
    thresholdAction: "notify",
    writeRunLogsToMemory: true,
    ...overrides,
  };
}

function automationDashboardRecord(overrides = {}) {
  return {
    configured: true,
    notifications: [automationNotificationRecord()],
    recentRuns: [automationRunRecord()],
    settings: automationSettingsRecord(),
    stats: {
      activeTasks: 1,
      completedThisWeek: 1,
      eventTasks: 0,
      pendingRuns: 0,
      runningNow: 0,
      scheduledTasks: 1,
      successRate: 100,
    },
    tasks: [automationTaskRecord()],
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

function watchlistRecord(overrides = {}) {
  return {
    addedAt: "2026-07-19T05:00:00.000Z",
    caveat: "Market conditions can change.",
    chain: "celo",
    gapCount: 0,
    id: "watch-1",
    intent: "research",
    recommendation: "Review the supporting sources.",
    signalType: "smart-money",
    sourceCount: 3,
    subject: "CELO",
    summary: "Verified on-chain activity increased.",
    title: "CELO activity",
    ...overrides,
  };
}

function strategyBacktestRecord(overrides = {}) {
  const pairAddress = "0xeAfc4D6d4c3391Cd4Fc10c85D2f5f972d58C0dD5";

  return {
    bars: [
      {
        liquidityUsd: 100_000,
        pairAddress,
        priceUsd: 1.02,
        timestamp: "2026-07-19T05:00:00.000Z",
        volumeUsd: 25_000,
      },
    ],
    chain: "celo",
    chainId: 42220,
    chainName: "Celo",
    equityCurve: [
      { equityUsd: 10_000, timestamp: "2026-07-19T05:00:00.000Z" },
    ],
    generatedAt: "2026-07-19T05:01:00.000Z",
    latestSignal: {
      action: "hold",
      confidence: 65,
      liquidityUsd: 100_000,
      momentumBps: 20,
      priceUsd: 1.02,
      rationale: "Momentum remains below the entry threshold.",
      volumeUsd: 25_000,
    },
    market: `celo:${pairAddress}`,
    metrics: {
      finalEquityUsd: 10_000,
      initialCapitalUsd: 10_000,
      maxDrawdownBps: 0,
      totalPnlBps: 0,
      totalPnlUsd: 0,
      tradeCount: 0,
      winRate: 0,
    },
    pairAddress,
    params: {
      initialCapitalUsd: 10_000,
      maxHoldHours: 24,
      minLiquidityUsd: 50_000,
      minMomentumBps: 50,
      minVolumeMultiple: 1.1,
      stopLossBps: 500,
      takeProfitBps: 1_000,
    },
    queryId: "123",
    runId: "bt-test",
    sourceUrl: "https://api.dune.com/api/v1/query/123/results",
    strategyId: "celo-liquidity-momentum-v1",
    title: "Celo Liquidity Momentum Strategy",
    trades: [],
    ...overrides,
  };
}

function strategyScanRecord(overrides = {}) {
  const bestBacktest = strategyBacktestRecord();

  return {
    bestBacktest,
    candidates: [
      {
        latestSignal: bestBacktest.latestSignal,
        latestTimestamp: "2026-07-19T05:00:00.000Z",
        market: bestBacktest.market,
        metrics: bestBacktest.metrics,
        pairAddress: bestBacktest.pairAddress,
        rank: 1,
        rowCount: 12,
        score: 150,
        scoreReason: "0 trades / +0 bps PnL / HOLD latest signal",
        totalVolumeUsd: 300_000,
      },
    ],
    chain: "celo",
    chainId: 42220,
    chainName: "Celo",
    generatedAt: "2026-07-19T05:01:00.000Z",
    queryId: "123",
    scannedPairs: 1,
    selectedPairAddress: bestBacktest.pairAddress,
    sourceUrl: "https://api.dune.com/api/v1/query/123/results",
    ...overrides,
  };
}

function strategyPaperTradeRecord(overrides = {}) {
  const pairAddress = "0xeAfc4D6d4c3391Cd4Fc10c85D2f5f972d58C0dD5";

  return {
    action: "hold",
    chain: "celo",
    chainId: 42220,
    chainName: "Celo",
    confidence: 65,
    generatedAt: "2026-07-19T05:02:00.000Z",
    market: `celo:${pairAddress}`,
    notionalUsd: 1_000,
    pairAddress,
    proof: {
      action: "hold",
      agentId: "133",
      chain: "celo",
      chainId: 42220,
      chainName: "Celo",
      decisionHash: `0x${"1".repeat(64)}`,
      evidenceUri: "langclaw://strategy/paper-test",
      pnlBps: 0,
      resultHash: `0x${"2".repeat(64)}`,
      status: "prepared",
      strategyStatus: "paper-opened",
    },
    rationale: "Momentum remains below the entry threshold.",
    referenceBacktestRunId: "bt-test",
    runId: "paper-test",
    strategyId: "celo-liquidity-momentum-v1",
    ...overrides,
  };
}

function strategyRunsRecord(overrides = {}) {
  const pairAddress = "0xeAfc4D6d4c3391Cd4Fc10c85D2f5f972d58C0dD5";

  return {
    chain: "celo",
    chainId: 42220,
    chainName: "Celo",
    configured: true,
    journalAddress: "0x1111111111111111111111111111111111111111",
    nextRecordId: "1",
    records: [
      {
        action: "hold",
        agentId: "133",
        chain: "celo",
        chainId: 42220,
        chainName: "Celo",
        createdAt: "2026-07-19T05:02:00.000Z",
        decisionHash: `0x${"1".repeat(64)}`,
        evidenceUri: "langclaw://strategy/paper-test",
        market: `celo:${pairAddress}`,
        pnlBps: 0,
        recordId: "0",
        recorder: "0x2222222222222222222222222222222222222222",
        resultHash: `0x${"2".repeat(64)}`,
        runId: "paper-test",
        status: "paper-opened",
        strategyId: "celo-liquidity-momentum-v1",
      },
    ],
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

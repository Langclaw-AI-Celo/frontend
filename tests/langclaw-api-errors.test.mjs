import assert from "node:assert/strict";
import test from "node:test";

import {
  checkBackendHealth,
  clearAlphaWatchlist,
  createApiKey,
  createAutomationTask,
  createAutomationTelegramLink,
  createWalletSession,
  deleteChatSession,
  deleteAutomationTask,
  deleteAlphaWatchlistItem,
  deleteMemoryRecord,
  deleteManyMemoryRecords,
  getAutomationDashboard,
  getAutomationSettings,
  getChatSession,
  getMemoryDashboard,
  getMemorySettings,
  getUsageBalance,
  getUsageQuote,
  getUsageVaultInfo,
  LangclawApiError,
  listApiKeys,
  listAlphaWatchlist,
  listAutomationRuns,
  listInAppAutomationNotifications,
  listProofDecisions,
  listChatSessions,
  listStrategyRuns,
  openStrategyPaperTrade,
  pollAutomationTelegramLink,
  readFriendlyError,
  requestWalletChallenge,
  requestAutomationEmailLink,
  requestUsageWithdraw,
  revokeApiKey,
  runAutomationTask,
  runStrategyBacktest,
  scanStrategyPairs,
  setAllAutomationTasksStatus,
  setAutomationTaskStatus,
  setMemoryStatus,
  markAllAutomationNotificationsRead,
  markAutomationNotificationRead,
  streamChat,
  streamDiscover,
  unlinkAutomationEmail,
  unlinkAutomationTelegram,
  updateAutomationTask,
  updateAutomationSettings,
  upsertAlphaWatchlistItem,
  verifyAutomationEmailLink,
  verifyUsageDeposit,
} from "../lib/langclaw-api.ts";

test("chat session deletion rejects malformed mutation flags", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, deleted: "false" });

  await assert.rejects(
    deleteChatSession(walletSessionRecord(), "session-1"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid chat session data." &&
      error.status === 500,
  );
});

test("chat session responses reject malformed configured flags", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: "true", sessions: [] });

  await assert.rejects(
    listChatSessions(walletSessionRecord()),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid chat session data." &&
      error.status === 500,
  );
});

test("API key responses reject malformed configured flags", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: 1, keys: [] });

  await assert.rejects(
    listApiKeys(walletSessionRecord()),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid API key data." &&
      error.status === 500,
  );
});

test("memory deletion rejects malformed mutation flags", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, deleted: "false" });

  await assert.rejects(
    deleteMemoryRecord(walletSessionRecord(), "memory-1"),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid memory data." &&
      error.status === 500,
  );
});

test("memory responses reject malformed configured flags", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const [request, payload] of [
    [
      () => getMemoryDashboard(wallet),
      {
        configured: "true",
        memories: [],
        settings: memorySettings(),
      },
    ],
    [
      () => getMemorySettings(wallet),
      { configured: 1, settings: memorySettings() },
    ],
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid memory data." &&
        error.status === 500,
    );
  }
});

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

test("JSON responses enforce declared and streamed size limits", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const oversizedResponses = [
    () =>
      new Response('{"ok":true,"service":"langclaw"}', {
        headers: {
          "Content-Length": String(5 * 1024 * 1024 + 1),
          "Content-Type": "application/json",
        },
      }),
    () =>
      Response.json({
        ok: true,
        service: "x".repeat(5 * 1024 * 1024),
      }),
  ];

  for (const response of oversizedResponses) {
    globalThis.fetch = async () => response();

    await assert.rejects(
      checkBackendHealth(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend JSON response exceeded the size limit." &&
        error.status === 200,
    );
  }
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

test("wallet challenge responses reject expired challenges", async (t) => {
  const originalFetch = globalThis.fetch;
  const challenge = walletChallengeRecord({
    expiresAt: "2026-07-19T05:05:00.000Z",
    issuedAt: "2026-07-19T05:00:00.000Z",
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ challenge, configured: true });

  await assert.rejects(
    requestWalletChallenge({
      address: challenge.address,
      chainId: challenge.chainId,
      purpose: challenge.purpose,
    }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid wallet challenge data." &&
      error.status === 500,
  );
});

test("wallet challenge responses reject far-future issuance", async (t) => {
  const originalFetch = globalThis.fetch;
  const now = Date.now();
  const challenge = walletChallengeRecord({
    expiresAt: new Date(now + 65 * 60 * 1000).toISOString(),
    issuedAt: new Date(now + 60 * 60 * 1000).toISOString(),
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ challenge, configured: true });

  await assert.rejects(
    requestWalletChallenge({
      address: challenge.address,
      chainId: challenge.chainId,
      purpose: challenge.purpose,
    }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid wallet challenge data." &&
      error.status === 500,
  );
});

test("wallet challenges must match the requested account and purpose", async (t) => {
  const originalFetch = globalThis.fetch;
  const challenge = walletChallengeRecord();
  const request = {
    address: challenge.address,
    chainId: challenge.chainId,
    purpose: challenge.purpose,
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const mismatchedChallenge of [
    { ...challenge, address: "0x2222222222222222222222222222222222222222" },
    { ...challenge, chainId: 5000 },
    { ...challenge, purpose: "api-key:create" },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ challenge: mismatchedChallenge, configured: true });

    await assert.rejects(
      requestWalletChallenge(request),
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

test("wallet session responses reject expired credentials", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    signature: "0xsigned",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      wallet: walletSessionRecord({
        sessionExpiresAt: "2026-07-19T06:00:00.000Z",
      }),
    });

  await assert.rejects(
    createWalletSession(wallet),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid wallet session data." &&
      error.status === 500,
  );
});

test("wallet sessions must match the authenticated account", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    message: "Sign in",
    signature: "0xsigned",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      wallet: walletSessionRecord({
        address: "0x2222222222222222222222222222222222222222",
      }),
    });

  await assert.rejects(
    createWalletSession(wallet),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid wallet session data." &&
      error.status === 500,
  );
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

test("automation tasks require metadata for their trigger type", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const task of [
    automationTaskRecord({ eventName: undefined, triggerType: "event" }),
    automationTaskRecord({ triggerType: "webhook", webhookSlug: undefined }),
  ]) {
    globalThis.fetch = async () =>
      Response.json(automationDashboardRecord({ tasks: [task] }));

    await assert.rejects(
      getAutomationDashboard(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data." &&
        error.status === 500,
    );
  }
});

test("scheduled automation tasks require a frequency", async (t) => {
  const originalFetch = globalThis.fetch;
  const task = automationTaskRecord({ scheduleFrequency: undefined });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json(automationDashboardRecord({ tasks: [task] }));

  await assert.rejects(
    getAutomationDashboard(walletSessionRecord()),
    isInvalidAutomationError,
  );
});

test("automation tasks reject malformed schedule times", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const scheduleTime of ["9:00", "24:00", "12:60"]) {
    globalThis.fetch = async () =>
      Response.json(
        automationDashboardRecord({
          tasks: [automationTaskRecord({ scheduleTime })],
        }),
      );

    await assert.rejects(
      getAutomationDashboard(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation tasks reject reversed timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  const task = automationTaskRecord({
    createdAt: "2026-07-19T05:01:00.000Z",
    updatedAt: "2026-07-19T05:00:00.000Z",
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json(automationDashboardRecord({ tasks: [task] }));

  await assert.rejects(
    getAutomationDashboard(walletSessionRecord()),
    isInvalidAutomationError,
  );
});

test("automation tasks reject display statuses that contradict task state", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const task of [
    automationTaskRecord({ displayStatus: "Paused", status: "active" }),
    automationTaskRecord({ displayStatus: "Active", status: "draft" }),
    automationTaskRecord({ displayStatus: "Running", status: "paused" }),
    automationTaskRecord({ displayStatus: "Active", status: "archived" }),
  ]) {
    globalThis.fetch = async () =>
      Response.json(automationDashboardRecord({ tasks: [task] }));

    await assert.rejects(
      getAutomationDashboard(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation tasks reject next runs before task creation", async (t) => {
  const originalFetch = globalThis.fetch;
  const task = automationTaskRecord({
    nextRunAt: "2026-07-19T04:59:00.000Z",
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json(automationDashboardRecord({ tasks: [task] }));

  await assert.rejects(
    getAutomationDashboard(walletSessionRecord()),
    isInvalidAutomationError,
  );
});

test("automation tasks require consistent last-run state", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const task of [
    automationTaskRecord({ lastRunAt: "2026-07-19T05:01:00.000Z" }),
    automationTaskRecord({ lastRunStatus: "completed" }),
    automationTaskRecord({
      lastRunAt: "2026-07-19T04:59:00.000Z",
      lastRunStatus: "completed",
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json(automationDashboardRecord({ tasks: [task] }));

    await assert.rejects(
      getAutomationDashboard(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
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

test("automation runs require timestamps that match their lifecycle", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const run of [
    automationRunRecord({
      completedAt: undefined,
      durationMs: 1000,
      startedAt: "2026-07-19T05:00:01.000Z",
    }),
    automationRunRecord({
      completedAt: undefined,
      durationMs: undefined,
      startedAt: undefined,
      status: "running",
    }),
    automationRunRecord({
      completedAt: "2026-07-19T05:00:02.000Z",
      durationMs: 1000,
      startedAt: "2026-07-19T05:00:01.000Z",
      status: "running",
    }),
    automationRunRecord({
      completedAt: undefined,
      durationMs: undefined,
      startedAt: "2026-07-19T05:00:01.000Z",
      status: "queued",
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, runs: [run] });

    await assert.rejects(
      listAutomationRuns(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation runs reject durations that contradict timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  const run = automationRunRecord({ durationMs: 5_000 });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, runs: [run] });

  await assert.rejects(
    listAutomationRuns(walletSessionRecord()),
    isInvalidAutomationError,
  );
});

test("automation run responses reject reversed timestamps", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const run of [
    automationRunRecord({
      createdAt: "2026-07-19T05:01:00.000Z",
      startedAt: "2026-07-19T05:00:00.000Z",
    }),
    automationRunRecord({
      completedAt: "2026-07-19T05:01:00.000Z",
      createdAt: "2026-07-19T05:00:00.000Z",
      startedAt: "2026-07-19T05:02:00.000Z",
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, runs: [run] });

    await assert.rejects(
      listAutomationRuns(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data." &&
        error.status === 500,
    );
  }
});

test("automation settings endpoints reject malformed configuration data", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();
  const invalidSettings = automationSettingsRecord({ retryPolicy: "forever" });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const request of [
    () => getAutomationSettings(wallet),
    () => updateAutomationSettings(wallet, { retryPolicy: "3-attempts" }),
    () => verifyAutomationEmailLink(wallet, "123456"),
    () => unlinkAutomationEmail(wallet),
    () => unlinkAutomationTelegram(wallet),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, settings: invalidSettings });

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid automation data." &&
        error.status === 500,
    );
  }
});

test("verified automation channels require linked destinations", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const settings of [
    automationSettingsRecord({
      notificationChannels: ["email", "in-app"],
      notificationEmailVerified: true,
    }),
    automationSettingsRecord({
      notificationChannels: ["telegram", "in-app"],
      telegramVerified: true,
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, settings });

    await assert.rejects(
      getAutomationSettings(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation settings reject duplicate notification channels", async (t) => {
  const originalFetch = globalThis.fetch;
  const settings = automationSettingsRecord({
    notificationChannels: ["in-app", "in-app"],
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, settings });

  await assert.rejects(
    getAutomationSettings(walletSessionRecord()),
    isInvalidAutomationError,
  );
});

test("automation settings reject malformed 0G limits", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const settings of [
    automationSettingsRecord({ dailyLimit0G: "-1" }),
    automationSettingsRecord({ monthlyCap0G: "1e3" }),
    automationSettingsRecord({
      lowBalanceThreshold0G: "0.1234567890123456789",
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, settings });

    await assert.rejects(
      getAutomationSettings(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation stats require complete next-run details", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const nextRun of [
    { nextRunAt: "2026-07-20T05:00:00.000Z" },
    { nextRunTaskName: "Daily Celo review" },
  ]) {
    const dashboard = automationDashboardRecord();
    dashboard.stats = { ...dashboard.stats, ...nextRun };
    globalThis.fetch = async () => Response.json(dashboard);

    await assert.rejects(
      getAutomationDashboard(walletSessionRecord()),
      isInvalidAutomationError,
    );
  }
});

test("automation notification endpoints reject malformed delivery data", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, notifications: "invalid" });
  await assert.rejects(
    listInAppAutomationNotifications(wallet),
    isInvalidAutomationError,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, notification: { id: "notification-1" } });
  await assert.rejects(
    markAutomationNotificationRead(wallet, "notification-1"),
    isInvalidAutomationError,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, read: "true" });
  await assert.rejects(
    markAllAutomationNotificationsRead(wallet),
    isInvalidAutomationError,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, link: { email: "test@example.com", expiresAt: "invalid", sent: true } });
  await assert.rejects(
    requestAutomationEmailLink(wallet, "test@example.com"),
    isInvalidAutomationError,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, link: { botUsername: "langclaw_bot" } });
  await assert.rejects(
    createAutomationTelegramLink(wallet),
    isInvalidAutomationError,
  );

  globalThis.fetch = async () =>
    Response.json({ configured: true, linked: "false", status: "pending" });
  await assert.rejects(
    pollAutomationTelegramLink(wallet),
    isInvalidAutomationError,
  );
});

test("automation email links reject expired responses", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      link: {
        email: "te***@example.com",
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
        sent: true,
      },
    });

  await assert.rejects(
    requestAutomationEmailLink(wallet, "test@example.com"),
    isInvalidAutomationError,
  );
});

test("automation Telegram links reject expired responses", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      link: {
        botUsername: "langclaw_bot",
        code: "ABC123",
        command: "/link ABC123",
        deepLink: "https://t.me/langclaw_bot?start=ABC123",
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    });

  await assert.rejects(
    createAutomationTelegramLink(wallet),
    isInvalidAutomationError,
  );
});

test("automation Telegram links bind commands and deep links to their code", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();
  const link = {
    botUsername: "langclaw_bot",
    code: "ABC123",
    command: "/link ABC123",
    deepLink: "https://t.me/langclaw_bot?start=ABC123",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const malformedLink of [
    { ...link, command: "/link DIFFERENT" },
    { ...link, deepLink: "https://example.com/?start=ABC123" },
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, link: malformedLink });

    await assert.rejects(
      createAutomationTelegramLink(wallet),
      isInvalidAutomationError,
    );
  }
});

test("automation Telegram polling requires a consistent link state", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { configured: true, linked: true, status: "linked" },
    {
      configured: true,
      linked: false,
      settings: automationSettingsRecord(),
      status: "pending",
    },
    { configured: true, linked: false, status: "linked" },
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      pollAutomationTelegramLink(wallet),
      isInvalidAutomationError,
    );
  }
});

test("automation notifications reject inconsistent read state", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const notification of [
    automationNotificationRecord({
      readAt: "2026-07-19T05:01:00.000Z",
      status: "unread",
    }),
    automationNotificationRecord({ status: "read" }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, notifications: [notification] });

    await assert.rejects(
      listInAppAutomationNotifications(wallet),
      isInvalidAutomationError,
    );
  }
});

test("automation notifications reject reads before creation", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      notifications: [
        automationNotificationRecord({
          readAt: "2026-07-19T04:59:00.000Z",
          status: "read",
        }),
      ],
    });

  await assert.rejects(
    listInAppAutomationNotifications(wallet),
    isInvalidAutomationError,
  );
});

test("usage endpoints reject malformed balance and transaction data", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const cases = [
    [() => getUsageBalance(wallet, "celo"), { configured: true, wallet: wallet.address, balance: "invalid" }],
    [() => getUsageQuote("celo"), { configured: true, quote: { estimatedPromptTokens: "6000" } }],
    [() => getUsageVaultInfo("celo"), { configured: true, vaultAddress: "invalid" }],
    [
      () => verifyUsageDeposit({ chain: "celo", txHash: `0x${"1".repeat(64)}`, wallet }),
      { configured: true, credited: "true", wallet: wallet.address },
    ],
    [() => requestUsageWithdraw(wallet, "celo"), { configured: true, functionName: "transfer" }],
  ];

  for (const [request, payload] of cases) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid usage data." &&
        error.status === 500,
    );
  }
});

test("usage balances reject malformed monetary values", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const balance of [
    usageBalanceRecord({ availableNeuron: "-1" }),
    usageBalanceRecord({ reservedNeuron: "1.5" }),
    usageBalanceRecord({ lifetimeDeposited0G: "1e3" }),
    usageBalanceRecord({ availableNative: "-0.1" }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, wallet: wallet.address, balance });

    await assert.rejects(
      getUsageBalance(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid usage data." &&
        error.status === 500,
    );
  }
});

test("proof decision responses reject malformed chain records", async (t) => {
  const originalFetch = globalThis.fetch;
  const valid = proofDecisionsRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    { ...valid, chainId: "42220" },
    { ...valid, decisions: "invalid" },
    { ...valid, decisions: [{ ...valid.decisions[0], decisionHash: "0x1234" }] },
    { ...valid, registryAddress: "invalid" },
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      listProofDecisions(20, "celo"),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid proof decision data." &&
        error.status === 500,
    );
  }
});

function isInvalidAutomationError(error) {
  return (
    error instanceof LangclawApiError &&
    error.message === "Backend returned invalid automation data." &&
    error.status === 500
  );
}

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

test("chat session responses reject reversed timestamps", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      sessions: [
        chatSessionRecord({
          createdAt: "2026-07-19T05:02:00.000Z",
          updatedAt: "2026-07-19T05:01:00.000Z",
        }),
      ],
    });

  await assert.rejects(
    listChatSessions(walletSessionRecord()),
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

test("API key responses reject unsupported statuses", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      keys: [apiKeyRecord({ status: "suspended" })],
    });

  await assert.rejects(
    listApiKeys(walletSessionRecord()),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid API key data." &&
      error.status === 500,
  );
});

test("API key responses reject inconsistent revocation state", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const key of [
    apiKeyRecord({
      revokedAt: "2026-07-19T05:01:00.000Z",
      status: "active",
    }),
    apiKeyRecord({ status: "revoked" }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, keys: [key] });

    await assert.rejects(
      listApiKeys(walletSessionRecord()),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid API key data." &&
        error.status === 500,
    );
  }
});

test("API key responses reject timestamps before creation", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const key of [
    apiKeyRecord({ lastUsedAt: "2026-07-19T04:59:00.000Z" }),
    apiKeyRecord({
      revokedAt: "2026-07-19T04:59:00.000Z",
      status: "revoked",
    }),
  ]) {
    globalThis.fetch = async () =>
      Response.json({ configured: true, keys: [key] });

    await assert.rejects(
      listApiKeys(walletSessionRecord()),
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

test("memory responses reject inconsistent statistics", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = {
    address: "0x1111111111111111111111111111111111111111",
    sessionToken: "test-session",
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const stats of [
    { active: 1, disabled: 0, projectScoped: 0, total: 0 },
    { active: 0, disabled: 0, projectScoped: 1, total: 0 },
  ]) {
    globalThis.fetch = async () =>
      Response.json({
        configured: true,
        memories: [],
        settings: memorySettings(),
        stats,
      });

    await assert.rejects(
      getMemoryDashboard(wallet),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid memory data." &&
        error.status === 500,
    );
  }
});

test("memory responses reject last-used dates after their update", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      configured: true,
      memories: [
        memoryRecord({ lastUsed: "2026-07-20", updatedAt: "2026-07-19" }),
      ],
      settings: memorySettings(),
    });

  await assert.rejects(
    getMemoryDashboard(walletSessionRecord()),
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

test("watchlist responses validate optional proof identities", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const overrides of [
    { agentId: "agent-133" },
    { decisionId: "-1" },
    { decisionHash: "0x1234" },
    { proofTx: `0x${"g".repeat(64)}` },
  ]) {
    globalThis.fetch = async () =>
      Response.json({
        configured: true,
        items: [watchlistRecord(overrides)],
      });

    await assert.rejects(
      listAlphaWatchlist(walletSessionRecord()),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === "Backend returned invalid watchlist data." &&
        error.status === 500,
    );
  }
});

test("watchlist responses require configured envelopes", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = walletSessionRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const [request, payload] of [
    [() => listAlphaWatchlist(wallet), { configured: false, items: [] }],
    [
      () => upsertAlphaWatchlistItem(wallet, watchlistRecord()),
      { configured: "true", item: watchlistRecord() },
    ],
    [
      () => deleteAlphaWatchlistItem(wallet, "watch-1"),
      { configured: 1, deleted: true },
    ],
    [() => clearAlphaWatchlist(wallet), { cleared: true }],
  ]) {
    globalThis.fetch = async () => Response.json(payload);

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

test("strategy backtests reject trades that exit before entry", async (t) => {
  const originalFetch = globalThis.fetch;
  const backtest = strategyBacktestRecord({
    trades: [
      {
        entryAt: "2026-07-19T05:02:00.000Z",
        entryPriceUsd: 1,
        exitAt: "2026-07-19T05:01:00.000Z",
        exitPriceUsd: 1.1,
        holdHours: 0,
        pnlBps: 1000,
        pnlUsd: 100,
        reason: "Take profit",
      },
    ],
  });

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({ configured: true, backtest });

  await assert.rejects(
    runStrategyBacktest({ chain: "celo", queryId: "123" }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned invalid strategy backtest data." &&
      error.status === 500,
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

test("strategy responses reject malformed EVM addresses", async (t) => {
  const originalFetch = globalThis.fetch;
  const backtest = strategyBacktestRecord();
  const scan = strategyScanRecord();
  const paperTrade = strategyPaperTradeRecord();
  const runs = strategyRunsRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const [request, responseBody, message] of [
    [
      () => runStrategyBacktest({ chain: "celo", queryId: "123" }),
      { configured: true, backtest: { ...backtest, pairAddress: "invalid" } },
      "Backend returned invalid strategy backtest data.",
    ],
    [
      () => runStrategyBacktest({ chain: "celo", queryId: "123" }),
      {
        configured: true,
        backtest: {
          ...backtest,
          bars: [{ ...backtest.bars[0], pairAddress: "invalid" }],
        },
      },
      "Backend returned invalid strategy backtest data.",
    ],
    [
      () => scanStrategyPairs({ chain: "celo", queryId: "123" }),
      { configured: true, scan: { ...scan, selectedPairAddress: "invalid" } },
      "Backend returned invalid strategy scan data.",
    ],
    [
      () => scanStrategyPairs({ chain: "celo", queryId: "123" }),
      {
        configured: true,
        scan: {
          ...scan,
          candidates: [{ ...scan.candidates[0], pairAddress: "invalid" }],
        },
      },
      "Backend returned invalid strategy scan data.",
    ],
    [
      () => openStrategyPaperTrade({ backtest, chain: "celo" }),
      { configured: true, paperTrade: { ...paperTrade, pairAddress: "invalid" } },
      "Backend returned invalid strategy paper trade data.",
    ],
    [
      () => listStrategyRuns(25, "celo"),
      { ...runs, journalAddress: "invalid" },
      "Backend returned invalid strategy run data.",
    ],
    [
      () => listStrategyRuns(25, "celo"),
      {
        ...runs,
        records: [{ ...runs.records[0], recorder: "invalid" }],
      },
      "Backend returned invalid strategy run data.",
    ],
  ]) {
    globalThis.fetch = async () => Response.json(responseBody);

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === message &&
        error.status === 500,
    );
  }
});

test("strategy mutations require configured response envelopes", async (t) => {
  const originalFetch = globalThis.fetch;
  const backtest = strategyBacktestRecord();

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const [request, payload, message] of [
    [
      () => runStrategyBacktest({ chain: "celo", queryId: "123" }),
      { backtest, configured: false },
      "Backend returned invalid strategy backtest data.",
    ],
    [
      () => scanStrategyPairs({ chain: "celo", queryId: "123" }),
      { configured: "true", scan: strategyScanRecord() },
      "Backend returned invalid strategy scan data.",
    ],
    [
      () => openStrategyPaperTrade({ backtest, chain: "celo" }),
      { paperTrade: strategyPaperTradeRecord() },
      "Backend returned invalid strategy paper trade data.",
    ],
  ]) {
    globalThis.fetch = async () => Response.json(payload);

    await assert.rejects(
      request(),
      (error) =>
        error instanceof LangclawApiError &&
        error.message === message &&
        error.status === 500,
    );
  }
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

test("streaming responses reject incomplete UTF-8 tails", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([0xe2]));
          controller.close();
        },
      }),
      {
        headers: { "Content-Type": "application/x-ndjson" },
        status: 200,
      },
    );

  await assert.rejects(
    streamDiscover({ topic: "CELO" }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned an invalid streaming response." &&
      error.status === 200,
  );
});

test("streaming responses reject oversized NDJSON chunks", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response("x".repeat(1_048_577), {
      headers: { "Content-Type": "application/x-ndjson" },
      status: 200,
    });

  await assert.rejects(
    streamDiscover({ topic: "CELO" }),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend streaming response exceeded the size limit." &&
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

test("chat streams validate direct response payloads", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  for (const payload of [
    {},
    { answer: 42 },
    { answer: "Ready", source: "proxy" },
    { answer: "Ready", modelHonored: "true" },
    { answer: "Ready", teeVerified: "true" },
    { answer: "Ready", usage: [] },
  ]) {
    globalThis.fetch = async () =>
      new Response(`${JSON.stringify({ type: "direct", payload })}\n`, {
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
    '{"type":"mode","mode":"admin"}\n',
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
  const now = Date.now();

  return {
    address: "0x1111111111111111111111111111111111111111",
    chainId: 42220,
    domain: "langclawcelo.vercel.app",
    expiresAt: new Date(now + 4 * 60 * 1000).toISOString(),
    issuedAt: new Date(now - 60 * 1000).toISOString(),
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
    sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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
    completedAt: "2026-07-19T05:00:02.000Z",
    createdAt: "2026-07-19T05:00:00.000Z",
    durationMs: 1000,
    id: "run-1",
    startedAt: "2026-07-19T05:00:01.000Z",
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

function usageBalanceRecord(overrides = {}) {
  return {
    available0G: "1",
    availableNative: "0.5",
    availableNeuron: "1000000000",
    lifetimeCharged0G: "0.1",
    lifetimeChargedNative: "0.05",
    lifetimeChargedNeuron: "100000000",
    lifetimeDeposited0G: "2",
    lifetimeDepositedNative: "1",
    lifetimeDepositedNeuron: "2000000000",
    reserved0G: "0.25",
    reservedNative: "0.125",
    reservedNeuron: "250000000",
    ...overrides,
  };
}

function proofDecisionsRecord(overrides = {}) {
  return {
    chain: "celo",
    chainId: 42220,
    chainName: "Celo",
    configured: true,
    decisions: [
      {
        agentId: "133",
        createdAt: "2026-07-19T05:00:00.000Z",
        decisionHash: `0x${"1".repeat(64)}`,
        decisionId: "0",
        evidenceUri: "langclaw://proof/decision-0",
        recorder: "0x2222222222222222222222222222222222222222",
        runId: "run-1",
        signalType: "celo-alpha",
      },
    ],
    nativeSymbol: "CELO",
    nextDecisionId: "1",
    registryAddress: "0x1111111111111111111111111111111111111111",
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

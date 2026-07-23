import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const sidebarPath = path.join(
  testDir,
  "..",
  "components",
  "app-sidebar.tsx",
);

function deferred() {
  let reject;
  let resolve;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    reject = rejectPromise;
    resolve = resolvePromise;
  });

  return { promise, reject, resolve };
}

async function loadCoordinator() {
  const latestRequest = await import("../lib/latest-request.ts");

  assert.equal(
    typeof latestRequest.createChatSessionsRequestCoordinator,
    "function",
    "chat sessions request coordinator must exist",
  );

  return latestRequest.createChatSessionsRequestCoordinator;
}

test("wallet A sidebar chats cannot publish under wallet B", async () => {
  const createChatSessionsRequestCoordinator = await loadCoordinator();
  const requests = createChatSessionsRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { sessions: [] };
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.sessions = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.sessions = value;
    },
  });

  walletB.resolve(["wallet B chat"]);
  walletA.resolve(["wallet A private chat"]);

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.sessions, ["wallet B chat"]);
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses stale sidebar chat mutations", async () => {
  const createChatSessionsRequestCoordinator = await loadCoordinator();
  const requests = createChatSessionsRequestCoordinator("wallet-a");
  const pending = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => pending.promise,
    {
      onError: () => effects.push("toast:error"),
      onSettled: () => effects.push("settled"),
      onSuccess: () =>
        effects.push("sessions:update", "dialog:close", "toast:success"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve("renamed");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("sidebar mutations require chats loaded for the current wallet", async () => {
  const createChatSessionsRequestCoordinator = await loadCoordinator();
  const requests = createChatSessionsRequestCoordinator("wallet-a");
  let mutationCalls = 0;

  requests.setContext("wallet-b");
  const result = await requests.runMutation(
    "wallet-b",
    "wallet-a",
    async () => {
      mutationCalls += 1;
      return "deleted";
    },
    {
      onError: () => undefined,
      onSuccess: () => undefined,
    },
  );

  assert.equal(result, false);
  assert.equal(mutationCalls, 0);
});

test("same-wallet sidebar mutations remain independent", async () => {
  const createChatSessionsRequestCoordinator = await loadCoordinator();
  const requests = createChatSessionsRequestCoordinator("wallet-a");
  const first = deferred();
  const second = deferred();
  const effects = [];
  const firstRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => first.promise,
    {
      onError: (error) => effects.push(error),
      onSuccess: (value) => effects.push(value),
    },
  );
  const secondRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => second.promise,
    {
      onError: (error) => effects.push(error),
      onSuccess: (value) => effects.push(value),
    },
  );

  second.resolve("deleted second");
  first.resolve("pinned first");

  assert.deepEqual(await Promise.all([firstRun, secondRun]), [true, true]);
  assert.deepEqual(effects, ["deleted second", "pinned first"]);
});

test("unmount invalidates every pending sidebar chat effect", async () => {
  const createChatSessionsRequestCoordinator = await loadCoordinator();
  const requests = createChatSessionsRequestCoordinator("wallet-a");
  const load = deferred();
  const mutation = deferred();
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: () => effects.push(`${label}:success`),
  });
  const runs = [
    requests.runLoad("wallet-a", () => load.promise, handlers("load")),
    requests.runMutation(
      "wallet-a",
      "wallet-a",
      () => mutation.promise,
      handlers("mutation"),
    ),
  ];

  requests.invalidateAll();
  load.resolve("sessions");
  mutation.resolve("renamed");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("AppSidebar binds chat requests, state, and dialogs to wallet identity", () => {
  const source = readFileSync(sidebarPath, "utf8");

  assert.match(source, /createChatSessionsRequestCoordinator\(walletContext\)/);
  assert.match(
    source,
    /chatSessionRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(source, /chatSessionRequestsRef\.current\.runLoad\(/);
  assert.match(source, /chatSessionRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /sessionsContextRef\.current/);
  assert.match(source, /sessionsContext === walletContext/);
  assert.match(source, /chatSessionRequests\.invalidateAll\(\)/);
  assert.match(source, /sessionStateIsCurrent \? renameTargetState : null/);
  assert.match(source, /sessionStateIsCurrent \? deleteTargetState : null/);
});

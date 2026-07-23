import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const taskPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "task",
  "page.tsx",
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
    typeof latestRequest.createAutomationRequestCoordinator,
    "function",
    "automation request coordinator must exist",
  );

  return latestRequest.createAutomationRequestCoordinator;
}

test("wallet A automation dashboard cannot publish under wallet B", async () => {
  const createAutomationRequestCoordinator = await loadCoordinator();
  const requests = createAutomationRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { dashboard: null };
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.dashboard = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.dashboard = value;
    },
  });

  walletB.resolve({ tasks: ["wallet B task"] });
  walletA.resolve({ tasks: ["wallet A private task"] });

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.dashboard, { tasks: ["wallet B task"] });
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses stale automation mutation effects", async () => {
  const createAutomationRequestCoordinator = await loadCoordinator();
  const requests = createAutomationRequestCoordinator("wallet-a");
  const pending = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => pending.promise,
    {
      onError: () => effects.push("error", "toast:error"),
      onSettled: () => effects.push("loading:clear"),
      onSuccess: () =>
        effects.push("form:reset", "toast:success", "dashboard:refresh"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve("created");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("automation mutations require the current wallet dashboard", async () => {
  const createAutomationRequestCoordinator = await loadCoordinator();
  const requests = createAutomationRequestCoordinator("wallet-a");
  let mutationCalls = 0;

  requests.setContext("wallet-b");
  const result = await requests.runMutation(
    "wallet-b",
    "wallet-a",
    async () => {
      mutationCalls += 1;
      return "paused";
    },
    {
      onError: () => undefined,
      onSuccess: () => undefined,
    },
  );

  assert.equal(result, false);
  assert.equal(mutationCalls, 0);
});

test("same-wallet automation mutations remain independent", async () => {
  const createAutomationRequestCoordinator = await loadCoordinator();
  const requests = createAutomationRequestCoordinator("wallet-a");
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

  second.resolve("ran second");
  first.resolve("paused first");

  assert.deepEqual(await Promise.all([firstRun, secondRun]), [true, true]);
  assert.deepEqual(effects, ["ran second", "paused first"]);
});

test("unmount invalidates every pending automation effect", async () => {
  const createAutomationRequestCoordinator = await loadCoordinator();
  const requests = createAutomationRequestCoordinator("wallet-a");
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
  load.resolve("dashboard");
  mutation.resolve("deleted");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("Task page binds requests and rendered state to wallet identity", () => {
  const source = readFileSync(taskPagePath, "utf8");

  assert.match(source, /createAutomationRequestCoordinator\(walletContext\)/);
  assert.match(
    source,
    /automationRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(source, /automationRequestsRef\.current\.runLoad\(/);
  assert.match(source, /automationRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /dashboardContextRef\.current/);
  assert.match(source, /dashboardContext === walletContext/);
  assert.match(source, /automationRequests\.invalidateAll\(\)/);
});

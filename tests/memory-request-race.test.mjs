import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const memoryPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "memory",
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

test("wallet A memory load cannot publish private data under wallet B", async () => {
  const { createMemoryRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createMemoryRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { memories: [] };
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.memories = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.memories = value;
    },
  });

  walletB.resolve(["wallet B memory"]);
  walletA.resolve(["wallet A private memory"]);

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.memories, ["wallet B memory"]);
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses stale memory mutation effects", async () => {
  const { createMemoryRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createMemoryRequestCoordinator("wallet-a");
  const pending = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => pending.promise,
    {
      onError: () => effects.push("error", "toast:error"),
      onSettled: () => effects.push("loading:clear"),
      onSuccess: () => effects.push("state:update", "toast:success"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve(["memory-a"]);

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("memory mutations cannot use rows loaded for another wallet", async () => {
  const { createMemoryRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createMemoryRequestCoordinator("wallet-a");
  const effects = [];
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
      onError: () => effects.push("error"),
      onSuccess: () => effects.push("success"),
    },
  );

  assert.equal(result, false);
  assert.equal(mutationCalls, 0);
  assert.deepEqual(effects, []);
});

test("same-wallet memory mutations remain independent", async () => {
  const { createMemoryRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createMemoryRequestCoordinator("wallet-a");
  const first = deferred();
  const second = deferred();
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSuccess: () => effects.push(`${label}:success`),
  });
  const firstRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => first.promise,
    handlers("first"),
  );
  const secondRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => second.promise,
    handlers("second"),
  );

  second.resolve("updated");
  first.resolve("deleted");

  assert.equal(await secondRun, true);
  assert.equal(await firstRun, true);
  assert.deepEqual(effects, ["second:success", "first:success"]);
});

test("unmount invalidates every pending memory effect", async () => {
  const { createMemoryRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createMemoryRequestCoordinator("wallet-a");
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
  mutation.resolve("updated");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("Memory page binds requests, state, and table selection to wallet identity", () => {
  const source = readFileSync(memoryPagePath, "utf8");

  assert.match(source, /createMemoryRequestCoordinator\(walletContext\)/);
  assert.match(source, /memoryRequestsRef\.current\.setContext\(walletContext\)/);
  assert.match(source, /memoryRequestsRef\.current\.runLoad\(/);
  assert.match(source, /memoryRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /memoryContextRef\.current/);
  assert.match(source, /memoryContext === walletContext/);
  assert.match(source, /memoryRequests\.invalidateAll\(\)/);
  assert.match(source, /key=\{walletContext \|\| "disconnected"\}/);
});

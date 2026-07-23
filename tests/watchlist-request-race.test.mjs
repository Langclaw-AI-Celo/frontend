import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const watchlistPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "watchlist",
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
    typeof latestRequest.createWatchlistRequestCoordinator,
    "function",
    "watchlist request coordinator must exist",
  );

  return latestRequest.createWatchlistRequestCoordinator;
}

test("wallet A watchlist load cannot publish under wallet B", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { items: [] };
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.items = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.items = value;
    },
  });

  walletB.resolve(["wallet B signal"]);
  walletA.resolve(["wallet A private signal"]);

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.items, ["wallet B signal"]);
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses stale watchlist mutation effects", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
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
  pending.resolve("removed");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("watchlist mutations cannot use items loaded for another wallet", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
  let mutationCalls = 0;

  requests.setContext("wallet-b");
  const result = await requests.runMutation(
    "wallet-b",
    "wallet-a",
    async () => {
      mutationCalls += 1;
      return "removed";
    },
    {
      onError: () => undefined,
      onSuccess: () => undefined,
    },
  );

  assert.equal(result, false);
  assert.equal(mutationCalls, 0);
});

test("same-wallet watchlist mutations remain independent", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
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

  second.resolve("removed second");
  first.resolve("removed first");

  assert.deepEqual(await Promise.all([firstRun, secondRun]), [true, true]);
  assert.deepEqual(effects, ["removed second", "removed first"]);
});

test("unmount invalidates every pending watchlist effect", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
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
  load.resolve("signals");
  mutation.resolve("removed");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("Watchlist page binds requests and rendered state to wallet identity", () => {
  const source = readFileSync(watchlistPagePath, "utf8");

  assert.match(source, /createWatchlistRequestCoordinator\(walletContext\)/);
  assert.match(
    source,
    /watchlistRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(source, /watchlistRequestsRef\.current\.runLoad\(/);
  assert.match(source, /watchlistRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /watchlistContextRef\.current/);
  assert.match(source, /watchlistContext === walletContext/);
  assert.match(source, /watchlistRequests\.invalidateAll\(\)/);
});

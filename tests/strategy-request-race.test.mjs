import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const strategyPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "strategy",
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

test("an old chain strategy result cannot overwrite the active chain", async () => {
  const { createStrategyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createStrategyRequestCoordinator("celo");
  const celo = deferred();
  const mantle = deferred();
  const state = { result: null };
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: (value) => {
      state.result = value;
      effects.push(`${label}:success`);
    },
  });
  const celoRun = requests.runAction(
    "celo",
    () => celo.promise,
    handlers("celo"),
  );

  requests.setContext("mantle");
  const mantleRun = requests.runAction(
    "mantle",
    () => mantle.promise,
    handlers("mantle"),
  );

  mantle.resolve("mantle result");
  assert.equal(await mantleRun, true);
  celo.resolve("celo result");
  assert.equal(await celoRun, false);
  assert.equal(state.result, "mantle result");
  assert.deepEqual(effects, ["mantle:success", "mantle:settled"]);
});

test("a stale strategy failure cannot publish an error or clear loading", async () => {
  const { createStrategyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createStrategyRequestCoordinator("celo");
  const celo = deferred();
  const effects = [];
  const run = requests.runAction("celo", () => celo.promise, {
    onError: () => effects.push("error"),
    onSettled: () => effects.push("loading:clear"),
    onSuccess: () => effects.push("success"),
  });

  requests.setContext("mantle");
  celo.reject(new Error("stale Celo failure"));

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("only the newest same-chain strategy action can publish", async () => {
  const { createStrategyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createStrategyRequestCoordinator("celo");
  const first = deferred();
  const second = deferred();
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: () => effects.push(`${label}:success`),
  });
  const firstRun = requests.runAction(
    "celo",
    () => first.promise,
    handlers("first"),
  );
  const secondRun = requests.runAction(
    "celo",
    () => second.promise,
    handlers("second"),
  );

  second.resolve("new");
  assert.equal(await secondRun, true);
  first.resolve("old");
  assert.equal(await firstRun, false);
  assert.deepEqual(effects, ["second:success", "second:settled"]);
});

test("Strategy Lab wires actions through the chain request coordinator", () => {
  const source = readFileSync(strategyPagePath, "utf8");

  assert.match(
    source,
    /createStrategyRequestCoordinator\(defaultProductChain\)/,
  );
  assert.match(
    source,
    /strategyRequestsRef\.current\.setContext\(nextChain\)/,
  );
  assert.match(source, /strategyRequestsRef\.current\.runAction\(/);
  assert.match(source, /strategyRequests\.invalidateAll\(\)/);
  assert.match(source, /setLoading\(""\)/);
});

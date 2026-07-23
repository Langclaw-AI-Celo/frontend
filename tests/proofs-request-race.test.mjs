import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const proofsPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "proofs",
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

test("an old chain response cannot overwrite the active Proof Center chain", async () => {
  const { createProofsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createProofsRequestCoordinator("celo");
  const celo = deferred();
  const mantle = deferred();
  const state = { payload: null };
  const effects = [];
  const handlers = {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.payload = value;
    },
  };
  const celoRun = requests.runLoad("celo", () => celo.promise, handlers);

  requests.setContext("mantle");
  const mantleRun = requests.runLoad(
    "mantle",
    () => mantle.promise,
    handlers,
  );

  mantle.resolve("mantle proofs");
  assert.equal(await mantleRun, true);
  celo.resolve("celo proofs");
  assert.equal(await celoRun, false);
  assert.equal(state.payload, "mantle proofs");
  assert.deepEqual(effects, []);
});

test("a stale Proof Center failure cannot publish an error or clear loading", async () => {
  const { createProofsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createProofsRequestCoordinator("celo");
  const celo = deferred();
  const effects = [];
  const run = requests.runLoad("celo", () => celo.promise, {
    onError: () => effects.push("error"),
    onSettled: () => effects.push("loading:clear"),
    onSuccess: () => effects.push("success"),
  });

  requests.setContext("mantle");
  celo.reject(new Error("stale Celo failure"));

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("a manual refresh keeps only the newest response for one chain", async () => {
  const { createProofsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createProofsRequestCoordinator("celo");
  const first = deferred();
  const second = deferred();
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: () => effects.push(`${label}:success`),
  });
  const firstRun = requests.runLoad(
    "celo",
    () => first.promise,
    handlers("first"),
  );
  const secondRun = requests.runLoad(
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

test("Proof Center wires chain loads through the request coordinator", () => {
  const source = readFileSync(proofsPagePath, "utf8");

  assert.match(
    source,
    /createProofsRequestCoordinator\(defaultProductChain\)/,
  );
  assert.match(
    source,
    /proofRequestsRef\.current\.setContext\(requestChain\)/,
  );
  assert.match(source, /proofRequestsRef\.current\.runLoad\(/);
  assert.match(source, /proofRequests\.invalidateAll\(\)/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const createKeyPath = path.join(
  testDir,
  "..",
  "components",
  "CreateKey.tsx",
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

test("wallet A API key load cannot overwrite wallet B", async () => {
  const { createApiKeyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createApiKeyRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const state = { keys: [] };
  const effects = [];
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.keys = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.keys = value;
    },
  });

  walletB.resolve(["wallet B key"]);
  walletA.resolve(["wallet A key"]);

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.keys, ["wallet B key"]);
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses a created secret and every stale effect", async () => {
  const { createApiKeyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createApiKeyRequestCoordinator("wallet-a");
  const create = deferred();
  const effects = [];
  const run = requests.runMutation("wallet-a", () => create.promise, {
    onError: () => effects.push("error", "toast:error"),
    onSettled: () => effects.push("loading:clear"),
    onSuccess: ({ secret }) => effects.push(`secret:${secret}`, "toast:success"),
  });

  requests.setContext("wallet-b");
  create.resolve({ secret: "wallet-a-secret" });

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("same-wallet API key mutations remain independent", async () => {
  const { createApiKeyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createApiKeyRequestCoordinator("wallet-a");
  const create = deferred();
  const revoke = deferred();
  const effects = [];
  const createRun = requests.runMutation("wallet-a", () => create.promise, {
    onError: () => effects.push("create:error"),
    onSuccess: () => effects.push("create:success"),
  });
  const revokeRun = requests.runMutation("wallet-a", () => revoke.promise, {
    onError: () => effects.push("revoke:error"),
    onSuccess: () => effects.push("revoke:success"),
  });

  revoke.resolve("revoked");
  create.resolve("created");

  assert.equal(await revokeRun, true);
  assert.equal(await createRun, true);
  assert.deepEqual(effects, ["revoke:success", "create:success"]);
});

test("unmount invalidates pending API key work", async () => {
  const { createApiKeyRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createApiKeyRequestCoordinator("wallet-a");
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
      () => mutation.promise,
      handlers("mutation"),
    ),
  ];

  requests.invalidateAll();
  load.resolve("keys");
  mutation.resolve("secret");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("API key UI binds request and visible state to the wallet address", () => {
  const source = readFileSync(createKeyPath, "utf8");

  assert.match(source, /createApiKeyRequestCoordinator\(walletContext\)/);
  assert.match(source, /apiKeyRequestsRef\.current\.setContext\(walletContext\)/);
  assert.match(source, /apiKeyRequestsRef\.current\.runLoad\(/);
  assert.match(source, /apiKeyRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /stateContext === walletContext/);
  assert.match(source, /apiKeyRequests\.invalidateAll\(\)/);
});

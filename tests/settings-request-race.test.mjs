import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const settingsPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "settings",
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

test("wallet A response cannot overwrite wallet B settings", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { settings: null };
  const walletARun = requests.runLoad(
    "wallet-a",
    () => walletA.promise,
    {
      onError: (error) => effects.push(error),
      onSuccess: (value) => {
        state.settings = value;
      },
    },
  );

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad(
    "wallet-b",
    () => walletB.promise,
    {
      onError: (error) => effects.push(error),
      onSuccess: (value) => {
        state.settings = value;
      },
    },
  );

  walletB.resolve("wallet B settings");
  walletA.resolve("wallet A settings");

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.equal(state.settings, "wallet B settings");
  assert.deepEqual(effects, []);
});

test("disconnect invalidates a pending wallet response", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const walletA = deferred();
  const effects = [];
  const run = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: () => effects.push("error"),
    onSettled: () => effects.push("loading:clear"),
    onSuccess: () => effects.push("success"),
  });

  requests.setContext("");
  walletA.resolve("wallet A settings");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("stale wallet errors cannot publish an error toast or clear loading", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const walletA = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => walletA.promise,
    {
      onError: () => effects.push("error", "toast:error"),
      onSettled: () => effects.push("loading:clear"),
      onSuccess: () => effects.push("success", "toast:success"),
    },
  );

  requests.setContext("wallet-b");
  walletA.reject(new Error("wallet A failed"));

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("a stale Telegram poll cannot update the next wallet", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const walletAPoll = deferred();
  const effects = [];
  const run = requests.runTelegramPoll(
    "wallet-a",
    () => walletAPoll.promise,
    {
      onError: () => effects.push("poll:error"),
      onSuccess: () => effects.push("telegram:linked", "toast:success"),
    },
  );

  requests.setContext("wallet-b");
  walletAPoll.resolve({ linked: true });

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("mutations cannot use settings loaded for a previous wallet", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const effects = [];
  let mutationCalls = 0;

  requests.setContext("wallet-b");
  const result = await requests.runMutation(
    "wallet-b",
    "wallet-a",
    async () => {
      mutationCalls += 1;
      return "saved";
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

test("same-wallet mutations remain independent", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const first = deferred();
  const second = deferred();
  const effects = [];
  const firstRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => first.promise,
    {
      onError: () => effects.push("first:error"),
      onSuccess: () => effects.push("first:success"),
    },
  );
  const secondRun = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => second.promise,
    {
      onError: () => effects.push("second:error"),
      onSuccess: () => effects.push("second:success"),
    },
  );

  second.resolve("second");
  assert.equal(await secondRun, true);
  first.resolve("first");
  assert.equal(await firstRun, true);
  assert.deepEqual(effects, ["second:success", "first:success"]);
});

test("unmount invalidation suppresses every pending Settings effect", async () => {
  const { createSettingsRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createSettingsRequestCoordinator("wallet-a");
  const pending = {
    load: deferred(),
    mutation: deferred(),
    telegram: deferred(),
  };
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: () => effects.push(`${label}:success`),
  });
  const runs = [
    requests.runLoad(
      "wallet-a",
      () => pending.load.promise,
      handlers("load"),
    ),
    requests.runMutation(
      "wallet-a",
      "wallet-a",
      () => pending.mutation.promise,
      handlers("mutation"),
    ),
    requests.runTelegramPoll(
      "wallet-a",
      () => pending.telegram.promise,
      handlers("telegram"),
    ),
  ];

  requests.invalidateAll();
  pending.load.resolve("load");
  pending.mutation.resolve("mutation");
  pending.telegram.resolve("telegram");

  assert.deepEqual(await Promise.all(runs), [false, false, false]);
  assert.deepEqual(effects, []);
});

test("Settings page wires wallet state through the tested coordinator", () => {
  const source = readFileSync(settingsPagePath, "utf8");

  assert.match(source, /createSettingsRequestCoordinator\(walletContext\)/);
  assert.match(source, /settingsRequestsRef\.current\.setContext\(walletContext\)/);
  assert.match(source, /settingsRequestsRef\.current\.runLoad\(/);
  assert.match(source, /settingsRequestsRef\.current\.runMutation\(/);
  assert.match(source, /settingsContextRef\.current/);
  assert.match(source, /settingsRequestsRef\.current\.runTelegramPoll\(/);
  assert.match(source, /settingsRequestsRef\.current\.invalidateTelegramPoll\(\)/);
  assert.match(source, /settingsRequests\.invalidateAll\(\)/);
  assert.match(source, /settingsContext === walletContext/);
});

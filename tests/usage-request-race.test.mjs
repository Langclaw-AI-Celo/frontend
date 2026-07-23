import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usagePagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "usage",
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

test("reverse completion commits only the newest request", async () => {
  const { createLatestRequestGuard, runLatestRequest } = await import(
    "../lib/latest-request.ts"
  );
  const guard = createLatestRequestGuard();
  const slow = deferred();
  const fast = deferred();
  const effects = [];
  const handlers = (label) => ({
    onError: () => effects.push(`${label}:error`),
    onSettled: () => effects.push(`${label}:settled`),
    onSuccess: (value) => effects.push(`${label}:${value}`),
  });
  const slowRun = runLatestRequest(
    guard,
    () => slow.promise,
    handlers("slow"),
  );
  const fastRun = runLatestRequest(
    guard,
    () => fast.promise,
    handlers("fast"),
  );

  fast.resolve("success");
  assert.equal(await fastRun, true);
  slow.resolve("success");
  assert.equal(await slowRun, false);
  assert.deepEqual(effects, ["fast:success", "fast:settled"]);
});

test("usage quote and balance loaders keep independent request state", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("celo");
  const firstQuote = deferred();
  const secondQuote = deferred();
  const balance = deferred();
  const state = { balance: null, quote: null };
  const errors = [];
  const firstQuoteRun = requests.runQuote("celo", () => firstQuote.promise, {
    onError: (error) => errors.push(error),
    onSuccess: (value) => {
      state.quote = value;
    },
  });
  const balanceRun = requests.runBalance("celo", () => balance.promise, {
    onError: (error) => errors.push(error),
    onSuccess: (value) => {
      state.balance = value;
    },
  });
  const secondQuoteRun = requests.runQuote("celo", () => secondQuote.promise, {
    onError: (error) => errors.push(error),
    onSuccess: (value) => {
      state.quote = value;
    },
  });

  balance.resolve("current balance");
  secondQuote.resolve("current quote");
  firstQuote.resolve("stale quote");

  assert.equal(await balanceRun, true);
  assert.equal(await secondQuoteRun, true);
  assert.equal(await firstQuoteRun, false);
  assert.deepEqual(state, {
    balance: "current balance",
    quote: "current quote",
  });
  assert.deepEqual(errors, []);
});

test("stale failures cannot publish errors or settled side effects", async () => {
  const { createLatestRequestGuard, runLatestRequest } = await import(
    "../lib/latest-request.ts"
  );
  const guard = createLatestRequestGuard();
  const pending = deferred();
  const effects = [];
  const run = runLatestRequest(guard, () => pending.promise, {
    onError: () => effects.push("error"),
    onSettled: () => effects.push("settled"),
    onSuccess: () => effects.push("success"),
  });

  guard.invalidate();
  pending.reject(new Error("stale failure"));

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("usage request decisions preserve unrelated operations", async () => {
  const {
    shouldDisableBalanceRefresh,
    shouldDisableChainSelection,
    shouldResetMiniPayChain,
  } = await import("../lib/latest-request.ts");

  assert.equal(shouldResetMiniPayChain(true, "celo"), false);
  assert.equal(shouldResetMiniPayChain(true, "base"), true);
  assert.equal(shouldResetMiniPayChain(false, "base"), false);
  assert.equal(
    shouldDisableBalanceRefresh({
      isBalanceLoading: false,
      isConnected: true,
      isSigning: false,
      operationLoading: "",
    }),
    false,
  );

  for (const operationLoading of ["deposit", "withdraw"]) {
    assert.equal(
      shouldDisableBalanceRefresh({
        isBalanceLoading: false,
        isConnected: true,
        isSigning: false,
        operationLoading,
      }),
      true,
    );
  }

  assert.equal(
    shouldDisableChainSelection({
      isConfirmingTransaction: false,
      isPendingTransaction: false,
      isSigning: false,
      operationLoading: "",
    }),
    false,
  );
  assert.equal(
    shouldDisableChainSelection({
      isConfirmingTransaction: false,
      isPendingTransaction: false,
      isSigning: false,
      operationLoading: "deposit",
    }),
    false,
  );
  assert.equal(
    shouldDisableChainSelection({
      isConfirmingTransaction: false,
      isPendingTransaction: false,
      isSigning: false,
      operationLoading: "send-deposit",
    }),
    true,
  );
});

test("chain reset invalidates pending quote and balance requests", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("celo");
  const quote = deferred();
  const balance = deferred();
  const effects = [];
  const quoteRun = requests.runQuote("celo", () => quote.promise, {
    onError: () => effects.push("quote:error"),
    onSuccess: () => effects.push("quote:success"),
  });
  const balanceRun = requests.runBalance("celo", () => balance.promise, {
    onError: () => effects.push("balance:error"),
    onSuccess: () => effects.push("balance:success"),
  });

  requests.setContext("mantle");
  quote.resolve("quote");
  balance.resolve("balance");

  assert.equal(await quoteRun, false);
  assert.equal(await balanceRun, false);
  assert.deepEqual(effects, []);
});

test("a stale continuation cannot start a request after a chain reset", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("celo");
  const effects = [];
  let oldLoadCalls = 0;

  requests.setContext("mantle");
  const oldResult = await requests.runBalance(
    "celo",
    async () => {
      oldLoadCalls += 1;
      return "stale balance";
    },
    {
      onError: () => effects.push("old:error"),
      onSuccess: () => effects.push("old:success"),
    },
  );
  const newResult = await requests.runBalance(
    "mantle",
    async () => "current balance",
    {
      onError: () => effects.push("new:error"),
      onSuccess: (value) => effects.push(value),
    },
  );

  assert.equal(oldResult, false);
  assert.equal(oldLoadCalls, 0);
  assert.equal(newResult, true);
  assert.deepEqual(effects, ["current balance"]);
});

test("chain reset suppresses every manual chain-state response", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("celo");
  const effects = [];
  const pending = {
    deposit: deferred(),
    vault: deferred(),
    vaultState: deferred(),
    withdraw: deferred(),
  };
  const runs = [
    requests.runDeposit("celo", () => pending.deposit.promise, {
      onError: () => effects.push("deposit:error"),
      onSuccess: () => effects.push("deposit:success"),
    }),
    requests.runVault("celo", () => pending.vault.promise, {
      onError: () => effects.push("vault:error"),
      onSuccess: () => effects.push("vault:success"),
    }),
    requests.runVaultState("celo", () => pending.vaultState.promise, {
      onError: () => effects.push("vault-state:error"),
      onSuccess: () => effects.push("vault-state:success"),
    }),
    requests.runWithdraw("celo", () => pending.withdraw.promise, {
      onError: () => effects.push("withdraw:error"),
      onSuccess: () => effects.push("withdraw:success"),
    }),
  ];

  requests.setContext("mantle");
  for (const request of Object.values(pending)) {
    request.resolve("stale");
  }

  assert.deepEqual(await Promise.all(runs), [false, false, false, false]);
  assert.deepEqual(effects, []);
});

test("disconnect invalidates only the balance request", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("celo");
  const quote = deferred();
  const balance = deferred();
  const effects = [];
  const quoteRun = requests.runQuote("celo", () => quote.promise, {
    onError: () => effects.push("quote:error"),
    onSuccess: () => effects.push("quote:success"),
  });
  const balanceRun = requests.runBalance("celo", () => balance.promise, {
    onError: () => effects.push("balance:error"),
    onSuccess: () => effects.push("balance:success"),
  });

  requests.invalidateBalance();
  quote.resolve("quote");
  balance.resolve("balance");

  assert.equal(await quoteRun, true);
  assert.equal(await balanceRun, false);
  assert.deepEqual(effects, ["quote:success"]);
});

test("credits page uses the tested request coordinator", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /createUsageRequestCoordinator\(defaultProductChain\)/,
  );
  assert.match(source, /usageRequestsRef\.current\.runQuote\(/);
  assert.match(source, /usageRequestsRef\.current\.runBalance\(/);
  assert.match(source, /usageRequestsRef\.current\.runDeposit\(/);
  assert.match(source, /usageRequestsRef\.current\.runVault\(/);
  assert.match(source, /usageRequestsRef\.current\.runVaultState\(/);
  assert.match(source, /usageRequestsRef\.current\.runWithdraw\(/);
  assert.match(source, /usageRequestsRef\.current\.setContext\(nextChain\)/);
  assert.match(source, /usageRequestsRef\.current\.invalidateBalance\(\)/);
  assert.match(source, /usageRequestsRef\.current\.isCurrentContext\(/);
  assert.match(source, /shouldResetMiniPayChain\(isMiniPay, selectedChain\)/);
  assert.match(source, /setIsBalanceLoading\(true\)/);
  assert.match(source, /setIsBalanceLoading\(false\)/);
  assert.match(source, /shouldDisableBalanceRefresh\(\{/);
  assert.match(source, /shouldDisableChainSelection\(\{/);
  assert.doesNotMatch(source, /setLoading\("balance"\)/);
});

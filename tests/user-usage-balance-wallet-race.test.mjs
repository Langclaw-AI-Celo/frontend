import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usageBarPath = path.join(
  testDir,
  "..",
  "components",
  "user-usage-bar.tsx",
);

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

test("wallet A usage balance cannot publish under wallet B", async () => {
  const { createUsageRequestCoordinator } = await import(
    "../lib/latest-request.ts"
  );
  const requests = createUsageRequestCoordinator("wallet-a:celo");
  const pending = deferred();
  const effects = [];
  const run = requests.runBalance(
    "wallet-a:celo",
    () => pending.promise,
    {
      onError: () => effects.push("error", "toast:error"),
      onSettled: () => effects.push("loading:clear"),
      onSuccess: () => effects.push("balance:wallet-a"),
    },
  );

  requests.setContext("wallet-b:celo");
  pending.resolve({ balance: "private wallet A balance" });

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("usage header binds server balance state to wallet and chain", () => {
  const source = readFileSync(usageBarPath, "utf8");
  const hookStart = source.indexOf("function useUsageBalanceState(");
  const hookEnd = source.indexOf("function useUsageWalletBalance(");
  const hookSource = source.slice(hookStart, hookEnd);

  assert.ok(hookStart >= 0 && hookEnd > hookStart);
  assert.match(
    hookSource,
    /createUsageRequestCoordinator\(usageContext\)/,
  );
  assert.match(
    hookSource,
    /usageBalanceRequestsRef\.current\.setContext\(usageContext\)/,
  );
  assert.match(hookSource, /usageBalanceRequestsRef\.current\.runBalance\(/);
  assert.match(
    hookSource,
    /wallet\.address\.trim\(\)\.toLowerCase\(\) !== requestAddress/,
  );
  assert.match(hookSource, /balanceState\.context === usageContext/);
  assert.match(hookSource, /usageBalanceRequests\.invalidateBalance\(\)/);
});

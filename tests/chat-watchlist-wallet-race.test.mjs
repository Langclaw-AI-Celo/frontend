import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const chatPath = path.join(testDir, "..", "components", "Chat.tsx");

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
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

test("wallet A chat watchlist add cannot publish under wallet B", async () => {
  const createWatchlistRequestCoordinator = await loadCoordinator();
  const requests = createWatchlistRequestCoordinator("wallet-a");
  const pending = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => pending.promise,
    {
      onError: () => effects.push("toast:error"),
      onSettled: () => effects.push("loading:clear"),
      onSuccess: () => effects.push("state:added", "toast:success"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve("added for wallet A");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("Chat binds result watchlist effects to the active wallet", () => {
  const source = readFileSync(chatPath, "utf8");
  const detailsStart = source.indexOf("function OnChainDetails");
  const detailsEnd = source.indexOf("function OnChainProofDetails");
  const detailsSource = source.slice(detailsStart, detailsEnd);

  assert.ok(detailsStart >= 0 && detailsEnd > detailsStart);
  assert.match(
    detailsSource,
    /createWatchlistRequestCoordinator\(walletContext\)/,
  );
  assert.match(
    detailsSource,
    /watchlistRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(detailsSource, /const watchlistViewContext = useMemo\(/);
  assert.match(
    detailsSource,
    /watchlistState\.context === watchlistViewContext/,
  );
  assert.match(
    detailsSource,
    /savingWatchlistContext === watchlistViewContext/,
  );
  assert.match(detailsSource, /watchlistRequestsRef\.current\.runLoad\(/);
  assert.match(detailsSource, /watchlistRequestsRef\.current\.runMutation\(/);
  assert.match(
    detailsSource,
    /wallet\.address\.trim\(\)\.toLowerCase\(\) !== requestContext/,
  );
  assert.match(detailsSource, /watchlistRequests\.invalidateAll\(\)/);
});

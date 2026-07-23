import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const chatInputPath = path.join(testDir, "..", "components", "ChatInput.tsx");

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
    typeof latestRequest.createChatStartRequestCoordinator,
    "function",
    "chat start request coordinator must exist",
  );

  return latestRequest.createChatStartRequestCoordinator;
}

test("wallet A chat start cannot publish navigation under wallet B", async () => {
  const createChatStartRequestCoordinator = await loadCoordinator();
  const requests = createChatStartRequestCoordinator("wallet-a");
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
        effects.push("sessions:update", "toast:success", "router:push"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve("wallet A session");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("ChatInput binds session creation and delayed navigation to its wallet", () => {
  const source = readFileSync(chatInputPath, "utf8");

  assert.match(source, /createChatStartRequestCoordinator\(walletContext\)/);
  assert.match(
    source,
    /chatStartRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(source, /chatStartRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /scheduleForWallet\(/);
  assert.match(source, /chatStartRequests\.invalidateAll\(\)/);
  assert.match(source, /clearChatTimers\(\)/);
});

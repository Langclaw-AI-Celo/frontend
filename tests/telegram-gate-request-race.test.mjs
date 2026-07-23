import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const telegramGatePath = path.join(
  testDir,
  "..",
  "components",
  "TelegramConnectDialog.tsx",
);

async function loadCoordinator() {
  const latestRequest = await import("../lib/latest-request.ts");

  assert.equal(
    typeof latestRequest.createTelegramGateRequestCoordinator,
    "function",
    "Telegram gate request coordinator must exist",
  );

  return latestRequest.createTelegramGateRequestCoordinator;
}

test("wallet switch invalidates every pending Telegram gate operation", async () => {
  const createTelegramGateRequestCoordinator = await loadCoordinator();
  const requests = createTelegramGateRequestCoordinator("wallet-a");
  const gate = requests.beginGate("wallet-a");
  const link = requests.beginLink("wallet-a");
  const poll = requests.beginPoll("wallet-a");

  requests.setContext("wallet-b");

  assert.equal(gate.isCurrent("wallet-a"), false);
  assert.equal(link.isCurrent("wallet-a"), false);
  assert.equal(poll.isCurrent("wallet-a"), false);
  assert.equal(requests.beginGate("wallet-a").isCurrent("wallet-a"), false);
  assert.equal(requests.beginGate("wallet-b").isCurrent("wallet-b"), true);
});

test("Telegram operations reject a wallet returned for another context", async () => {
  const createTelegramGateRequestCoordinator = await loadCoordinator();
  const requests = createTelegramGateRequestCoordinator("wallet-a");
  const gate = requests.beginGate("wallet-a");

  assert.equal(gate.isCurrent("wallet-a"), true);
  assert.equal(gate.isCurrent(" Wallet-A "), true);
  assert.equal(gate.isCurrent("wallet-b"), false);
  assert.equal(gate.isCurrent(), true);
});

test("new same-wallet work only supersedes its own Telegram channel", async () => {
  const createTelegramGateRequestCoordinator = await loadCoordinator();
  const requests = createTelegramGateRequestCoordinator("wallet-a");
  const firstLink = requests.beginLink("wallet-a");
  const poll = requests.beginPoll("wallet-a");
  const secondLink = requests.beginLink("wallet-a");

  assert.equal(firstLink.isCurrent("wallet-a"), false);
  assert.equal(poll.isCurrent("wallet-a"), true);
  assert.equal(secondLink.isCurrent("wallet-a"), true);

  requests.invalidateAll();

  assert.equal(poll.isCurrent("wallet-a"), false);
  assert.equal(secondLink.isCurrent("wallet-a"), false);
});

test("Telegram gate binds async effects to the active wallet address", () => {
  const source = readFileSync(telegramGatePath, "utf8");

  assert.match(
    source,
    /createTelegramGateRequestCoordinator\(walletContext\)/,
  );
  assert.match(
    source,
    /telegramRequestsRef\.current\.setContext\(walletContext\)/,
  );
  assert.match(source, /\.beginGate\(walletContext\)/);
  assert.match(source, /\.beginLink\(walletContext\)/);
  assert.match(source, /\.beginPoll\(walletContext\)/);
  assert.match(source, /request\.isCurrent\(wallet\.address\)/);
  assert.match(source, /telegramRequests\.invalidateAll\(\)/);
});

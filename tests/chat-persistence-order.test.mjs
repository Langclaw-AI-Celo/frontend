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

async function loadQueueFactory() {
  const latestRequest = await import("../lib/latest-request.ts");

  assert.equal(
    typeof latestRequest.createChatPersistenceQueue,
    "function",
    "chat persistence queue must exist",
  );

  return latestRequest.createChatPersistenceQueue;
}

test("chat revisions persist in submission order", async () => {
  const createChatPersistenceQueue = await loadQueueFactory();
  const queue = createChatPersistenceQueue();
  const olderGate = deferred();
  const starts = [];
  let storedRevision = "";
  const older = queue.enqueue("wallet-a:session-1", async () => {
    starts.push("older");
    await olderGate.promise;
    storedRevision = "older";
  });
  const newer = queue.enqueue("wallet-a:session-1", async () => {
    starts.push("newer");
    storedRevision = "newer";
  });

  await Promise.resolve();
  assert.deepEqual(starts, ["older"]);

  olderGate.resolve();
  await Promise.all([older, newer]);

  assert.deepEqual(starts, ["older", "newer"]);
  assert.equal(storedRevision, "newer");
});

test("a failed chat save does not block its next revision", async () => {
  const createChatPersistenceQueue = await loadQueueFactory();
  const queue = createChatPersistenceQueue();
  const starts = [];
  const older = queue.enqueue("wallet-a:session-1", async () => {
    starts.push("older");
    throw new Error("older save failed");
  });
  const newer = queue.enqueue("wallet-a:session-1", async () => {
    starts.push("newer");
    return "newer saved";
  });

  await assert.rejects(older, /older save failed/);
  assert.equal(await newer, "newer saved");
  assert.deepEqual(starts, ["older", "newer"]);
});

test("separate chat contexts do not block each other", async () => {
  const createChatPersistenceQueue = await loadQueueFactory();
  const queue = createChatPersistenceQueue();
  const walletAGate = deferred();
  const completions = [];
  const walletA = queue.enqueue("wallet-a:session-1", async () => {
    await walletAGate.promise;
    completions.push("wallet-a");
  });
  const walletB = queue.enqueue("wallet-b:session-1", async () => {
    completions.push("wallet-b");
  });

  await walletB;
  assert.deepEqual(completions, ["wallet-b"]);

  walletAGate.resolve();
  await walletA;
  assert.deepEqual(completions, ["wallet-b", "wallet-a"]);
});

test("Chat keys persistence ordering by wallet and session", () => {
  const source = readFileSync(chatPath, "utf8");

  assert.match(source, /createChatPersistenceQueue\(\)/);
  assert.match(
    source,
    /const persistenceContext = JSON\.stringify\(\[/,
  );
  assert.match(
    source,
    /chatPersistenceQueueRef\.current\.enqueue\(\s*persistenceContext,/,
  );
  assert.match(
    source,
    /chatContextGenerationRef\.current !== persistenceGeneration/,
  );
  assert.equal(
    source.match(/chatContextGenerationRef\.current \+= 1/g)?.length,
    2,
    "wallet changes and unmounts must invalidate queued chat saves",
  );
});

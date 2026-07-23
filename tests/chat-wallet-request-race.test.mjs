import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const chatPath = path.join(testDir, "..", "components", "Chat.tsx");

function deferred() {
  let reject;
  let resolve;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    reject = rejectPromise;
    resolve = resolvePromise;
  });

  return { promise, reject, resolve };
}

async function loadCoordinator() {
  const latestRequest = await import("../lib/latest-request.ts");

  assert.equal(
    typeof latestRequest.createChatSessionsRequestCoordinator,
    "function",
    "chat request coordinator must exist",
  );

  return latestRequest.createChatSessionsRequestCoordinator;
}

test("wallet A chat cannot publish under wallet B", async () => {
  const createChatRequestCoordinator = await loadCoordinator();
  const requests = createChatRequestCoordinator("wallet-a");
  const walletA = deferred();
  const walletB = deferred();
  const effects = [];
  const state = { session: null };
  const walletARun = requests.runLoad("wallet-a", () => walletA.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.session = value;
    },
  });

  requests.setContext("wallet-b");
  const walletBRun = requests.runLoad("wallet-b", () => walletB.promise, {
    onError: (error) => effects.push(error),
    onSuccess: (value) => {
      state.session = value;
    },
  });

  walletB.resolve({ messages: ["wallet B chat"] });
  walletA.resolve({ messages: ["wallet A private chat"] });

  assert.equal(await walletBRun, true);
  assert.equal(await walletARun, false);
  assert.deepEqual(state.session, { messages: ["wallet B chat"] });
  assert.deepEqual(effects, []);
});

test("wallet switch suppresses stale chat persistence effects", async () => {
  const createChatRequestCoordinator = await loadCoordinator();
  const requests = createChatRequestCoordinator("wallet-a");
  const pending = deferred();
  const effects = [];
  const run = requests.runMutation(
    "wallet-a",
    "wallet-a",
    () => pending.promise,
    {
      onError: () => effects.push("save:error", "toast:error"),
      onSettled: () => effects.push("save:settled"),
      onSuccess: () => effects.push("sessions:update", "save:clear"),
    },
  );

  requests.setContext("wallet-b");
  pending.resolve("saved wallet A chat");

  assert.equal(await run, false);
  assert.deepEqual(effects, []);
});

test("chat persistence requires a session loaded for the current wallet", async () => {
  const createChatRequestCoordinator = await loadCoordinator();
  const requests = createChatRequestCoordinator("wallet-a");
  let saveCalls = 0;

  requests.setContext("wallet-b");
  const result = await requests.runMutation(
    "wallet-b",
    "wallet-a",
    async () => {
      saveCalls += 1;
      return "saved";
    },
    {
      onError: () => undefined,
      onSuccess: () => undefined,
    },
  );

  assert.equal(result, false);
  assert.equal(saveCalls, 0);
});

test("unmount invalidates pending chat loads and saves", async () => {
  const createChatRequestCoordinator = await loadCoordinator();
  const requests = createChatRequestCoordinator("wallet-a");
  const load = deferred();
  const save = deferred();
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
      "wallet-a",
      () => save.promise,
      handlers("save"),
    ),
  ];

  requests.invalidateAll();
  load.resolve("loaded");
  save.resolve("saved");

  assert.deepEqual(await Promise.all(runs), [false, false]);
  assert.deepEqual(effects, []);
});

test("Chat binds session requests and rendered messages to wallet identity", () => {
  const source = readFileSync(chatPath, "utf8");

  assert.match(
    source,
    /createChatSessionsRequestCoordinator\(walletContext\)/,
  );
  assert.match(source, /chatRequestsRef\.current\.setContext\(walletContext\)/);
  assert.match(source, /chatRequestsRef\.current\.runLoad\(/);
  assert.match(source, /chatRequestsRef\.current\.runMutation\(/);
  assert.match(source, /wallet\.address\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source, /sessionContextRef\.current/);
  assert.match(source, /sessionContext === walletContext/);
  assert.match(source, /messagesForWallet/);
  assert.match(source, /chatRequests\.invalidateAll\(\)/);
  assert.match(source, /activeChatContextRef\.current = ""/);
  assert.match(source, /clearError\(\)/);
  assert.match(source, /stop\(\)/);
  const previousStopIndex = source.indexOf("stopRef.current();");
  const replaceStopIndex = source.indexOf("stopRef.current = stop;");

  assert.ok(
    previousStopIndex >= 0 && previousStopIndex < replaceStopIndex,
    "the previous chat instance must stop before its stop ref is replaced",
  );
});

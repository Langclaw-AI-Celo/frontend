import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  consumePendingPrompt,
  savePendingPrompt,
} from "../lib/chat-utils.ts";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const chatInputPath = path.join(testDir, "..", "components", "ChatInput.tsx");

function createSessionStorage() {
  const items = new Map();

  return {
    getItem(key) {
      return items.get(key) ?? null;
    },
    items,
    removeItem(key) {
      items.delete(key);
    },
    setItem(key, value) {
      items.set(key, value);
    },
  };
}

async function withWindow(sessionStorage, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage },
  });

  try {
    await callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(globalThis, "window", descriptor);
    } else {
      delete globalThis.window;
    }
  }
}

test("pending prompts save and consume one validated record", async () => {
  const storage = createSessionStorage();

  await withWindow(storage, () => {
    assert.equal(
      savePendingPrompt("session-1", {
        chain: "celo",
        model: " gpt-5.4-nano ",
        researchTrend: true,
        text: "  Find Celo momentum  ",
        toolMode: "research",
      }),
      true,
    );
    assert.deepEqual(consumePendingPrompt("session-1"), {
      chain: "celo",
      model: "gpt-5.4-nano",
      researchTrend: true,
      text: "Find Celo momentum",
      toolMode: "research",
    });
    assert.equal(consumePendingPrompt("session-1"), null);
  });
});

test("pending prompts reject invalid identifiers and payloads", async () => {
  const storage = createSessionStorage();
  const validPrompt = {
    researchTrend: false,
    text: "Hello",
    toolMode: "chat",
  };

  await withWindow(storage, () => {
    assert.equal(savePendingPrompt("", validPrompt), false);
    assert.equal(savePendingPrompt(" session-1 ", validPrompt), false);
    assert.equal(
      savePendingPrompt("session-1", { ...validPrompt, text: "   " }),
      false,
    );
    assert.equal(
      savePendingPrompt("session-1", {
        ...validPrompt,
        text: "x".repeat(20_001),
      }),
      false,
    );
    assert.equal(
      savePendingPrompt("session-1", { ...validPrompt, model: "   " }),
      false,
    );
    assert.equal(storage.items.size, 0);
  });
});

test("pending prompt consumption discards malformed stored data", async () => {
  const storage = createSessionStorage();

  await withWindow(storage, () => {
    for (const raw of [
      "not-json",
      JSON.stringify({ researchTrend: false, text: "" }),
      JSON.stringify({ researchTrend: "yes", text: "Hello" }),
      JSON.stringify({ researchTrend: false, text: "Hello", toolMode: "bad" }),
    ]) {
      storage.setItem("langclaw.pendingPrompt.v1:session-1", raw);
      assert.equal(consumePendingPrompt("session-1"), null);
      assert.equal(storage.items.size, 0);
    }
  });
});

test("pending prompt storage failures do not break chat navigation", async () => {
  const failingStorage = {
    getItem() {
      throw new Error("storage blocked");
    },
    removeItem() {
      throw new Error("storage blocked");
    },
    setItem() {
      throw new Error("storage full");
    },
  };

  await withWindow(failingStorage, () => {
    assert.equal(
      savePendingPrompt("session-1", {
        researchTrend: false,
        text: "Hello",
      }),
      false,
    );
    assert.equal(consumePendingPrompt("session-1"), null);
  });
});

test("chat creation stops before navigation when prompt storage fails", () => {
  const source = readFileSync(chatInputPath, "utf8");

  assert.match(
    source,
    /const promptStored = savePendingPrompt[\s\S]*?if \(!promptStored\) {[\s\S]*?throw new Error/,
  );
});

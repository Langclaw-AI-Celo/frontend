import assert from "node:assert/strict";
import test from "node:test";

import {
  storedMessagesToUIMessages,
  uiMessagesToStoredMessages,
} from "../lib/chat-utils.ts";

test("stored chat metadata survives a UI message round trip", () => {
  const stored = {
    chain: "celo",
    content: "Proof is ready.",
    error: "",
    id: "assistant-1",
    mode: "research",
    model: "gpt-5.4-nano",
    progressEvents: [{ agent: "proof", summary: "Anchored" }],
    role: "assistant",
    stopped: true,
  };

  const [roundTripped] = uiMessagesToStoredMessages(
    storedMessagesToUIMessages([stored]),
  );

  assert.equal(roundTripped.id, stored.id);
  assert.equal(roundTripped.content, stored.content);
  assert.equal(roundTripped.role, stored.role);
  assert.equal(roundTripped.chain, stored.chain);
  assert.equal(roundTripped.mode, stored.mode);
  assert.equal(roundTripped.model, stored.model);
  assert.deepEqual(roundTripped.progressEvents, stored.progressEvents);
  assert.equal(roundTripped.stopped, true);
});

test("UI conversion keeps text parts and drops unsupported roles", () => {
  const converted = uiMessagesToStoredMessages([
    {
      id: "user-1",
      parts: [
        { text: "Analyze ", type: "text" },
        { text: "internal", type: "reasoning" },
        { text: "CELO", type: "text" },
      ],
      role: "user",
    },
    {
      id: "system-1",
      parts: [{ text: "hidden", type: "text" }],
      role: "system",
    },
  ]);

  assert.equal(converted.length, 1);
  assert.equal(converted[0].content, "Analyze CELO");
  assert.equal(converted[0].role, "user");
});

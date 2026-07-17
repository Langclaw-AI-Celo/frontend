import assert from "node:assert/strict";
import test from "node:test";

import {
  createAssistantMessage,
  createUserMessage,
} from "../lib/chat-utils.ts";

test("user message factory creates distinct stored messages", () => {
  const first = createUserMessage("Analyze CELO liquidity");
  const second = createUserMessage("Analyze CELO liquidity");

  assert.equal(first.role, "user");
  assert.equal(first.content, "Analyze CELO liquidity");
  assert.notEqual(first.id, second.id);
});

test("assistant message factory starts with safe empty progress state", () => {
  const empty = createAssistantMessage();
  const populated = createAssistantMessage("Ready");

  assert.equal(empty.content, "");
  assert.deepEqual(empty.progressEvents, []);
  assert.equal(empty.role, "assistant");
  assert.equal(populated.content, "Ready");
  assert.notEqual(empty.id, populated.id);
});

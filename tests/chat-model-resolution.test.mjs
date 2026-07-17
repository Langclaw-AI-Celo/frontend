import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_AGENT_MODEL_ID,
  DEFAULT_CHAT_MODEL_ID,
  FIXED_CHAT_MODEL_ID,
  FIXED_CHAT_MODEL_LABEL,
  resolveChatModel,
} from "../lib/chat-model.ts";

test("fixed chat model resolution ignores requested model overrides", () => {
  for (const requested of [undefined, null, "", "gpt-5.2", "custom-router-model"]) {
    assert.equal(resolveChatModel(requested), FIXED_CHAT_MODEL_ID);
  }
});

test("chat and agent defaults share the documented fixed model", () => {
  assert.equal(DEFAULT_CHAT_MODEL_ID, FIXED_CHAT_MODEL_ID);
  assert.equal(DEFAULT_AGENT_MODEL_ID, FIXED_CHAT_MODEL_ID);
  assert.equal(FIXED_CHAT_MODEL_LABEL, "GPT-5.4 nano");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  appendProgressSummary,
  createChatSession,
  createSessionTitle,
  updateSessionMessages,
} from "../lib/chat-utils.ts";

test("session titles normalize whitespace and cap long prompts", () => {
  assert.equal(createSessionTitle("  Analyze\n  CELO   liquidity  "), "Analyze CELO liquidity");
  assert.equal(createSessionTitle("   "), "New Chat");

  const title = createSessionTitle("a".repeat(80));
  assert.equal(title.length, 54);
  assert.equal(title, `${"a".repeat(51)}...`);
});

test("new and updated sessions derive titles from user content", () => {
  const created = createChatSession("Track CELO volume", "session-1");
  assert.equal(created.id, "session-1");
  assert.equal(created.title, "Track CELO volume");
  assert.equal(created.pinned, false);

  const updated = updateSessionMessages(
    { ...created, title: "" },
    [{ content: "Summarize proof status", id: "message-1", role: "user" }],
  );
  assert.equal(updated.title, "Summarize proof status");
  assert.ok(Date.parse(updated.updatedAt) >= Date.parse(created.updatedAt));
});

test("progress summaries report the latest workflow event", () => {
  assert.equal(appendProgressSummary([]), "Starting Langclaw workflow...");
  assert.equal(
    appendProgressSummary([
      { agent: "planner", summary: "Building plan" },
      { agent: "proof", summary: "Decision anchored" },
    ]),
    "proof: Decision anchored",
  );
});

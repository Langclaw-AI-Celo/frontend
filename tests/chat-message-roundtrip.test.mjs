import assert from "node:assert/strict";
import test from "node:test";

import {
  getUIMessageText,
  markLatestAssistantStopped,
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

test("UI text conversion joins only visible text parts", () => {
  const content = getUIMessageText({
    parts: [
      { text: "First", type: "text" },
      { text: "private reasoning", type: "reasoning" },
      { output: "tool result", type: "tool-search" },
      { text: " second", type: "text" },
    ],
  });

  assert.equal(content, "First second");
  assert.equal(getUIMessageText({ parts: [] }), "");
});

test("stopping a chat marks only the latest assistant message", () => {
  const messages = [
    {
      id: "assistant-1",
      metadata: { mode: "chat" },
      parts: [{ text: "Earlier", type: "text" }],
      role: "assistant",
    },
    {
      id: "user-1",
      parts: [{ text: "Continue", type: "text" }],
      role: "user",
    },
    {
      id: "assistant-2",
      metadata: { model: "gpt-5.4-nano" },
      parts: [{ text: "Latest", type: "text" }],
      role: "assistant",
    },
  ];

  const stopped = markLatestAssistantStopped(messages);

  assert.equal(stopped[0], messages[0]);
  assert.equal(stopped[1], messages[1]);
  assert.notEqual(stopped[2], messages[2]);
  assert.deepEqual(stopped[2].metadata, {
    model: "gpt-5.4-nano",
    stopped: true,
  });
  assert.deepEqual(messages[2].metadata, { model: "gpt-5.4-nano" });
});

test("stopping a chat without an assistant preserves the message array", () => {
  const messages = [
    {
      id: "user-1",
      parts: [{ text: "Hello", type: "text" }],
      role: "user",
    },
  ];

  assert.equal(markLatestAssistantStopped(messages), messages);
  assert.equal(markLatestAssistantStopped([]).length, 0);
});

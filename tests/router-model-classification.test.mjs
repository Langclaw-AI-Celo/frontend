import assert from "node:assert/strict";
import test from "node:test";

import {
  getModelLabel,
  modelSupportsService,
} from "../hooks/use-router-models.ts";

test("router model classification recognizes image and audio capabilities", () => {
  assert.equal(
    modelSupportsService({ id: "render-v1", pricing: { image: "0.01" } }, "image"),
    true,
  );
  assert.equal(
    modelSupportsService({ id: "vision-image", type: "text-to-image" }, "image"),
    true,
  );
  assert.equal(
    modelSupportsService({ id: "speech-v1", type: "audio-transcription" }, "audio"),
    true,
  );
  assert.equal(modelSupportsService({ id: "whisper-large" }, "audio"), true);
});

test("router model classification keeps chat separate from media models", () => {
  assert.equal(
    modelSupportsService({ id: "router-chat", pricing: { prompt: "0.1" } }, "chat"),
    true,
  );
  assert.equal(modelSupportsService({ id: "generic-model" }, "chat"), true);
  assert.equal(modelSupportsService({ id: "image-v1", type: "image" }, "chat"), false);
  assert.equal(modelSupportsService({ id: "whisper-v1" }, "chat"), false);
  assert.equal(
    getModelLabel({ id: "gpt-5-mini", name: "GPT-5 mini" }),
    "GPT-5 mini (gpt-5-mini)",
  );
  assert.equal(getModelLabel({ id: "same", name: "same" }), "same");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const readmePath = path.join(frontendRoot, "README.md");
const chatModelPath = path.join(frontendRoot, "lib", "chat-model.ts");

test("frontend fixed chat model contract stays documented and hard-locked", () => {
  const readmeSource = readFileSync(readmePath, "utf8");
  const chatModelSource = readFileSync(chatModelPath, "utf8");

  assert.ok(
    chatModelSource.includes('export const FIXED_CHAT_MODEL_ID = "gpt-5.4-nano";'),
    "Expected lib/chat-model.ts to hard-lock the shipped chat model."
  );
  assert.ok(
    chatModelSource.includes("return FIXED_CHAT_MODEL_ID;"),
    "Expected resolveChatModel() to ignore requested overrides."
  );
  assert.ok(
    readmeSource.includes("gpt-5.4-nano"),
    "Expected README.md to document the fixed frontend chat model."
  );
  assert.ok(
    readmeSource.includes("resolveChatModel()"),
    "Expected README.md to point developers at resolveChatModel()."
  );
});

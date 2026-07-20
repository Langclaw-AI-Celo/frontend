import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiDirectory = new URL("../lib/langclaw-api/", import.meta.url);

const expectedModules = [
  "types.ts",
  "core.ts",
  "auth.ts",
  "discovery.ts",
  "chat.ts",
];

test("keeps Langclaw API modules present", async () => {
  for (const moduleName of expectedModules) {
    const source = await readFile(new URL(moduleName, apiDirectory), "utf8");
    assert.ok(source.trim().length > 0, `${moduleName} must contain implementation`);
  }
});

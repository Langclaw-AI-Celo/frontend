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
  "api-keys.ts",
  "memory.ts",
  "automation.ts",
  "usage.ts",
  "proof.ts",
  "strategy.ts",
  "watchlist.ts",
];

test("keeps Langclaw API modules present", async () => {
  for (const moduleName of expectedModules) {
    const source = await readFile(new URL(moduleName, apiDirectory), "utf8");
    assert.ok(source.trim().length > 0, `${moduleName} must contain implementation`);
  }
});

test("keeps internal API dependencies acyclic", async () => {
  for (const moduleName of expectedModules.filter(
    (name) => name !== "types.ts",
  )) {
    const source = await readFile(new URL(moduleName, apiDirectory), "utf8");
    const specifiers = [
      ...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g),
    ].map((match) => match[1]);
    const allowed =
      moduleName === "core.ts"
        ? new Set(["./types.ts"])
        : new Set(["./core.ts", "./types.ts"]);

    for (const specifier of specifiers) {
      assert.ok(
        allowed.has(specifier),
        `${moduleName} must not import ${specifier}`,
      );
    }
  }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiDirectory = new URL("../lib/langclaw-api/", import.meta.url);
const chatTransportPath = new URL(
  "../lib/langclaw-chat-transport.ts",
  import.meta.url,
);

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

test("chat transport reuses the validated API stream client", async () => {
  const source = await readFile(chatTransportPath, "utf8");

  assert.match(
    source,
    /import\s+\{[^}]*streamChat[^}]*\}\s+from\s+["']@\/lib\/langclaw-api["']/s,
  );
  assert.match(source, /await streamChat\s*\(\s*\{/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /async function readNdjson\s*\(/);
  assert.doesNotMatch(source, /response\.json\s*\(/);
});

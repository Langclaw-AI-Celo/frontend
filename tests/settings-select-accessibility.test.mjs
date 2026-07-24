import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const settingsPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "settings",
  "page.tsx",
);

test("Settings names each preference selector", () => {
  const source = readFileSync(settingsPagePath, "utf8");
  const selectNames = [...source.matchAll(/<SelectTrigger\b([^>]*)>/g)]
    .map(([, attributes]) =>
      attributes.match(/\baria-label="([^"]+)"/)?.[1],
    )
    .filter(Boolean);

  for (const expectedName of [
    "Failure alerts",
    "Retry policy",
    "Limit behavior",
    "Low balance action",
  ]) {
    assert.ok(
      selectNames.includes(expectedName),
      `Expected a Settings selector named "${expectedName}".`,
    );
  }
});

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

test("Settings gives each preference switch an accessible name", () => {
  const source = readFileSync(settingsPagePath, "utf8");
  const toggleRow = source.match(
    /function ToggleRow\([\s\S]+?(?=\nfunction StatCard\()/,
  )?.[0];

  assert.ok(toggleRow, "Expected the shared Settings ToggleRow component.");
  assert.match(
    toggleRow,
    /<Switch\b[\s\S]*?\baria-label=\{title\}[\s\S]*?\/>/,
    "Expected each Settings switch to use its visible title as its accessible name.",
  );
});

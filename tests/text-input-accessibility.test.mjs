import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));

function controlLabels(relativePath) {
  const source = readFileSync(path.resolve(testDir, "..", relativePath), "utf8");
  const controls = source.match(/<(?:Input|Textarea)\b[\s\S]*?\/>/g) ?? [];

  return controls
    .map((control) => control.match(/\baria-label="([^"]+)"/)?.[1])
    .filter(Boolean);
}

test("user text inputs expose stable accessible names", () => {
  const expectations = new Map([
    ["components/app-sidebar.tsx", ["Chat title"]],
    ["components/CreateKey.tsx", ["API key name"]],
    [
      "app/(user)/task/page.tsx",
      [
        "Search tasks",
        "Task name",
        "Task project",
        "Task prompt",
        "Event name",
      ],
    ],
    ["app/(user)/memory/data-table.tsx", ["Search memories"]],
    [
      "app/(user)/settings/page.tsx",
      ["Notification email", "Email verification code"],
    ],
  ]);

  for (const [relativePath, expectedLabels] of expectations) {
    const labels = controlLabels(relativePath);

    for (const label of expectedLabels) {
      assert.ok(
        labels.includes(label),
        `Expected ${relativePath} to name its ${label} control.`,
      );
    }
  }
});

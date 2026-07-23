import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const taskPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "task",
  "page.tsx",
);

test("Automation Tasks names its filter and creation controls", () => {
  const source = readFileSync(taskPagePath, "utf8");
  const selectNames = [...source.matchAll(/<SelectTrigger\b([^>]*)>/g)]
    .map(([, attributes]) =>
      attributes.match(/\baria-label="([^"]+)"/)?.[1],
    )
    .filter(Boolean);

  for (const expectedName of [
    "Filter task status",
    "Trigger type",
    "Schedule frequency",
    "Initial task status",
  ]) {
    assert.ok(
      selectNames.includes(expectedName),
      `Expected a task selector named "${expectedName}".`,
    );
  }

  const scheduleTimeLabel = 'aria-label="Schedule time"';
  const scheduleTimeLabelIndex = source.indexOf(scheduleTimeLabel);
  const scheduleTimeInputStart = source.lastIndexOf(
    "<Input",
    scheduleTimeLabelIndex,
  );
  const scheduleTimeInputEnd = source.indexOf("/>", scheduleTimeLabelIndex);
  const scheduleTimeInput = source.slice(
    scheduleTimeInputStart,
    scheduleTimeInputEnd,
  );

  assert.ok(
    scheduleTimeLabelIndex >= 0 &&
      scheduleTimeInputStart >= 0 &&
      scheduleTimeInputEnd >= 0 &&
      scheduleTimeInput.includes('type="time"'),
    "Expected the schedule time input to expose an accessible name.",
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usageBarPath = path.resolve(testDir, "../components/user-usage-bar.tsx");

test("user usage bar keeps desktop sections left aligned", () => {
  const source = readFileSync(usageBarPath, "utf8");
  const actionsIndex = source.indexOf("<UsageBarActions");
  const metricsIndex = source.indexOf("<UsageBarMetrics");

  assert.ok(
    source.includes(
      'className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start"',
    ),
    "Expected the usage bar desktop layout to align sections from the left.",
  );
  assert.ok(
    !source.includes("lg:justify-between"),
    "Expected the usage bar desktop layout to avoid justify-between.",
  );
  assert.ok(
    !source.includes("lg:justify-end"),
    "Expected the usage bar action area to avoid pushing content to the right.",
  );
  assert.ok(
    actionsIndex > -1 && metricsIndex > -1 && actionsIndex < metricsIndex,
    "Expected the action block to render before the metrics grid in the left-aligned layout.",
  );
  assert.ok(
    source.includes('className="grid min-w-0 grid-cols-2 gap-2 lg:basis-full'),
    "Expected the metrics grid to start on a new left-aligned row on desktop.",
  );
});

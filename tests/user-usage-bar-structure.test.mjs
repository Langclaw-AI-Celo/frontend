import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usageBarPath = path.resolve(testDir, "../components/user-usage-bar.tsx");

test("user usage bar is split into focused hooks and view sections", () => {
  const source = readFileSync(usageBarPath, "utf8");

  for (const marker of [
    "function useUserUsageBarModel(",
    "function useUsageBalanceState(",
    "function useUsageWalletBalance(",
    "function UsageBarMetrics(",
  ]) {
    assert.ok(
      source.includes(marker),
      `Expected user-usage-bar.tsx to define ${marker}.`,
    );
  }
});

test("user usage bar avoids useMemo for simple derived values", () => {
  const source = readFileSync(usageBarPath, "utf8");

  assert.ok(
    !source.includes("useMemo("),
    "Expected user-usage-bar.tsx to avoid useMemo for simple derived values.",
  );
});

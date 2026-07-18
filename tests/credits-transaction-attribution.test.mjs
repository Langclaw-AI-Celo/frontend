import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usagePagePath = path.join(testDir, "..", "app", "(user)", "usage", "page.tsx");

test("token approval sends a Celo-attributed write request", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /const approvalRequest = withCeloAttribution\([\s\S]*?functionName: "approve"[\s\S]*?writeApproveAsync\(\s*approvalRequest/,
  );
});

test("token deposit sends a Celo-attributed write request", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /const tokenDepositRequest = withCeloAttribution\([\s\S]*?functionName: "depositTokenAmount"[\s\S]*?writeDepositAsync\(\s*tokenDepositRequest/,
  );
});

test("native deposit sends a Celo-attributed write request", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /const nativeDepositRequest = withCeloAttribution\([\s\S]*?functionName: "deposit"[\s\S]*?writeDepositAsync\(\s*nativeDepositRequest/,
  );
});

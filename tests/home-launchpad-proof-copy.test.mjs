import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const launchpadPath = path.join(frontendRoot, "components", "HomeDemoLaunchpad.tsx");

test("home launchpad labels the self registration transaction honestly", () => {
  const source = readFileSync(launchpadPath, "utf8");

  assert.ok(
    source.includes('label: "Self Agent ID tx"'),
    "Expected the launchpad card to label the Self registration transaction accurately."
  );
  assert.ok(
    !source.includes('label: "Self proof tx"'),
    "Expected the launchpad card to stop calling the registration transaction a proof transaction."
  );
});

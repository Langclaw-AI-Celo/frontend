import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const squigglyHomePath = path.join(frontendRoot, "components", "SquigglyHome.tsx");
const launchpadPath = path.join(frontendRoot, "components", "HomeDemoLaunchpad.tsx");

test("home proof layer links the current public decision examples", () => {
  const source = readFileSync(squigglyHomePath, "utf8");

  assert.ok(
    source.includes("https://celoscan.io/tx/0x4485061e6e6151bc51c106f025b7d062468121595ca5cb4198f7307ea5ec5f06"),
    "Expected the home proof layer to link the latest ERC-8004 decision example."
  );
  assert.ok(
    source.includes("https://celoscan.io/tx/0x2a2f94c40e2b5c080bd330f43f3ce6bc6b05e054b6626ce3ab2716220f0d3211"),
    "Expected the home proof layer to link the latest Self-linked decision example."
  );
});

test("home launchpad keeps the current Self Agent ID proof card", () => {
  const source = readFileSync(launchpadPath, "utf8");

  assert.ok(
    source.includes('label: "Self Agent ID"'),
    "Expected the home launchpad to keep the Self Agent ID summary card."
  );
  assert.ok(
    source.includes("https://celoscan.io/tx/0x3c7d0cc69f77d2aef5ab21bfe703d0f33f7037d5e2162209d78b23b5c3f1cde6"),
    "Expected the home launchpad to link the current Self Agent ID registration transaction."
  );
});

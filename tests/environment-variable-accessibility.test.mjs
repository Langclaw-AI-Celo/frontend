import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(
  testDir,
  "..",
  "components",
  "ai-elements",
  "environment-variables.tsx",
);

test("environment variable copy controls announce target and state", () => {
  const source = readFileSync(componentPath, "utf8");

  assert.ok(
    source.includes('`${name || "Environment variable"} copied`'),
    "Expected a copied-state accessible label.",
  );
  assert.ok(
    source.includes('`Copy ${copyFormat} for ${name || "environment variable"}`'),
    "Expected the copy format and variable name in the accessible label.",
  );
});

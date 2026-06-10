import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const readmePath = path.join(frontendRoot, "README.md");

test("frontend README documents the latest proof run and ready semantics", () => {
  const source = readFileSync(readmePath, "utf8");

  assert.match(
    source,
    /Decision #47[\s\S]*campaign-backend-proof[\s\S]*Agent: 9109/,
    "Expected the README to keep the latest ERC-8004 decision example."
  );
  assert.ok(
    source.includes("github-backend-433b125-2026-06-08"),
    "Expected the README to include the current public proof run id."
  );
  assert.match(
    source,
    /report `ready`[\s\S]*Self Agent ID `133` remains available/,
    "Expected the README to explain the preferred-agent ready semantics."
  );
  assert.match(
    source,
    /single-root workspace[\s\S]*`backend`, `contracts`, and `.github`/,
    "Expected the README to document the current local workspace shape."
  );
});

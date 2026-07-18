import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usagePagePath = path.join(testDir, "..", "app", "(user)", "usage", "page.tsx");

test("usage copy controls expose their target and completion state", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /aria-label=\{copied === label \? `\$\{label\} copied` : `Copy \$\{label\}`\}/,
  );
});

test("credit inputs have explicit labels", () => {
  const source = readFileSync(usagePagePath, "utf8");

  for (const [id, label] of [
    ["deposit-amount", "Amount"],
    ["existing-deposit-hash", "Transaction hash"],
    ["existing-deposit-reference", "Reference"],
    ["withdraw-amount", "Amount to withdraw"],
  ]) {
    assert.match(
      source,
      new RegExp(`htmlFor="${id}"[\\s\\S]*?>\\s*${label}\\s*<`),
    );
    assert.match(source, new RegExp(`<Input[\\s\\S]*?id="${id}"`));
  }
});

test("deposit and withdrawal transaction states use polite live regions", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /aria-label="Deposit transaction status"[\s\S]*?aria-live="polite"[\s\S]*?role="status"/,
  );
  assert.match(
    source,
    /aria-label="Withdrawal transaction status"[\s\S]*?aria-live="polite"[\s\S]*?role="status"/,
  );
});

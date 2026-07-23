import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));

async function loadTryCopyText() {
  const clipboard = await import("../lib/clipboard.ts");

  assert.equal(
    typeof clipboard.tryCopyText,
    "function",
    "clipboard helper must exist",
  );

  return clipboard.tryCopyText;
}

test("clipboard helper reports a successful write", async () => {
  const tryCopyText = await loadTryCopyText();
  const writes = [];
  const result = await tryCopyText("alpha", {
    writeText: async (value) => writes.push(value),
  });

  assert.equal(result, true);
  assert.deepEqual(writes, ["alpha"]);
});

test("clipboard helper reports unavailable and rejected writes", async () => {
  const tryCopyText = await loadTryCopyText();

  assert.equal(await tryCopyText("alpha", undefined), false);
  assert.equal(
    await tryCopyText("alpha", {
      writeText: async () => {
        throw new Error("permission denied");
      },
    }),
    false,
  );
});

test("user copy controls handle clipboard failures through the shared helper", () => {
  const affectedFiles = [
    "components/Chat.tsx",
    "components/ExampleKey.tsx",
    "components/TelegramConnectDialog.tsx",
    "app/(user)/memory/columns.tsx",
    "app/(user)/usage/page.tsx",
  ];

  for (const relativePath of affectedFiles) {
    const source = readFileSync(
      path.resolve(testDir, "..", relativePath),
      "utf8",
    );

    assert.match(
      source,
      /tryCopyText\(/,
      `Expected ${relativePath} to use the clipboard helper.`,
    );
    assert.doesNotMatch(
      source,
      /navigator\.clipboard\.writeText/,
      `Expected ${relativePath} to avoid an unhandled clipboard write.`,
    );
  }
});

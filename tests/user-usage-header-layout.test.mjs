import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const layoutPath = path.resolve(testDir, "../app/(user)/layout.tsx");
const usageBarPath = path.resolve(testDir, "../components/user-usage-bar.tsx");

test("user layout renders a sticky top wrapper for the usage header", () => {
  const source = readFileSync(layoutPath, "utf8");
  const mainClassName = source.match(/<main className="([^"]+)"/)?.[1] ?? "";

  assert.ok(
    source.includes('className="sticky top-0 z-30'),
    "Expected the user layout to render a sticky top wrapper.",
  );
  assert.ok(
    source.includes("<UserUsageBar />"),
    "Expected the sticky top wrapper to include the usage bar.",
  );
  assert.ok(
    source.includes(
      'className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col',
    ),
    "Expected page content to stay in a separate centered container below the sticky header.",
  );
  assert.ok(
    !mainClassName.includes("overflow-x-hidden"),
    "Expected the main user shell to avoid overflow-x-hidden so the sticky header can stay attached during scroll.",
  );
});

test("user usage bar uses header-style chrome instead of a rounded card shell", () => {
  const source = readFileSync(usageBarPath, "utf8");

  assert.ok(
    source.includes('className="flex w-full flex-col gap-3'),
    "Expected the usage bar shell to stretch full width like a header.",
  );
  assert.ok(
    !source.includes("rounded-md border bg-card/85"),
    "Expected the old rounded card shell to be removed from the usage bar.",
  );
});

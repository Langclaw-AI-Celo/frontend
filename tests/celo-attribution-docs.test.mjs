import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(testDir, "..");
const envExample = readFileSync(path.join(rootDir, ".env.example"), "utf8");
const readme = readFileSync(path.join(rootDir, "README.md"), "utf8");

test("publishes frontend Celo attribution environment variables", () => {
  assert.match(
    envExample,
    /^NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME=langclawcelo\.vercel\.app$/m,
  );
  assert.match(envExample, /^NEXT_PUBLIC_CELO_ATTRIBUTION_CODE=$/m);
});

test("documents frontend Celo attribution behavior", () => {
  assert.match(readme, /NEXT_PUBLIC_CELO_ATTRIBUTION_HOSTNAME/);
  assert.match(readme, /NEXT_PUBLIC_CELO_ATTRIBUTION_CODE/);
  assert.match(readme, /hostname code first/i);
  assert.match(readme, /official code second/i);
  assert.match(readme, /MiniPay adds its own platform\s+code/i);
  assert.match(readme, /Mantle transactions remain unchanged/i);
  assert.match(readme, /reward program only credits an official\s+code/i);
  assert.match(readme, /https:\/\/docs\.celo\.org\/build-on-celo\/attribution-tags/);
});

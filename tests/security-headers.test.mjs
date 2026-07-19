import assert from "node:assert/strict";
import test from "node:test";

import { buildContentSecurityPolicy } from "../lib/security-headers.ts";

test("production CSP does not permit eval-based scripts", () => {
  const policy = buildContentSecurityPolicy({ isDevelopment: false });

  assert.doesNotMatch(policy, /'unsafe-eval'/);
});

test("development CSP keeps the Next.js debugging allowance", () => {
  const policy = buildContentSecurityPolicy({ isDevelopment: true });

  assert.match(policy, /script-src[^;]*'unsafe-eval'/);
});

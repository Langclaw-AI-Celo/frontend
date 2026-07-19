import assert from "node:assert/strict";
import test from "node:test";

import { safeExternalUrl } from "../lib/external-url.ts";

test("external links accept only credential-free HTTP URLs", () => {
  assert.equal(
    safeExternalUrl(" https://explorer.celo.org/mainnet/tx/0xabc "),
    "https://explorer.celo.org/mainnet/tx/0xabc",
  );
  assert.equal(safeExternalUrl("http://localhost:3001/health"), "http://localhost:3001/health");

  for (const value of [
    "javascript:alert(document.domain)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "//attacker.example/path",
    "/internal/path",
    "https://user:secret@example.com/path",
    "not a url",
    "",
    undefined,
  ]) {
    assert.equal(safeExternalUrl(value), undefined, String(value));
  }
});

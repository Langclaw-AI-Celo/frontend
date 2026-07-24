import assert from "node:assert/strict";
import test from "node:test";

import {
  externalUrlHostname,
  safeExternalUrl,
} from "../lib/external-url.ts";

test("external links accept HTTPS and local credential-free HTTP URLs", () => {
  assert.equal(
    safeExternalUrl(" https://explorer.celo.org/mainnet/tx/0xabc "),
    "https://explorer.celo.org/mainnet/tx/0xabc",
  );
  assert.equal(safeExternalUrl("http://localhost:3001/health"), "http://localhost:3001/health");

  for (const value of [
    "http://attacker.example/path",
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

test("external URL hostnames tolerate malformed source data", () => {
  assert.equal(externalUrlHostname("https://docs.celo.org/build"), "docs.celo.org");
  assert.equal(externalUrlHostname("not a url"), undefined);
  assert.equal(externalUrlHostname("javascript:alert(1)"), undefined);
});

test("external links reject the reserved port zero", () => {
  assert.equal(safeExternalUrl("https://example.com:0/support"), undefined);
  assert.equal(safeExternalUrl("http://localhost:0/health"), undefined);
  assert.equal(
    safeExternalUrl("https://example.com:1/support"),
    "https://example.com:1/support",
  );
  assert.equal(
    safeExternalUrl("https://example.com:65535/support"),
    "https://example.com:65535/support",
  );
  assert.equal(safeExternalUrl("https://example.com:65536/support"), undefined);
});

test("external links reject embedded control characters", () => {
  for (const value of [
    "https://trusted.example\n.evil.example/support",
    "https://example.com/pa\tth",
    "https://example.com/\rredirect",
    "https://example.com/\0hidden",
    "https://example.com/\u007fhidden",
  ]) {
    assert.equal(safeExternalUrl(value), undefined, JSON.stringify(value));
  }
});

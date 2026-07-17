import assert from "node:assert/strict";
import test from "node:test";

import { parseCachedWalletAuth } from "../lib/wallet-auth-cache.ts";

const address = "0x1111111111111111111111111111111111111111";
const now = Date.parse("2026-07-17T12:00:00.000Z");

function cachedSession(expiresAt, overrides = {}) {
  return JSON.stringify({
    address,
    sessionExpiresAt: expiresAt,
    sessionToken: "session-token",
    ...overrides,
  });
}

test("cached wallet sessions remain valid beyond the refresh margin", () => {
  const raw = cachedSession(new Date(now + 60_001).toISOString());

  assert.equal(parseCachedWalletAuth(raw, address, now)?.sessionToken, "session-token");
});

test("cached wallet sessions expire at the one-minute refresh boundary", () => {
  for (const expiresAt of [now - 1, now, now + 60_000]) {
    const raw = cachedSession(new Date(expiresAt).toISOString());
    assert.equal(parseCachedWalletAuth(raw, address, now), null);
  }
});

test("cached wallet sessions reject malformed or mismatched records", () => {
  assert.equal(parseCachedWalletAuth("not-json", address, now), null);
  assert.equal(parseCachedWalletAuth(null, address, now), null);
  assert.equal(parseCachedWalletAuth(cachedSession("invalid-date"), address, now), null);
  assert.equal(
    parseCachedWalletAuth(
      cachedSession(new Date(now + 120_000).toISOString(), {
        address: "0x2222222222222222222222222222222222222222",
      }),
      address,
      now,
    ),
    null,
  );
});

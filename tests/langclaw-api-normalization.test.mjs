import assert from "node:assert/strict";
import test from "node:test";

import {
  getLangclawApiBaseUrl,
  getLangclawApiUrl,
  LangclawApiError,
  readFriendlyError,
} from "../lib/langclaw-api.ts";

test("API URL helpers remove trailing separators and normalize paths", (t) => {
  const previous = process.env.NEXT_PUBLIC_LANGCLAW_API_URL;
  t.after(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_LANGCLAW_API_URL;
    } else {
      process.env.NEXT_PUBLIC_LANGCLAW_API_URL = previous;
    }
  });

  process.env.NEXT_PUBLIC_LANGCLAW_API_URL = "https://api.example.com///";

  assert.equal(getLangclawApiBaseUrl(), "https://api.example.com");
  assert.equal(getLangclawApiUrl("health"), "https://api.example.com/health");
  assert.equal(getLangclawApiUrl("/api/chat"), "https://api.example.com/api/chat");
});

test("API URL helpers reject unsafe backend origins", (t) => {
  const previous = process.env.NEXT_PUBLIC_LANGCLAW_API_URL;
  t.after(() => {
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_LANGCLAW_API_URL;
    } else {
      process.env.NEXT_PUBLIC_LANGCLAW_API_URL = previous;
    }
  });

  for (const value of [
    "javascript:alert(1)",
    "/relative-backend",
    "https://user:secret@api.example.com",
    "https://api.example.com?tenant=one",
    "https://api.example.com#backend",
  ]) {
    process.env.NEXT_PUBLIC_LANGCLAW_API_URL = value;
    assert.throws(
      () => getLangclawApiBaseUrl(),
      /Backend URL must be an absolute HTTP or HTTPS URL/,
    );
  }
});

test("friendly errors normalize authentication and configuration failures", () => {
  assert.equal(
    readFriendlyError(
      new LangclawApiError(
        "Telegram connection is required.",
        403,
        "telegram_link_required",
      ),
      "Request failed.",
    ),
    "Connect Telegram to continue.",
  );
  assert.equal(
    readFriendlyError(new Error("Wallet signature or API key is required."), "Request failed."),
    "Connect and approve your wallet to continue.",
  );
  assert.equal(
    readFriendlyError(new Error("Supabase client unavailable"), "Request failed."),
    "Account storage is not ready yet. Check backend configuration.",
  );
  assert.equal(readFriendlyError(null, "Request failed."), "Request failed.");
});

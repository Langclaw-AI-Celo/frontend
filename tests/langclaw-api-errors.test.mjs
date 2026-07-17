import assert from "node:assert/strict";
import test from "node:test";

import {
  LangclawApiError,
  readFriendlyError,
} from "../lib/langclaw-api.ts";

test("insufficient balance errors keep the currency reported by the backend", () => {
  for (const symbol of ["CELO", "MNT", "USDT"]) {
    const message = readFriendlyError(
      new LangclawApiError(`Insufficient ${symbol} balance.`, 402),
      "Request failed.",
    );

    assert.equal(
      message,
      `Insufficient ${symbol} balance. Add ${symbol} credits before running this request.`,
    );
  }
});

test("payment errors without a currency use neutral credit guidance", () => {
  const message = readFriendlyError(
    new LangclawApiError("Payment required.", 402),
    "Request failed.",
  );

  assert.equal(
    message,
    "Insufficient usage balance. Add credits before running this request.",
  );
});

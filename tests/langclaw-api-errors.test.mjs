import assert from "node:assert/strict";
import test from "node:test";

import {
  checkBackendHealth,
  LangclawApiError,
  readFriendlyError,
} from "../lib/langclaw-api.ts";

test("successful responses reject invalid JSON bodies", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    new Response("not-json", {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  await assert.rejects(
    checkBackendHealth(),
    (error) =>
      error instanceof LangclawApiError &&
      error.message === "Backend returned an invalid JSON response." &&
      error.status === 200,
  );
});

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

test("wallet failures use short actionable messages", () => {
  const cases = [
    [
      { code: 4001, message: "User rejected the request." },
      "You rejected the wallet request.",
    ],
    [
      new Error("Wallet session expired."),
      "Your wallet session expired. Reconnect and approve your wallet.",
    ],
    [
      new Error("Connector not connected"),
      "Reconnect your wallet and try again.",
    ],
    [
      new Error("Chain not configured for connector"),
      "Switch your wallet to the selected network and try again.",
    ],
  ];

  for (const [error, expected] of cases) {
    assert.equal(readFriendlyError(error, "Request failed."), expected);
  }
});

test("transaction failures normalize common wallet and RPC errors", () => {
  const cases = [
    [
      new Error("insufficient funds for gas * price + value"),
      "Your wallet does not have enough funds for this transaction and network fee.",
    ],
    [
      new Error("execution reverted: vault paused"),
      "The transaction reverted. Check the amount, allowance, and contract state.",
    ],
    [
      new Error("Transaction replaced and cancelled"),
      "The transaction was replaced or cancelled in your wallet. Check its latest status.",
    ],
    [
      new Error("nonce too low"),
      "Your wallet transaction state is out of date. Refresh and try again.",
    ],
    [
      new Error("failed to estimate gas fees"),
      "The network could not estimate or cover the transaction fee. Refresh and try again.",
    ],
    [
      new Error("RPC Request failed: timeout"),
      "The wallet network is unavailable. Check your connection and try again.",
    ],
  ];

  for (const [error, expected] of cases) {
    assert.equal(readFriendlyError(error, "Transaction failed."), expected);
  }
});

test("friendly errors read provider fields and preserve specific backend messages", () => {
  assert.equal(
    readFriendlyError(
      {
        message: "Contract call failed.",
        shortMessage: "The contract function reverted.",
      },
      "Transaction failed.",
    ),
    "The transaction reverted. Check the amount, allowance, and contract state.",
  );
  assert.equal(
    readFriendlyError(
      new LangclawApiError("Withdrawal amount exceeds authorization.", 400),
      "Request failed.",
    ),
    "Withdrawal amount exceeds authorization.",
  );
});

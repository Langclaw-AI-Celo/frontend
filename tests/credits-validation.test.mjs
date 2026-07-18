import assert from "node:assert/strict";
import test from "node:test";

import {
  isBytes32,
  parsePositiveBillingAmount,
  validateDepositTransaction,
  validateWithdrawalTransaction,
} from "../lib/credits-validation.ts";

test("parses positive billing amounts with the configured decimals", () => {
  assert.equal(parsePositiveBillingAmount(" 1.25 ", 6), 1_250_000n);
  assert.equal(parsePositiveBillingAmount("0.000001", 6), 1n);
  assert.equal(parsePositiveBillingAmount("", 6), null);
  assert.equal(parsePositiveBillingAmount("0", 6), null);
  assert.equal(parsePositiveBillingAmount("-1", 6), null);
  assert.equal(parsePositiveBillingAmount("0.0000001", 6), null);
  assert.equal(parsePositiveBillingAmount("not-a-number", 6), null);
});

test("recognizes exact bytes32 references", () => {
  assert.equal(isBytes32(`0x${"a".repeat(64)}`), true);
  assert.equal(isBytes32(`0x${"A".repeat(64)}`), true);
  assert.equal(isBytes32(`0x${"a".repeat(63)}`), false);
  assert.equal(isBytes32(`0x${"g".repeat(64)}`), false);
});

test("deposit validation keeps the existing guard order", () => {
  const valid = {
    amount: 100n,
    billingSymbol: "USDT",
    hasInsufficientWalletBalance: false,
    reference: `0x${"1".repeat(64)}`,
    vaultAddress: "0x1111111111111111111111111111111111111111",
  };

  assert.equal(
    validateDepositTransaction({ ...valid, vaultAddress: undefined }),
    "Load vault address first.",
  );
  assert.equal(
    validateDepositTransaction({ ...valid, amount: null }),
    "Enter a valid USDT amount greater than zero.",
  );
  assert.equal(
    validateDepositTransaction({
      ...valid,
      hasInsufficientWalletBalance: true,
    }),
    "Insufficient USDT balance in your wallet for this deposit.",
  );
  assert.equal(
    validateDepositTransaction({ ...valid, reference: " " }),
    "Deposit reference is required.",
  );
  assert.equal(
    validateDepositTransaction({ ...valid, reference: "0x1234" }),
    "Deposit reference must be a bytes32 hex string.",
  );
  assert.equal(validateDepositTransaction(valid), null);
});

test("withdrawal validation keeps preparation and onchain guards separate", () => {
  const valid = {
    amount: 100n,
    isAuthorized: true,
    isVaultPaused: false,
    vaultAddress: "0x1111111111111111111111111111111111111111",
  };

  assert.equal(
    validateWithdrawalTransaction({ ...valid, vaultAddress: undefined }),
    "Load vault address first.",
  );
  assert.equal(
    validateWithdrawalTransaction({ ...valid, amount: null }),
    "Enter a valid withdrawal amount greater than zero.",
  );
  assert.equal(
    validateWithdrawalTransaction({ ...valid, isVaultPaused: true }),
    "Vault is paused.",
  );
  assert.equal(
    validateWithdrawalTransaction({ ...valid, isAuthorized: false }),
    "Backend has not authorized enough withdrawal allowance yet.",
  );
  assert.equal(validateWithdrawalTransaction(valid), null);
});

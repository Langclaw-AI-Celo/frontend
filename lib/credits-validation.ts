import { parseUnits } from "viem";

type DepositTransactionValidation = {
  amount: bigint | null;
  billingSymbol: string;
  hasInsufficientWalletBalance: boolean;
  reference: string;
  vaultAddress?: string;
};

type WithdrawalTransactionValidation = {
  amount: bigint | null;
  isAuthorized: boolean;
  isVaultPaused: boolean;
  vaultAddress?: string;
};

export function parsePositiveBillingAmount(value: string, decimals: number) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = parseUnits(trimmed, decimals);

    return parsed > BigInt(0) ? parsed : null;
  } catch {
    return null;
  }
}

export function isBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

export function validateDepositTransaction({
  amount,
  billingSymbol,
  hasInsufficientWalletBalance,
  reference,
  vaultAddress,
}: DepositTransactionValidation) {
  if (!vaultAddress) {
    return "Load vault address first.";
  }

  if (!amount) {
    return `Enter a valid ${billingSymbol} amount greater than zero.`;
  }

  if (hasInsufficientWalletBalance) {
    return `Insufficient ${billingSymbol} balance in your wallet for this deposit.`;
  }

  if (!reference.trim()) {
    return "Deposit reference is required.";
  }

  if (!isBytes32(reference)) {
    return "Deposit reference must be a bytes32 hex string.";
  }

  return null;
}

export function validateWithdrawalTransaction({
  amount,
  isAuthorized,
  isVaultPaused,
  vaultAddress,
}: WithdrawalTransactionValidation) {
  if (!vaultAddress) {
    return "Load vault address first.";
  }

  if (!amount) {
    return "Enter a valid withdrawal amount greater than zero.";
  }

  if (isVaultPaused) {
    return "Vault is paused.";
  }

  if (!isAuthorized) {
    return "Backend has not authorized enough withdrawal allowance yet.";
  }

  return null;
}

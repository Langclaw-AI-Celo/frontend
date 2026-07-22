import { bytesToHex, keccak256, type Hex } from "viem";

export type DepositClaim = {
  claimSecret: Hex;
  reference: Hex;
};

const depositClaimByteLength = 32;

export function createDepositClaim(bytes = createSecureClaimBytes()): DepositClaim {
  if (!(bytes instanceof Uint8Array) || bytes.length !== depositClaimByteLength) {
    throw new Error("Deposit claims require exactly 32 random bytes.");
  }

  const claimSecret = bytesToHex(bytes);

  return {
    claimSecret,
    reference: keccak256(claimSecret),
  };
}

function createSecureClaimBytes() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random generation is unavailable.");
  }

  return globalThis.crypto.getRandomValues(
    new Uint8Array(depositClaimByteLength),
  );
}

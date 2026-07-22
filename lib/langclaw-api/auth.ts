import {
  LangclawApiError,
  isEvmAddressResponse,
  isNonEmptyResponseString,
  isPositiveResponseInteger,
  isWalletSession,
  postJson,
  readJsonResponse,
} from "./core.ts";

import type { WalletAuth, WalletAuthPurpose, WalletChallenge } from "./types.ts";

const MAX_WALLET_CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;

export async function requestWalletChallenge(input: {
  address: string;
  chainId?: number;
  purpose?: WalletAuthPurpose;
}) {
  const response = await postJson("/api/wallet/challenge", input);
  const payload = await readJsonResponse<{
    challenge?: WalletChallenge;
    configured?: unknown;
    error?: string;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (payload.configured !== true) {
    throw new LangclawApiError(
      "Backend returned invalid wallet challenge data.",
      500,
    );
  }

  if (!payload.challenge) {
    throw new LangclawApiError("Wallet challenge was not returned.", 500);
  }

  if (
    !isWalletChallenge(payload.challenge) ||
    payload.challenge.address.toLowerCase() !== input.address.trim().toLowerCase() ||
    (input.chainId !== undefined && payload.challenge.chainId !== input.chainId) ||
    payload.challenge.purpose !== (input.purpose ?? "session")
  ) {
    throw new LangclawApiError(
      "Backend returned invalid wallet challenge data.",
      500,
    );
  }

  return payload.challenge;
}

function isWalletChallenge(value: unknown): value is WalletChallenge {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const challenge = value as Record<string, unknown>;
  const issuedAt =
    typeof challenge.issuedAt === "string"
      ? Date.parse(challenge.issuedAt)
      : Number.NaN;
  const expiresAt =
    typeof challenge.expiresAt === "string"
      ? Date.parse(challenge.expiresAt)
      : Number.NaN;

  const hasValidFields =
    isEvmAddressResponse(challenge.address) &&
    isPositiveResponseInteger(challenge.chainId) &&
    isNonEmptyResponseString(challenge.domain) &&
    Number.isFinite(issuedAt) &&
    Number.isFinite(expiresAt) &&
    issuedAt <= Date.now() + 5 * 60 * 1000 &&
    expiresAt > issuedAt &&
    expiresAt - issuedAt <= MAX_WALLET_CHALLENGE_LIFETIME_MS &&
    expiresAt > Date.now() &&
    isNonEmptyResponseString(challenge.message) &&
    isNonEmptyResponseString(challenge.nonce) &&
    (challenge.purpose === "api-key:create" ||
      challenge.purpose === "session") &&
    isNonEmptyResponseString(challenge.uri);

  if (!hasValidFields) {
    return false;
  }

  return hasConsistentWalletChallengeMessage(challenge as WalletChallenge);
}

function hasConsistentWalletChallengeMessage(challenge: WalletChallenge) {
  const lines = challenge.message.split("\n");

  return (
    lines.length === 12 &&
    lines[0] ===
      `${challenge.domain} wants you to sign in with your Ethereum account:` &&
    lines[1]?.toLowerCase() === challenge.address.toLowerCase() &&
    lines[2] === "" &&
    lines[3] === "Login to Langclaw" &&
    lines[4] === "" &&
    lines[5] === `URI: ${challenge.uri}` &&
    lines[6] === "Version: 1" &&
    lines[7] === `Chain ID: ${challenge.chainId}` &&
    lines[8] === `Nonce: ${challenge.nonce}` &&
    lines[9] === `Issued At: ${challenge.issuedAt}` &&
    lines[10] === `Expiration Time: ${challenge.expiresAt}` &&
    lines[11] === `Purpose: ${challenge.purpose}`
  );
}

export async function createWalletSession(wallet: WalletAuth) {
  const response = await postJson("/api/wallet/session", { wallet });
  const payload = await readJsonResponse<{
    configured?: unknown;
    error?: string;
    wallet?: WalletAuth;
  }>(response);

  if (payload.error) {
    throw new LangclawApiError(payload.error, response.status);
  }

  if (payload.configured !== true) {
    throw new LangclawApiError(
      "Backend returned invalid wallet session data.",
      500,
    );
  }

  if (!payload.wallet?.sessionToken) {
    throw new LangclawApiError("Wallet session was not returned.", 500);
  }

  if (
    !isWalletSession(payload.wallet) ||
    payload.wallet.address.toLowerCase() !== wallet.address.trim().toLowerCase()
  ) {
    throw new LangclawApiError(
      "Backend returned invalid wallet session data.",
      500,
    );
  }

  return payload.wallet;
}

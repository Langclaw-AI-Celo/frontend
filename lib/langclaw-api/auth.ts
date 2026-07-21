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

  return (
    isEvmAddressResponse(challenge.address) &&
    isPositiveResponseInteger(challenge.chainId) &&
    isNonEmptyResponseString(challenge.domain) &&
    Number.isFinite(issuedAt) &&
    Number.isFinite(expiresAt) &&
    issuedAt <= Date.now() + 5 * 60 * 1000 &&
    expiresAt > issuedAt &&
    expiresAt > Date.now() &&
    isNonEmptyResponseString(challenge.message) &&
    isNonEmptyResponseString(challenge.nonce) &&
    (challenge.purpose === "api-key:create" ||
      challenge.purpose === "session") &&
    isNonEmptyResponseString(challenge.uri)
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

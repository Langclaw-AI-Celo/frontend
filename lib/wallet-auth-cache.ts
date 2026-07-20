import type { WalletAuth } from "./langclaw-api.ts";

const SESSION_REFRESH_MARGIN_MS = 60 * 1000;
const MAX_SESSION_LIFETIME_MS = 13 * 60 * 60 * 1000;
const MAX_SESSION_TOKEN_CHARACTERS = 4_096;

export function parseCachedWalletAuth(
  raw: string | null,
  address: string,
  now = Date.now(),
) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WalletAuth>;

    if (
      typeof parsed.address !== "string" ||
      typeof parsed.sessionExpiresAt !== "string" ||
      typeof parsed.sessionToken !== "string" ||
      !isEvmAddress(parsed.address) ||
      !isEvmAddress(address) ||
      !isUsableSessionToken(parsed.sessionToken) ||
      !isOptionalNonEmptyString(parsed.message) ||
      !isOptionalNonEmptyString(parsed.signature)
    ) {
      return null;
    }

    if (parsed.address.toLowerCase() !== address.toLowerCase()) {
      return null;
    }

    const expiresAt = new Date(parsed.sessionExpiresAt).getTime();

    if (
      Number.isNaN(expiresAt) ||
      expiresAt - now <= SESSION_REFRESH_MARGIN_MS ||
      expiresAt - now > MAX_SESSION_LIFETIME_MS
    ) {
      return null;
    }

    return parsed as WalletAuth;
  } catch {
    return null;
  }
}

function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isUsableSessionToken(value: string) {
  return (
    value.length > 0 &&
    value.length <= MAX_SESSION_TOKEN_CHARACTERS &&
    !/\s/.test(value)
  );
}

function isOptionalNonEmptyString(value: unknown) {
  return value === undefined || (typeof value === "string" && Boolean(value.trim()));
}

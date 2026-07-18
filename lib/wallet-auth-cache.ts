import type { WalletAuth } from "./langclaw-api.ts";

const SESSION_REFRESH_MARGIN_MS = 60 * 1000;

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
      !isUsableSessionToken(parsed.sessionToken)
    ) {
      return null;
    }

    if (parsed.address.toLowerCase() !== address.toLowerCase()) {
      return null;
    }

    const expiresAt = new Date(parsed.sessionExpiresAt).getTime();

    if (
      Number.isNaN(expiresAt) ||
      expiresAt - now <= SESSION_REFRESH_MARGIN_MS
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
  return value.length > 0 && !/\s/.test(value);
}

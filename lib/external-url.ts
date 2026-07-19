export function safeExternalUrl(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const candidate = value.trim();

  if (!candidate) {
    return undefined;
  }

  try {
    const url = new URL(candidate);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return undefined;
    }

    return candidate;
  } catch {
    return undefined;
  }
}

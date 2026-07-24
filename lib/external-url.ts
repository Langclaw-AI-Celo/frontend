export function safeExternalUrl(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const candidate = value.trim();

  if (!candidate || /[\u0000-\u001f\u007f]/.test(candidate)) {
    return undefined;
  }

  try {
    const url = new URL(candidate);
    const isLocalHttp =
      url.protocol === "http:" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]");

    if (
      (url.protocol !== "https:" && !isLocalHttp) ||
      url.username ||
      url.password ||
      url.port === "0"
    ) {
      return undefined;
    }

    return candidate;
  } catch {
    return undefined;
  }
}

export function externalUrlHostname(value: unknown) {
  const safeUrl = safeExternalUrl(value);

  return safeUrl ? new URL(safeUrl).hostname : undefined;
}

type ClipboardWriter = {
  writeText: (value: string) => Promise<void>;
};

export async function tryCopyText(
  value: string,
  clipboard: ClipboardWriter | undefined = readClipboard(),
) {
  if (!clipboard) {
    return false;
  }

  try {
    await clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function readClipboard(): ClipboardWriter | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator.clipboard;
}

type BrowserStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;
type StorageAccess = () => BrowserStorage;

export function readStorageItem(accessStorage: StorageAccess, key: string) {
  try {
    return accessStorage().getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(
  accessStorage: StorageAccess,
  key: string,
  value: string,
) {
  try {
    accessStorage().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageItem(accessStorage: StorageAccess, key: string) {
  try {
    accessStorage().removeItem(key);
    return true;
  } catch {
    return false;
  }
}

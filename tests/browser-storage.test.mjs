import assert from "node:assert/strict";
import test from "node:test";

import {
  readStorageItem,
  removeStorageItem,
  writeStorageItem,
} from "../lib/browser-storage.ts";

test("browser storage helpers preserve successful reads and writes", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
  const accessStorage = () => storage;

  assert.equal(writeStorageItem(accessStorage, "session", "token"), true);
  assert.equal(readStorageItem(accessStorage, "session"), "token");
  assert.equal(removeStorageItem(accessStorage, "session"), true);
  assert.equal(readStorageItem(accessStorage, "session"), null);
});

test("browser storage helpers contain unavailable storage errors", () => {
  const unavailableStorage = () => {
    throw new DOMException("Storage is disabled", "SecurityError");
  };

  assert.equal(readStorageItem(unavailableStorage, "session"), null);
  assert.equal(writeStorageItem(unavailableStorage, "session", "token"), false);
  assert.equal(removeStorageItem(unavailableStorage, "session"), false);
});

test("browser storage helpers contain operation failures", () => {
  const storage = {
    getItem: () => {
      throw new DOMException("Storage is disabled", "SecurityError");
    },
    removeItem: () => {
      throw new DOMException("Storage is disabled", "SecurityError");
    },
    setItem: () => {
      throw new DOMException("Storage is full", "QuotaExceededError");
    },
  };
  const accessStorage = () => storage;

  assert.equal(readStorageItem(accessStorage, "session"), null);
  assert.equal(writeStorageItem(accessStorage, "session", "token"), false);
  assert.equal(removeStorageItem(accessStorage, "session"), false);
});

/**
 * Minimal promise wrapper around IndexedDB.
 *
 * Why hand-rolled: the whole persistence layer needs three object stores and
 * no querying, so a dependency would add weight without value. Everything is
 * keyed by string so the same code shape works for the virtual filesystem,
 * directory handles, and key/value app state.
 */
const DB_NAME = "webeazy";
const DB_VERSION = 1;

export const STORE_FILES = "files";
export const STORE_HANDLES = "handles";
export const STORE_KV = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable in this environment"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const store of [STORE_FILES, STORE_HANDLES, STORE_KV]) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    });
  }
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode);
        const request = run(transaction.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
      }),
  );
}

export const idb = {
  get<T>(store: string, key: string) {
    return tx<T | undefined>(store, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
  },
  put<T>(store: string, key: string, value: T) {
    return tx<IDBValidKey>(store, "readwrite", (s) => s.put(value as unknown, key));
  },
  del(store: string, key: string) {
    return tx<undefined>(store, "readwrite", (s) => s.delete(key) as IDBRequest<undefined>);
  },
  keys(store: string) {
    return tx<IDBValidKey[]>(store, "readonly", (s) => s.getAllKeys());
  },
};

export interface ClientIdStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const CLIENT_ID_STORAGE_KEY = 'pulse-fx-client-id';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function loadClientId(storage: ClientIdStorage | null, generate: () => string = () => crypto.randomUUID()): string {
  const stored = storage?.getItem(CLIENT_ID_STORAGE_KEY) ?? null;
  if (stored !== null && UUID_V4_PATTERN.test(stored)) return stored;
  const created = generate();
  storage?.setItem(CLIENT_ID_STORAGE_KEY, created);
  return created;
}

import { CLIENT_ID_STORAGE_KEY, loadClientId, type ClientIdStorage } from '../../../src/lib/client-id';

const STORED_ID = '3f2b8c1e-9d4a-4b7e-8f21-6c5d4e3a2b10';
const GENERATED_ID = '7a1c2d3e-4f5a-4b6c-9d8e-0f1a2b3c4d5e';

class MemoryStorage implements ClientIdStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function storageWith(value: string | null): MemoryStorage {
  const storage = new MemoryStorage();
  if (value !== null) storage.setItem(CLIENT_ID_STORAGE_KEY, value);
  return storage;
}

describe('loadClientId', () => {
  it('should reuse the client id already stored in the browser', () => {
    const generate = jest.fn(() => GENERATED_ID);

    expect(loadClientId(storageWith(STORED_ID), generate)).toBe(STORED_ID);
    expect(generate).not.toHaveBeenCalled();
  });

  it('should generate and store a new client id on the first visit', () => {
    const storage = storageWith(null);

    expect(loadClientId(storage, () => GENERATED_ID)).toBe(GENERATED_ID);
    expect(storage.getItem(CLIENT_ID_STORAGE_KEY)).toBe(GENERATED_ID);
  });

  it('should replace a stored value that is not a UUID v4', () => {
    const storage = storageWith('browser-1');

    expect(loadClientId(storage, () => GENERATED_ID)).toBe(GENERATED_ID);
    expect(storage.getItem(CLIENT_ID_STORAGE_KEY)).toBe(GENERATED_ID);
  });

  it('should still return a client id when the browser has no storage', () => {
    expect(loadClientId(null, () => GENERATED_ID)).toBe(GENERATED_ID);
  });
});

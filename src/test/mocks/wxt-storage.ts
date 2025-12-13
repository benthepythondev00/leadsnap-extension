// Mock for wxt/storage
const mockStorage = new Map<string, unknown>();

export const storage = {
  defineItem: <T>(key: string, options?: { fallback: T }) => ({
    getValue: async () => mockStorage.get(key) ?? options?.fallback,
    setValue: async (value: T) => {
      mockStorage.set(key, value);
    },
    watch: () => {},
    removeValue: async () => {
      mockStorage.delete(key);
    },
  }),
};

// Helper functions for tests
export function clearMockStorage() {
  mockStorage.clear();
}

export function setMockStorageValue(key: string, value: unknown) {
  mockStorage.set(key, value);
}

export function getMockStorageValue(key: string) {
  return mockStorage.get(key);
}

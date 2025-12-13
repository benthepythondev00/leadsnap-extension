// Test setup file
// The wxt/storage mock is handled via vitest alias in vitest.config.ts

// Export helpers from the mock for test usage
export {
  clearMockStorage,
  setMockStorageValue,
  getMockStorageValue,
} from './mocks/wxt-storage';

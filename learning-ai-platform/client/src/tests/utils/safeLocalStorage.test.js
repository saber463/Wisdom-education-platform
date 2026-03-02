import { describe, it, expect, vi } from 'vitest';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

describe('safeLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should set item successfully', () => {
    safeLocalStorage.setItem('testKey', 'testValue');
    expect(localStorage.getItem('testKey')).toBe('testValue');
  });

  it('should get item successfully', () => {
    localStorage.setItem('testKey', 'testValue');
    const value = safeLocalStorage.getItem('testKey');
    expect(value).toBe('testValue');
  });

  it('should remove item successfully', () => {
    localStorage.setItem('testKey', 'testValue');
    safeLocalStorage.removeItem('testKey');
    expect(localStorage.getItem('testKey')).toBeNull();
  });

  it('should clear all items', () => {
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');
    safeLocalStorage.clear();
    expect(localStorage.getItem('key1')).toBeNull();
    expect(localStorage.getItem('key2')).toBeNull();
  });

  it('should handle errors gracefully', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('Storage quota exceeded');
    };

    expect(() => {
      safeLocalStorage.setItem('testKey', 'testValue');
    }).not.toThrow();

    localStorage.setItem = originalSetItem;
  });
});

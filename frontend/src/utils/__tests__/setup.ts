/**
 * Vitest测试环境设置
 */

import { vi } from 'vitest'

// 模拟浏览器环境的performance API
if (typeof performance === 'undefined') {
  (globalThis as any).performance = {
    now: () => Date.now()
  };
}

// 模拟IndexedDB（用于离线模式测试）
if (typeof indexedDB === 'undefined') {
  const stores: Map<string, Map<string, any>> = new Map()
  
  class MockObjectStoreNames extends Set<string> {
    contains(name: string): boolean {
      return this.has(name)
    }
  }
  
  class MockIDBDatabase {
    objectStoreNames = new MockObjectStoreNames()
    
    createObjectStore(name: string) {
      const store = new Map()
      stores.set(name, store)
      this.objectStoreNames.add(name)
      return {
        createIndex: () => ({})
      }
    }
    
    transaction(storeNames: string[], mode: string) {
      return {
        objectStore: (name: string) => {
          const store = stores.get(name) || new Map()
          return {
            put: (data: any) => {
              store.set(data.key, data)
              const req: Record<string, unknown> = { result: undefined }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            get: (key: string) => {
              const req: Record<string, unknown> = { result: store.get(key) }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            delete: (key: string) => {
              store.delete(key)
              const req: Record<string, unknown> = { result: undefined }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            clear: () => {
              store.clear()
              const req: Record<string, unknown> = { result: undefined }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            getAll: () => {
              const req: Record<string, unknown> = { result: Array.from(store.values()) }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            getAllKeys: () => {
              const req: Record<string, unknown> = { result: Array.from(store.keys()) }
              Object.defineProperty(req, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
              Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
              return req
            },
            index: () => ({
              openCursor: () => {
                const items = Array.from(store.values())
                let currentIndex = 0
                const req: Record<string, unknown> = {}
                const runOnSuccess = (fn: (ev: { target: unknown }) => void): void => {
                  setTimeout(() => {
                    const cursor = {
                      value: items[currentIndex],
                      continue: () => {
                        currentIndex++
                        if (currentIndex < items.length) {
                          fn({ target: cursor })
                        } else {
                          fn({ target: { result: null } })
                        }
                      }
                    }
                    if (items.length > 0) {
                      fn({ target: cursor })
                    } else {
                      fn({ target: { result: null } })
                    }
                  }, 0)
                }
                Object.defineProperty(req, 'onsuccess', { set: runOnSuccess, configurable: true })
                Object.defineProperty(req, 'onerror', { set: () => {}, configurable: true })
                return req
              }
            })
          }
        }
      }
    }
  }
  
  (globalThis as any).indexedDB = {
    open: (_name: string, _version: number) => {
      const openReq: Record<string, unknown> = { result: new MockIDBDatabase() }
      Object.defineProperty(openReq, 'onsuccess', { set: (fn: () => void) => setTimeout(() => fn(), 0), configurable: true })
      Object.defineProperty(openReq, 'onerror', { set: () => {}, configurable: true })
      Object.defineProperty(openReq, 'onupgradeneeded', {
        set: (fn: (ev: { target: { result: MockIDBDatabase } }) => void) => setTimeout(() => fn({ target: { result: new MockIDBDatabase() } }), 0),
        configurable: true
      })
      return openReq
    }
  }
}

// 模拟console方法（避免测试输出过多）
const originalConsole = { ...console };

beforeAll(() => {
  // 可以选择性地静默某些console输出
  // console.log = vi.fn();
  // console.warn = vi.fn();
});

afterAll(() => {
  // 恢复console
  Object.assign(console, originalConsole);
});

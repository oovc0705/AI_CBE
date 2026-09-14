import { defaultConfig } from 'antd/lib/theme/internal';

defaultConfig.hashed = false;

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => store[key] ?? null),
  setItem: jest.fn((key: string, value: unknown) => {
    store[key] = String(value);
  }),
  removeItem: jest.fn((key: string) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    Object.keys(store).forEach((key) => {
      delete store[key];
    });
  }),
};

globalThis.localStorage = localStorageMock as unknown as Storage;

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

class MockWorker {
  url: string;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(msg: unknown) {
    if (typeof this.onmessage === 'function') {
      this.onmessage({ data: msg });
    }
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

globalThis.Worker = MockWorker as unknown as typeof Worker;

interface MockPort {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage: (msg: unknown) => void;
}

if (typeof globalThis.MessageChannel === 'undefined') {
  class PolyMessageChannel {
    port1: MockPort;
    port2: MockPort;

    constructor() {
      const channel = this;

      this.port1 = {
        onmessage: null,
        postMessage(msg: unknown) {
          setTimeout(() => {
            if (typeof channel.port2.onmessage === 'function') {
              channel.port2.onmessage({ data: msg });
            }
          }, 0);
        },
      };

      this.port2 = {
        onmessage: null,
        postMessage(msg: unknown) {
          setTimeout(() => {
            if (typeof channel.port1.onmessage === 'function') {
              channel.port1.onmessage({ data: msg });
            }
          }, 0);
        },
      };
    }
  }

  globalThis.MessageChannel =
    PolyMessageChannel as unknown as typeof MessageChannel;
}

if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

const originalError = console.error;
Object.defineProperty(window.console, 'error', {
  writable: true,
  configurable: true,
  value: (...rest: unknown[]) => {
    const logStr = rest.join('');
    if (
      logStr.includes(
        'Warning: An update to %s inside a test was not wrapped in act(...)',
      )
    ) {
      return;
    }
    originalError(...rest);
  },
});

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

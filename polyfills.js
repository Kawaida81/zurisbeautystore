// Polyfill global objects for server-side code
if (typeof globalThis === 'undefined') {
  global.globalThis = global;
}

if (typeof window === 'undefined') {
  global.window = global;
}

if (typeof self === 'undefined') {
  global.self = global;
}

if (typeof document === 'undefined') {
  global.document = {
    createElement: () => ({}),
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: {},
    head: {},
    body: {},
  };
}

if (typeof navigator === 'undefined') {
  global.navigator = {
    userAgent: '',
    platform: '',
  };
}

if (typeof location === 'undefined') {
  global.location = {
    protocol: 'https:',
    hostname: 'localhost',
    port: '',
    href: 'https://localhost',
    origin: 'https://localhost',
    pathname: '/',
    search: '',
    hash: '',
  };
}

module.exports = global; 
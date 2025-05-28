import { TextDecoder, TextEncoder } from "util";

// Add TextEncoder and TextDecoder to the global scope
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Increase timeout for WebAssembly initialization
jest.setTimeout(10000);

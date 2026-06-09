declare var global: typeof globalThis & {
  fetch: jest.Mock<any, any>;
};

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      JWT_SECRET: 'test-secret',
    },
    globals: true,
    pool: 'forks',
    singleFork: true,
  },
});

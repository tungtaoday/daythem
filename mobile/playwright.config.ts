import { defineConfig } from '@playwright/test';

// E2E cho web build (react-native-web). Chạy expo web ở chế độ E2E (EXPO_PUBLIC_E2E=1)
// → App render E2EGallery (các component design-system) để Playwright kiểm tra.
const PORT = 19100;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    actionTimeout: 20_000,
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    env: { EXPO_PUBLIC_E2E: '1', BROWSER: 'none', CI: '1' },
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});

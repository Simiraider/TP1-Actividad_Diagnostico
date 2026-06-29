import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4321',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npx cross-env PUBLIC_SUPABASE_URL=https://dummy.supabase.co PUBLIC_SUPABASE_ANON_KEY=dummy npm run dev',
    port: 4321,
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  },
});

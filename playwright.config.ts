import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration — screenshots and traces go to logs/<TASK_SLUG>/e2e/
 * Set TASK_SLUG env var (from start-task) to scope output per task.
 * Set BASE_URL to override the default dev server URL.
 *
 * Run:
 *   npm run e2e                         # headless
 *   npm run e2e:ui                      # interactive UI mode
 *   TASK_SLUG=fix-foo npm run e2e       # task-scoped output
 */

const taskSlug = process.env.TASK_SLUG ?? "default";
const outputDir = `logs/${taskSlug}/e2e`;

export default defineConfig({
  testDir: "./e2e",
  outputDir,
  fullyParallel: false,
  retries: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: `${outputDir}/report`, open: "never" }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    screenshot: "on",           // always capture screenshots
    trace: "on-first-retry",    // capture trace on retry
    video: "retain-on-failure", // video only on failure
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start the dev server automatically when running e2e locally.
  // Comment out if you prefer to start the server manually.
  webServer: {
    command: `npm run dev -- --port ${process.env.E2E_PORT ?? 3000}`,
    url: process.env.BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});

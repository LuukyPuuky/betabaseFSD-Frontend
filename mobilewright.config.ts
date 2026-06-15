import { defineConfig } from "mobilewright";

export default defineConfig({
  platform: "android",
  bundleId: "com.luuky.betabase",
  installApps: "./android/app/build/outputs/apk/debug/app-debug.apk",
  deviceName: /RFCRB13QY5Y/,
  timeout: 30_000,
  retries: 1,
  reporter: "html",
  viewTree: "on-failure",
  testDir: "./e2e",
});

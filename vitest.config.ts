import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["src/**/*.test.ts"],
      environment: "node",
      // Each test file runs in its own worker thread with a fresh module graph, and files and
      // tests run in random order, so hidden dependencies on shared state or ordering fail fast.
      pool: "threads",
      isolate: true,
      fileParallelism: true,
      sequence: { shuffle: true },
      restoreMocks: true,
      // Tests slower than this are highlighted in the console output. The full scan of the
      // diagram in src/geometry.test.ts is the slowest test and takes about half a second.
      slowTestThreshold: 1000,
      // The JSON results feed `npm run test:durations`. On GitHub Actions, failures are also
      // annotated on the pull request and a JUnit report is written for the uploaded artifact.
      reporters: process.env.GITHUB_ACTIONS
        ? ["default", "github-actions", "json", "junit"]
        : ["default", "json"],
      outputFile: {
        json: "reports/test-results.json",
        junit: "reports/junit.xml",
      },
      coverage: {
        provider: "v8",
        include: ["src/**/*.ts"],
        // main.ts queries the DOM as soon as it loads, so it cannot run under Node and is
        // covered by the manual checklist instead.
        exclude: ["src/main.ts", "src/**/*.test.ts"],
        reporter: ["text", "html", "json-summary"],
        reportsDirectory: "coverage",
        reportOnFailure: true,
        // The pure modules are small and fully covered; any new branch or function in them
        // needs a test.
        thresholds: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  }),
);

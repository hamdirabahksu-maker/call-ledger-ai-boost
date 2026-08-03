// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Lovable MCP plugin asserts path containment with mixed separators and crashes on Windows.
// Keep day-to-day local dev free of it; opt in with LOVABLE_MCP=1 inside Lovable if needed.
const useLovableMcp = process.env.LOVABLE_MCP === "1";

export default defineConfig({
  plugins: useLovableMcp ? [mcpPlugin()] : [],
  // Prefer 8080; if taken Vite may pick 8081 — then update APP_URL / Auth redirects to match.
  vite: {
    server: {
      port: 8080,
      strictPort: false,
    },
  },
  // Default Nitro preset is cloudflare-module (best self-host match). For Vercel/Node:
  // nitro: { preset: "vercel" } or nitro: { preset: "node-server" }
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

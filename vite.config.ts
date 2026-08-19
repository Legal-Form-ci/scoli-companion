import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "logo-scoly.png", "og-image.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/duxbzpsezdhvhprwjwmk\.supabase\.co\/rest\/v1\/products/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "products-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/duxbzpsezdhvhprwjwmk\.supabase\.co\/storage/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
        navigateFallbackDenylist: [/^\/~oauth/],
      },
      manifest: {
        name: "Scoly — Fournitures scolaires",
        short_name: "Scoly",
        description: "Fournitures scolaires et bureautiques en Côte d'Ivoire",
        theme_color: "#1a2744",
        background_color: "#faf8f5",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png" },
          { src: "/logo-scoly.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    // Radix and the application must share the exact same React dispatcher.
    // This also protects HMR when Vite rebuilds its optimized dependency graph.
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
    ],
  },
}));

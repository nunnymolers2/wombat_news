import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    outDir: "../backend/public",
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "wombat reader",
        short_name: "wombat",
        start_url: "/",
        display: "standalone",
        icons: [
          {
            src: "pwa_192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa_512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa_512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});

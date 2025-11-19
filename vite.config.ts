import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // ให้ Vite อ่าน env variable ของ Pages
    "import.meta.env.VITE_API_BASE": JSON.stringify(process.env.VITE_API_BASE || "https://banana-ai-farm-production.up.railway.app")
  },
}));

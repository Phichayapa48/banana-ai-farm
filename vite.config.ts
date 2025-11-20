export default defineConfig(({ mode }) => ({
  base: "/", // สำคัญมาก
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_API_BASE": JSON.stringify(
      process.env.VITE_API_BASE ||
        "https://banana-ai-farm-production.up.railway.app"
    ),
  },
}));

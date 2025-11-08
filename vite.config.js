import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Replace YOUR_GITHUB_USERNAME and REPO with your actual values.
const base = "/survivor-dashboard/";

export default defineConfig({
  plugins: [react()],
  base,
});
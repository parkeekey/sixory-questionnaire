import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// On GitHub Actions the base becomes /sixory-questionnaire/
// Locally it stays / so the dev server works without any extra config
var isGitHubPages = process.env.GITHUB_ACTIONS === "true";
export default defineConfig({
    plugins: [react()],
    base: isGitHubPages ? "/sixory-questionnaire/" : "/"
});

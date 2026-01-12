import * as path from "path";
import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// In development: src/server -> ../../.. -> payflow-example/.env.local
// In production (Railway): env vars are set via dashboard, .env.local is optional
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") }); // Try alternative path
dotenv.config(); // Also try default .env

import { apiRouter } from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: log env vars on startup
console.log("\n📋 Environment Configuration:");
console.log(`   ORGANIZATION_ID: ${process.env.ORGANIZATION_ID ? "✓ set" : "❌ missing"}`);
console.log(`   MERCHANTS_API_PUBLIC_KEY: ${process.env.MERCHANTS_API_PUBLIC_KEY ? "✓ set" : "❌ missing"}`);
console.log(`   MERCHANTS_API_PRIVATE_KEY: ${process.env.MERCHANTS_API_PRIVATE_KEY ? "✓ set" : "❌ missing"}`);
console.log(`   DESTINATION_ADDRESS: ${process.env.DESTINATION_ADDRESS || "using default"}`);
console.log("");

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api", apiRouter);

// In production, serve static files from the built frontend
if (process.env.NODE_ENV === "production") {
  // When running from dist/server/index.js, static files are at dist/
  const distPath = path.resolve(__dirname, "..");
  app.use(express.static(distPath));
  
  // Handle SPA routing - must come after API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   API available at http://localhost:${PORT}/api`);
});


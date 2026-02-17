import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // User management endpoints (if needed for future features)
  app.post("/api/users", async (req, res) => {
    try {
      const user = req.body;
      const result = await storage.createUser(user);
      res.json(result);
    } catch (error) {
      log(`Error creating user: ${error}`, "routes");
      res.status(400).json({ error: String(error) });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      log(`Error fetching user: ${error}`, "routes");
      res.status(400).json({ error: String(error) });
    }
  });

  // Config endpoint to expose safe client settings
  app.get("/api/config", (_req, res) => {
    res.json({
      aptosNodeUrl: process.env.VITE_APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
      aptosContractAddress: process.env.VITE_APTOS_CONTRACT_ADDRESS || '0x1',
    });
  });

  return httpServer;
}

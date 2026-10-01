import express, { Request, Response } from "express";
import { requireAuth } from "../app";
import { syncInventoryFromFlow, recordUsageInFlow } from "../services/flow-sync.service";

const router = express.Router();

// POST /api/flow-sync/sync
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = await syncInventoryFromFlow(userId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/flow-sync/record-usage
router.post("/record-usage", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sku, weightUsed, notes } = req.body;
    if (!sku || typeof weightUsed !== "number" || weightUsed <= 0) {
      res.status(400).json({ error: "Missing or invalid sku, weightUsed" });
      return;
    }
    await recordUsageInFlow(sku, weightUsed, notes || "");
    res.status(200).json({ success: true, message: "Usage recorded in 3DFlow" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const flowSyncRouter = router;

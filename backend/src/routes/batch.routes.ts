import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { BatchService } from "../services/batch.service";

export const batchRouter = Router();

batchRouter.use(requireAuth);

batchRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await BatchService.getAllBatches(userId);
  res.json(data);
});

batchRouter.post("/", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const data = await BatchService.createBatch(userId, req.body);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

batchRouter.post("/:id/complete", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const result = await BatchService.completeBatch(userId, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

batchRouter.delete("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const result = await BatchService.deleteBatch(userId, req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

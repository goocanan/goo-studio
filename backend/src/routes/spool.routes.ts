import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { SpoolService } from "../services/spool.service";

export const spoolRouter = Router();

spoolRouter.use(requireAuth);

spoolRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await SpoolService.getAllSpools(userId);
  res.json(data);
});

spoolRouter.post("/", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await SpoolService.createSpool(userId, req.body);
  res.json(data);
});

spoolRouter.put("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await SpoolService.updateSpool(userId, req.params.id, req.body);
  res.json(data);
});

spoolRouter.delete("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  await SpoolService.deleteSpool(userId, req.params.id);
  res.json({ success: true });
});

spoolRouter.put("/:id/adjust", async (req, res) => {
  const userId = (req as any).user.id;
  const { amount } = req.body;
  try {
    const data = await SpoolService.adjustWeight(userId, req.params.id, amount);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get("/settings", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await UserService.getSettings(userId);
  res.json(data);
});

userRouter.put("/settings", async (req, res) => {
  const userId = (req as any).user.id;
  const data = await UserService.updateSettings(userId, req.body);
  res.json(data);
});

userRouter.get("/activity", async (req, res) => {
  const userId = (req as any).user.id;
  const logs = await UserService.getActivity(userId);
  res.json(logs);
});

userRouter.post("/activity", async (req, res) => {
  const userId = (req as any).user.id;
  const log = await UserService.addActivity(userId, req.body.message);
  res.json(log);
});

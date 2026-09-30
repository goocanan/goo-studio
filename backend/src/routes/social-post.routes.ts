import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { SocialPostService } from "../services/social-post.service";

export const socialPostRouter = Router();

socialPostRouter.use(requireAuth);

socialPostRouter.get("/project/:projectId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const posts = await SocialPostService.getAllByProject(userId, req.params.projectId);
    res.json(posts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

socialPostRouter.get("/", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const posts = await SocialPostService.getAllByUser(userId);
    res.json(posts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

socialPostRouter.post("/project/:projectId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const post = await SocialPostService.create(userId, req.params.projectId, req.body);
    res.json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

socialPostRouter.put("/project/:projectId/:postId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const post = await SocialPostService.update(userId, req.params.projectId, req.params.postId, req.body);
    res.json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

socialPostRouter.delete("/project/:projectId/:postId", async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await SocialPostService.delete(userId, req.params.projectId, req.params.postId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

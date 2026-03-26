import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ProjectService } from "../services/project.service";

export const projectRouter = Router();

projectRouter.use(requireAuth);

projectRouter.get("/", async (req, res) => {
  const userId = (req as any).user.id;
  const projects = await ProjectService.getAllProjects(userId);
  res.json(projects);
});

projectRouter.post("/", async (req, res) => {
  const userId = (req as any).user.id;
  const project = await ProjectService.createProject(userId, req.body);
  res.json(project);
});

projectRouter.put("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  const project = await ProjectService.updateProject(userId, req.params.id, req.body);
  res.json(project);
});

projectRouter.delete("/:id", async (req, res) => {
  const userId = (req as any).user.id;
  await ProjectService.deleteProject(userId, req.params.id);
  res.json({ success: true });
});

projectRouter.post("/:id/parts", async (req, res) => {
  const userId = (req as any).user.id;
  const part = await ProjectService.addPart(userId, req.params.id, req.body);
  res.json(part);
});

projectRouter.put("/:id/parts/:partId", async (req, res) => {
  const userId = (req as any).user.id;
  const part = await ProjectService.updatePart(userId, req.params.id, req.params.partId, req.body);
  res.json(part);
});

projectRouter.delete("/:id/parts/:partId", async (req, res) => {
  const userId = (req as any).user.id;
  await ProjectService.deletePart(userId, req.params.id, req.params.partId);
  res.json({ success: true });
});

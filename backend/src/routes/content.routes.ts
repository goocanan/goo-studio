import { Router } from "express";
import { requireAuth } from "../app";
import { ContentService } from "../services/content.service";

export const contentRouter = Router();

contentRouter.use(requireAuth);

contentRouter.get("/", async (req: any, res: any, next) => {
  try {
    const contents = await ContentService.getAllContents(req.user.id);
    res.json(contents);
  } catch (error) {
    next(error);
  }
});

contentRouter.post("/", async (req: any, res: any, next) => {
  try {
    const newContent = await ContentService.createContent(req.user.id, req.body);
    res.status(201).json(newContent);
  } catch (error) {
    next(error);
  }
});

contentRouter.put("/:id", async (req: any, res: any, next) => {
  try {
    const updated = await ContentService.updateContent(req.user.id, req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

contentRouter.delete("/:id", async (req: any, res: any, next) => {
  try {
    await ContentService.deleteContent(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

import { db } from "../db";
import { contents, activityLog } from "../db/schema";
import { eq } from "drizzle-orm";

export class ContentService {
  static async getAllContents(userId: string) {
    return await db.select().from(contents).where(eq(contents.userId, userId));
  }

  static async createContent(userId: string, data: any) {
    try {
      const id = `CNT-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const newContent = {
        id,
        userId,
        projectId: data.projectId || null,
        title: data.title || "Untitled Idea",
        description: data.description || "",
        tags: data.tags || "",
        platform: data.platform || "",
        priority: data.priority || "medium",
        status: data.status || "idea",
      };
      
      const [result] = await db.insert(contents).values(newContent).returning();
      
      await db.insert(activityLog).values({
        userId,
        message: `Ide konten baru: ${newContent.title}`
      });
      
      return result;
    } catch (error: any) {
      console.error('CREATE_CONTENT_ERROR:', error);
      throw error;
    }
  }

  static async updateContent(userId: string, id: string, data: any) {
    try {
      const updateData: any = { updatedAt: new Date() };
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.platform !== undefined) updateData.platform = data.platform;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.status !== undefined) updateData.status = data.status;

      await db.update(contents).set(updateData).where(eq(contents.id, id));
      
      return { id, ...updateData };
    } catch (error: any) {
      console.error('UPDATE_CONTENT_ERROR:', error);
      throw error;
    }
  }

  static async deleteContent(userId: string, id: string) {
    const [content] = await db.select().from(contents).where(eq(contents.id, id));
    if (content) {
      await db.delete(contents).where(eq(contents.id, id));
      await db.insert(activityLog).values({
        userId,
        message: `Konten dihapus: ${content.title}`
      });
    }
    return true;
  }
}

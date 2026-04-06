import { db } from "../db";
import { projects, parts, activityLog } from "../db/schema";
import { eq } from "drizzle-orm";

export class ProjectService {
  static async getAllProjects(userId: string) {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    const allParts = await db.select().from(parts);
    
    // Attach parts to projects
    return userProjects.map(p => ({
      ...p,
      parts: allParts.filter(part => part.projectId === p.id)
    }));
  }

  static async createProject(userId: string, data: any) {
    try {
      return await db.transaction(async (tx) => {
        // Generate a more unique ID using timestamp and random string
        const id = `PRJ-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const newProject = {
          id,
          userId,
          name: data.name || "Untitled Project",
          status: data.status || "idea",
          priority: data.priority || "medium",
          notes: data.notes || "",
          image: data.image || null,
        };
        
        await tx.insert(projects).values(newProject);
        
        const projectParts: any[] = [];
        if (data.parts && Array.isArray(data.parts)) {
          for (const partData of data.parts) {
            const partId = `PART-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            const newPart = {
              id: partId,
              projectId: id,
              name: partData.name || "Unnamed Part",
              material: partData.material || "PLA",
              color: partData.color || "Unknown",
              quantity: partData.quantity || 1,
              status: partData.status || "pending",
              path: partData.path || null
            };
            await tx.insert(parts).values(newPart);
            projectParts.push(newPart);
          }
        }
        
        await tx.insert(activityLog).values({
          userId,
          message: `Proyek baru dibuat: ${newProject.name}`
        });
        
        return { ...newProject, parts: projectParts };
      });
    } catch (error: any) {
      console.error('CREATE_PROJECT_ERROR:', error);
      throw error; // Re-throw to be caught by Express error handler
    }
  }

  static async updateProject(userId: string, id: string, data: any) {
    try {
      const updateData: any = { updatedAt: new Date() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.image !== undefined) updateData.image = data.image;

      await db.update(projects).set(updateData).where(eq(projects.id, id));
      return { id, ...updateData };
    } catch (error: any) {
      console.error('UPDATE_PROJECT_ERROR:', error);
      throw error;
    }
  }

  static async deleteProject(userId: string, id: string) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (project) {
      await db.delete(projects).where(eq(projects.id, id));
      await db.insert(activityLog).values({
        userId,
        message: `Proyek dihapus: ${project.name}`
      });
    }
    return true;
  }

  static async addPart(userId: string, projectId: string, data: any) {
    const id = `PART-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newPart = {
      id,
      projectId,
      name: data.name || "Unnamed Part",
      material: data.material || "PLA",
      color: data.color || "Unknown",
      quantity: data.quantity || 1,
      status: data.status || "pending"
    };
    await db.insert(parts).values(newPart);
    return newPart;
  }

  static async updatePart(userId: string, projectId: string, partId: string, data: any) {
    try {
      const updateData: any = { updatedAt: new Date() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.material !== undefined) updateData.material = data.material;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.path !== undefined) updateData.path = data.path;

      await db.update(parts).set(updateData).where(eq(parts.id, partId));
      return { id: partId, ...updateData };
    } catch (error: any) {
      console.error('UPDATE_PART_ERROR:', error);
      throw error;
    }
  }

  static async deletePart(userId: string, projectId: string, partId: string) {
    await db.delete(parts).where(eq(parts.id, partId));
    return true;
  }
}

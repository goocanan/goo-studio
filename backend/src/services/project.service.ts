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
    const id = `PRJ-${Date.now().toString().slice(-4)}`;
    const newProject = {
      id,
      userId,
      name: data.name,
      status: data.status || "idea",
      priority: data.priority || "medium",
      notes: data.notes || "",
      image: data.image || null,
    };
    
    await db.insert(projects).values(newProject);
    
    // Save parts if present
    const projectParts: any[] = [];
    if (data.parts && Array.isArray(data.parts)) {
      for (const partData of data.parts) {
        const partId = `PART-${Math.random().toString(36).substring(2, 6)}`;
        const newPart = {
          id: partId,
          projectId: id,
          name: partData.name,
          material: partData.material,
          color: partData.color,
          quantity: partData.quantity || 1,
          status: partData.status || "pending",
          path: partData.path || null
        };
        await db.insert(parts).values(newPart);
        projectParts.push(newPart);
      }
    }
    
    await db.insert(activityLog).values({
      userId,
      message: `Proyek baru dibuat: ${newProject.name}`
    });
    
    return { ...newProject, parts: projectParts };
  }

  static async updateProject(userId: string, id: string, data: any) {
    await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id));
    return { id, ...data };
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
    const id = `PART-${Date.now().toString().slice(-4)}`;
    const newPart = {
      id,
      projectId,
      name: data.name,
      material: data.material,
      color: data.color,
      quantity: data.quantity || 1,
      status: data.status || "pending"
    };
    await db.insert(parts).values(newPart);
    return newPart;
  }

  static async updatePart(userId: string, projectId: string, partId: string, data: any) {
    await db.update(parts).set({ ...data, updatedAt: new Date() }).where(eq(parts.id, partId));
    return { id: partId, ...data };
  }

  static async deletePart(userId: string, projectId: string, partId: string) {
    await db.delete(parts).where(eq(parts.id, partId));
    return true;
  }
}

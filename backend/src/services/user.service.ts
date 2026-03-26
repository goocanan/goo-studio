import { db } from "../db";
import { settings, activityLog } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export class UserService {
  static async getSettings(userId: string) {
    const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
    if (!userSettings) {
      // Create defaults
      const [newSettings] = await db.insert(settings).values({ userId }).returning();
      return newSettings;
    }
    return userSettings;
  }

  static async updateSettings(userId: string, data: any) {
    const existing = await this.getSettings(userId);
    await db.update(settings).set(data).where(eq(settings.id, existing.id));
    return { ...existing, ...data };
  }

  static async getActivity(userId: string) {
    return await db.select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.timestamp))
      .limit(50);
  }

  static async addActivity(userId: string, message: string) {
    const [log] = await db.insert(activityLog).values({
      userId,
      message,
    }).returning();
    return log;
  }
}

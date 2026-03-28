import { db } from "../db";
import { inventory, settings, activityLog } from "../db/schema";
import { eq } from "drizzle-orm";

export class SpoolService {
  static async getAllSpools(userId: string) {
    return await db.select().from(inventory).where(eq(inventory.userId, userId));
  }

  static async createSpool(userId: string, data: any) {
    const id = data.id || `INV-${Date.now().toString().slice(-4)}`;
    const newEntry = {
      id,
      userId,
      sku: data.sku || id,
      brand: data.brand,
      materialType: data.materialType || data.material,
      color: data.color || data.colorName,
      type: data.type,
      version: data.version,

      pricePerGram: data.pricePerGram || 0,
      colorHex: data.colorHex,
      imageUrl: data.imageUrl,
    };
    await db.insert(inventory).values(newEntry);
    
    await db.insert(activityLog).values({
      userId,
      message: `Item inventory baru didaftarkan: ${id} ${newEntry.brand} ${newEntry.materialType} ${newEntry.color}`
    });

    return newEntry;
  }

  static async updateSpool(userId: string, id: string, data: any) {
    await db.update(inventory).set({ ...data, updatedAt: new Date() }).where(eq(inventory.id, id));
    return { id, ...data };
  }

  static async deleteSpool(userId: string, id: string) {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    if (item) {
      await db.delete(inventory).where(eq(inventory.id, id));
      await db.insert(activityLog).values({
        userId,
        message: `Item dihapus dari inventory: ${item.brand} ${item.color}`
      });
    }
    return true;
  }


}

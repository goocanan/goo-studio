import { db } from "../db";
import { inventory, settings, activityLog } from "../db/schema";
import { eq } from "drizzle-orm";

export class SpoolService {
  static async getAllSpools(userId: string) {
    return await db.select().from(inventory).where(eq(inventory.userId, userId));
  }

  static async createSpool(userId: string, data: any) {
    try {
      const id = data.id || `INV-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newEntry = {
        id,
        userId,
        sku: data.sku || id,
        brand: data.brand || "Unknown",
        materialType: data.materialType || data.material || "PLA",
        color: data.color || data.colorName || "Unknown",
        type: data.type || null,
        version: data.version || null,

        pricePerGram: data.pricePerGram || 0,
        colorHex: data.colorHex || null,
        imageUrl: data.imageUrl || null,
      };
      await db.insert(inventory).values(newEntry);
      
      await db.insert(activityLog).values({
        userId,
        message: `Item inventory baru didaftarkan: ${id} ${newEntry.brand} ${newEntry.materialType} ${newEntry.color}`
      });

      return newEntry;
    } catch (error: any) {
      console.error('CREATE_SPOOL_ERROR:', error);
      throw error;
    }
  }

  static async updateSpool(userId: string, id: string, data: any) {
    try {
      const updateData: any = { updatedAt: new Date() };
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.materialType !== undefined) updateData.materialType = data.materialType;
      if (data.material !== undefined) updateData.materialType = data.material; // Handled both
      if (data.color !== undefined) updateData.color = data.color;
      if (data.colorName !== undefined) updateData.color = data.colorName; // Handled both
      if (data.type !== undefined) updateData.type = data.type;
      if (data.version !== undefined) updateData.version = data.version;
      if (data.pricePerGram !== undefined) updateData.pricePerGram = data.pricePerGram;
      if (data.colorHex !== undefined) updateData.colorHex = data.colorHex;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      await db.update(inventory).set(updateData).where(eq(inventory.id, id));
      return { id, ...updateData };
    } catch (error: any) {
      console.error('UPDATE_SPOOL_ERROR:', error);
      throw error;
    }
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

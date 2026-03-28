import { db } from "../db";
import { batches, parts, inventory, activityLog } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

export class BatchService {
  static async getAllBatches(userId: string) {
    const userBatches = await db.select().from(batches).where(eq(batches.userId, userId));
    const allParts = await db.select().from(parts);
    
    return userBatches.map(b => ({
      ...b,
      parts: allParts.filter(part => part.batchId === b.id)
    }));
  }

  static async createBatch(userId: string, data: any) {
    const id = `BATCH-${Date.now().toString().slice(-4)}`;
    
    // Create the batch record
    const newBatch = {
      id,
      userId,
      material: data.material,
      color: data.color,
      totalWeight: data.totalWeight,
      spoolId: data.spoolId,
      status: "ready"
    };
    await db.insert(batches).values(newBatch);

    // Update part statuses and bind to batch
    if (data.partIds && data.partIds.length > 0) {
      await db.update(parts)
        .set({ batchId: id, status: "printing", updatedAt: new Date() })
        .where(inArray(parts.id, data.partIds));
    }

      message: `Batch print dibuat: ${id} (${data.partIds?.length || 0} parts)`

    return newBatch;
  }

  static async completeBatch(userId: string, id: string) {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    if (!batch) throw new Error("Batch not found");

    // 1. Mark batch as completed
    await db.update(batches)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(batches.id, id));

    // 2. Mark parts as DONE
    await db.update(parts)
      .set({ status: "done", updatedAt: new Date() })
      .where(eq(parts.batchId, id));



    await db.insert(activityLog).values({
      userId,
      message: `Batch ${id} selesai.`
    });

    return { success: true };
  }
}

import { db } from "../db/index";
import { flowDb, flowInventory, flowInventoryTransactions } from "../db/flow";
import { inventory, inventoryTransactions } from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

interface SyncResult {
  updated: number;
  inserted: number;
  errors: string[];
}

/**
 * Sync inventory from 3DFlow to GOO-Studio by SKU
 * - Match by SKU (unique in both systems)
 * - Update currentWeight, initialWeight in GOO-Studio
 * - Record adjustment transaction for audit
 */
export async function syncInventoryFromFlow(userId: string): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, inserted: 0, errors: [] };

  try {
    // Fetch all inventory from 3DFlow
    const flowItems = await flowDb.select().from(flowInventory);

    // Fetch all GOO-Studio inventory for this user
    const gooItems = await db.select().from(inventory).where(eq(inventory.userId, userId));
    const gooItemsBySku = new Map(gooItems.map(item => [item.sku, item]));

    for (const flowItem of flowItems) {
      try {
        const gooItem = gooItemsBySku.get(flowItem.sku);
        const currentWeight = Math.round(flowItem.currentWeight);
        const initialWeight = Math.round(flowItem.initialWeight);

        if (gooItem) {
          // Update existing item
          const oldWeight = gooItem.currentWeight || 0;
          const weightDiff = currentWeight - oldWeight;

          await db
            .update(inventory)
            .set({
              currentWeight,
              initialWeight,
              updatedAt: new Date(),
            })
            .where(eq(inventory.id, gooItem.id));

          // Record adjustment transaction if weight changed
          if (weightDiff !== 0) {
            await db.insert(inventoryTransactions).values({
              id: nanoid(),
              inventoryId: gooItem.id,
              transactionType: "adjustment",
              weightChange: weightDiff,
              referenceId: `sync-${Date.now()}`,
              notes: `Synced from 3DFlow: ${flowItem.sku}`,
              createdAt: new Date(),
            });
          }

          result.updated++;
        } else {
          // Insert new item (3DFlow has it, GOO-Studio doesn't)
          const newId = nanoid();
          await db.insert(inventory).values({
            id: newId,
            userId,
            sku: flowItem.sku,
            brand: flowItem.brand,
            type: flowItem.type || "",
            version: flowItem.version || "",
            materialType: flowItem.materialType,
            color: flowItem.color,
            pricePerGram: Math.round(flowItem.pricePerGram * 100), // GOO uses integer (Rp/gram * 100)
            imageUrl: null,
            lowStockThreshold: flowItem.lowStockThreshold || 100,
            productLink: flowItem.productLink,
            colorHex: flowItem.colorHex,
            purchaseDate: flowItem.purchaseDate,
            currentWeight,
            initialWeight,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Record initial stock transaction
          await db.insert(inventoryTransactions).values({
            id: nanoid(),
            inventoryId: newId,
            transactionType: "restock",
            weightChange: currentWeight,
            referenceId: `sync-${Date.now()}`,
            notes: `Imported from 3DFlow: ${flowItem.sku}`,
            createdAt: new Date(),
          });

          result.inserted++;
        }
      } catch (err: any) {
        result.errors.push(`${flowItem.sku}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Sync failed: ${err.message}`);
  }

  return result;
}

/**
 * Record filament usage in 3DFlow after batch completion
 * - Find 3DFlow inventory by SKU
 * - Insert usage transaction
 * - Update currentWeight
 */
export async function recordUsageInFlow(sku: string, weightUsed: number, notes: string): Promise<void> {
  const flowItem = await flowDb
    .select()
    .from(flowInventory)
    .where(eq(flowInventory.sku, sku))
    .limit(1);

  if (flowItem.length === 0) {
    throw new Error(`Inventory SKU ${sku} not found in 3DFlow`);
  }

  const item = flowItem[0];
  const newWeight = Math.max(0, item.currentWeight - weightUsed);

  // Insert transaction
  await flowDb.insert(flowInventoryTransactions).values({
    inventoryId: item.id,
    transactionType: "usage",
    weightChange: -weightUsed,
    notes,
    createdAt: new Date(),
  });

  // Update weight
  await flowDb
    .update(flowInventory)
    .set({ 
      currentWeight: newWeight, 
      updatedAt: new Date() 
    })
    .where(eq(flowInventory.id, item.id));
}

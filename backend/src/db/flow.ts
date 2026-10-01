import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, timestamp, integer, uuid, doublePrecision } from "drizzle-orm/pg-core";
import * as dotenv from "dotenv";

dotenv.config();

// 3DFlow schema (read-only for sync)
export const flowInventory = pgTable("inventory", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  sku: text("sku").notNull().unique(),
  brand: text("brand").notNull(),
  type: text("type"),
  version: text("version"),
  materialType: text("material_type").notNull(),
  color: text("color").notNull(),
  currentWeight: doublePrecision("current_weight").notNull(),
  initialWeight: doublePrecision("initial_weight").notNull(),
  pricePerGram: doublePrecision("price_per_gram").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(100),
  productLink: text("product_link"),
  colorHex: text("color_hex"),
  purchaseDate: timestamp("purchase_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const flowInventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryId: uuid("inventory_id").notNull(),
  transactionType: text("transaction_type").notNull(), // restock, usage, adjustment, waste
  weightChange: doublePrecision("weight_change").notNull(),
  notes: text("notes"),
  orderId: uuid("order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

const flowPool = new Pool({
  connectionString: process.env.FLOW_DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export const flowDb = drizzle(flowPool, { 
  schema: { 
    inventory: flowInventory, 
    inventoryTransactions: flowInventoryTransactions 
  } 
});

import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";

// --- Better Auth Tables ---
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- App Tables ---
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  lowStockThreshold: integer("lowStockThreshold").notNull().default(200),
  weightUnit: text("weightUnit").notNull().default("gram"),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(), 
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  brand: text("brand").notNull(),
  type: text("type"),
  version: text("version"),
  materialType: text("material_type").notNull(), // Assuming string instead of enum for simplicity
  color: text("color").notNull(),

  pricePerGram: integer("price_per_gram").notNull().default(0), // Using integer for simplicity (cents/units) or double if needed
  remainingWeight: integer("remaining_weight").notNull().default(0),
  initialWeight: integer("initial_weight").notNull().default(1000),
  imageUrl: text("image_url"),
  lowStockThreshold: integer("low_stock_threshold").default(100),
  productLink: text("product_link"),
  colorHex: text("color_hex"),
  purchaseDate: timestamp("purchase_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("idea"), // idea, ready, printing, done
  priority: text("priority").notNull().default("medium"),
  notes: text("notes"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const batches = pgTable("batches", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  material: text("material").notNull(),
  color: text("color").notNull(),
  spoolId: text("spoolId").references(() => inventory.id, { onDelete: "set null" }), // Link to inventory
  status: text("status").notNull().default("ready"), // ready, printing, completed
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const parts = pgTable("parts", {
  id: text("id").primaryKey(),
  projectId: text("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  material: text("material").notNull(),
  color: text("color").notNull(),
  quantity: integer("quantity").notNull().default(1),
  weight: integer("weight").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, ready, printing, done
  path: text("path"),
  batchId: text("batchId").references(() => batches.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

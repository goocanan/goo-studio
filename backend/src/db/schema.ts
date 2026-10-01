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
  imageUrl: text("image_url"),
  lowStockThreshold: integer("low_stock_threshold").default(100),
  productLink: text("product_link"),
  colorHex: text("color_hex"),
  purchaseDate: timestamp("purchase_date"),
  currentWeight: integer("current_weight"),
  initialWeight: integer("initial_weight"),
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
  totalWeight: integer("totalWeight").notNull().default(0),
  spoolId: text("spoolId").references(() => inventory.id, { onDelete: "set null" }), // Link to inventory
  bedPlate: text("bedPlate"), // e.g. "Creality Hi" | "BambuLab A1 Mini"
  bedWidth: integer("bedWidth").notNull().default(0), // mm (X)
  bedDepth: integer("bedDepth").notNull().default(0), // mm (Y)
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
  weight: integer("weight").notNull().default(0), // in grams
  printDurationMinutes: integer("printDurationMinutes").notNull().default(0), // total print time in minutes
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending, ready, printing, done
  path: text("path"),
  // Bounding box dimensions from STL analysis (per unit, in mm)
  dimX: integer("dimX").notNull().default(0),
  dimY: integer("dimY").notNull().default(0),
  dimZ: integer("dimZ").notNull().default(0),
  batchId: text("batchId").references(() => batches.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- Content Tables ---
export const contents = pgTable("contents", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  projectId: text("projectId").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags"),
  platform: text("platform"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("idea"), // idea, research, ready, script, recording, editing, review, scheduled, published
  scheduledAt: timestamp("scheduledAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- Social Media Posts Table ---
export const socialPosts = pgTable("social_posts", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  projectId: text("projectId").references(() => projects.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // youtube_shorts, instagram_reels, facebook_reels, tiktok
  title: text("title").notNull(),
  postUrl: text("post_url"),
  publishedAt: timestamp("published_at"),
  // Analytics metrics
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  // Computed scores (stored for history)
  contentScore: integer("content_score").notNull().default(0),
  engagementRate: integer("engagement_rate").notNull().default(0), // stored as bps*100 (e.g., 875 => 8.75%)
  // Status
  status: text("status").notNull().default("draft"), // draft, scheduled, published
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Inventory Transactions Table (sync with 3DFlow) ---
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: text("id").primaryKey(),
  inventoryId: text("inventory_id").notNull().references(() => inventory.id, { onDelete: "cascade" }),
  transactionType: text("transaction_type").notNull(), // restock, usage, adjustment, waste
  weightChange: integer("weight_change").notNull(), // positive for restock/add, negative for usage/waste
  referenceId: text("reference_id"), // batchId, orderId, sync job id
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

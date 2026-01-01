import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  boolean,
  json,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const categoryEnum = pgEnum("category", [
  "FOOD",
  "STATIONERY",
  "TOILETRIES",
]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "STOCK_IN",
  "STOCK_OUT",
  "RETURN",
  "ADJUSTMENT",
  "WASTAGE",
]);

// --- 1. USERS ---
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  role: text("role").default("staff"),
});

// --- 2. VENDORS ---
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  isCreditAllowed: boolean("is_credit_allowed").default(false),
  bankDetails: json("bank_details"),
  lastBillDate: timestamp("last_bill_date"),
  totalLifetimePaid: decimal("total_lifetime_paid", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 3. INVENTORY ITEMS ---
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: categoryEnum("category").notNull(),
  unit: text("unit").notNull(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  trackExpiry: boolean("track_expiry").default(false),
  lastUnitPrice: decimal("last_unit_price", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- 4. TRANSACTIONS ---
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: transactionTypeEnum("type").notNull(),
  date: timestamp("date").defaultNow(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  department: text("department"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  billImageUrl: text("bill_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- 5. TRANSACTION ITEMS ---
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  expiryDate: timestamp("expiry_date"),
});

// --- RELATIONS ---
export const vendorsRelations = relations(vendors, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [transactions.vendorId],
    references: [vendors.id],
  }),
  items: many(transactionItems),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  history: many(transactionItems),
}));
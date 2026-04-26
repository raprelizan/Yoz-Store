import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "payment_created",
  "paid",
  "failed",
  "fulfilled"
]);

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerEmail: text("customer_email").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  oneClickPaymentId: text("oneclick_payment_id"),
  oneClickOrderId: text("oneclick_order_id"),
  status: orderStatusEnum("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  channel: text("channel").notNull(),
  payload: jsonb("payload").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

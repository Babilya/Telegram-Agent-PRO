import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groupsTable = pgTable("groups", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  title: text("title").notNull(),
  username: text("username"),
  membersCount: integer("members_count"),
  type: text("type").notNull().default("group"),
  status: text("status").notNull().default("saved"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("groups_status_idx").on(t.status),
  index("groups_created_at_idx").on(t.createdAt),
]);

export const insertGroupSchema = createInsertSchema(groupsTable).omit({ id: true, createdAt: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groupsTable.$inferSelect;

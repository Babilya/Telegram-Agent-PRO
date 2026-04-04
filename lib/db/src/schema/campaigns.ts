import { pgTable, serial, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const campaignsTable = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("draft"),
  scheduleType: text("schedule_type").notNull().default("once"),
  intervalHours: real("interval_hours"),
  targetGroupIds: jsonb("target_group_ids").$type<number[]>().notNull().default([]),
  sentCount: integer("sent_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaignsTable).omit({ id: true, createdAt: true, sentCount: true, failCount: true });
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaignsTable.$inferSelect;

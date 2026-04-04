import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const parsedContactsTable = pgTable("parsed_contacts", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  username: text("username"),
  phone: text("phone"),
  isBot: boolean("is_bot").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  sourceGroup: text("source_group"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParsedContactSchema = createInsertSchema(parsedContactsTable).omit({ id: true, createdAt: true });
export type InsertParsedContact = z.infer<typeof insertParsedContactSchema>;
export type ParsedContact = typeof parsedContactsTable.$inferSelect;

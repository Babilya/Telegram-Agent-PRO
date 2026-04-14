import { pgTable, serial, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
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
}, (t) => [
  index("parsed_contacts_source_group_idx").on(t.sourceGroup),
  index("parsed_contacts_created_at_idx").on(t.createdAt),
  index("parsed_contacts_telegram_id_idx").on(t.telegramId),
]);

export const insertParsedContactSchema = createInsertSchema(parsedContactsTable).omit({ id: true, createdAt: true });
export type InsertParsedContact = z.infer<typeof insertParsedContactSchema>;
export type ParsedContact = typeof parsedContactsTable.$inferSelect;

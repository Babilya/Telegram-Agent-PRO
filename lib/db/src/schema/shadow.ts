import { pgTable, serial, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const keywordsTable = pgTable("keywords", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  hits: integer("hits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("keywords_enabled_idx").on(t.enabled),
]);

export const insertKeywordSchema = createInsertSchema(keywordsTable).omit({ id: true, createdAt: true, hits: true });
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywordsTable.$inferSelect;

export const autoRepliesTable = pgTable("auto_replies", {
  id: serial("id").primaryKey(),
  trigger: text("trigger").notNull(),
  reply: text("reply").notNull(),
  matchType: text("match_type").notNull().default("contains"),
  enabled: boolean("enabled").notNull().default(true),
  hits: integer("hits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertAutoReplySchema = createInsertSchema(autoRepliesTable).omit({ id: true, createdAt: true, hits: true });
export type InsertAutoReply = z.infer<typeof insertAutoReplySchema>;
export type AutoReply = typeof autoRepliesTable.$inferSelect;

export const forwardFiltersTable = pgTable("forward_filters", {
  id: serial("id").primaryKey(),
  sourceChat: text("source_chat").notNull(),
  destChat: text("dest_chat").notNull(),
  keyword: text("keyword"),
  mediaType: text("media_type"),
  enabled: boolean("enabled").notNull().default(true),
  forwarded: integer("forwarded").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertForwardFilterSchema = createInsertSchema(forwardFiltersTable).omit({ id: true, createdAt: true, forwarded: true });
export type InsertForwardFilter = z.infer<typeof insertForwardFilterSchema>;
export type ForwardFilter = typeof forwardFiltersTable.$inferSelect;

export const mirrorsTable = pgTable("mirrors", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  ownerTelegramId: text("owner_telegram_id").notNull(),
  accessKey: text("access_key").notNull().unique(),
  enabled: boolean("enabled").notNull().default(true),
  apiId: integer("api_id"),
  apiHashEnc: text("api_hash_enc"),
  sessionString: text("session_string"),
  phone: text("phone"),
  status: text("status").notNull().default("idle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertMirrorSchema = createInsertSchema(mirrorsTable).omit({ id: true, createdAt: true });
export type InsertMirror = z.infer<typeof insertMirrorSchema>;
export type Mirror = typeof mirrorsTable.$inferSelect;

export const messageLogsTable = pgTable("message_logs", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  chatTitle: text("chat_title"),
  senderId: text("sender_id"),
  senderName: text("sender_name"),
  messageId: text("message_id"),
  text: text("text"),
  originalText: text("original_text"),
  mediaType: text("media_type"),
  mediaPath: text("media_path"),
  eventType: text("event_type").notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("message_logs_chat_id_idx").on(t.chatId),
  index("message_logs_event_type_idx").on(t.eventType),
  index("message_logs_created_at_idx").on(t.createdAt),
]);
export const insertMessageLogSchema = createInsertSchema(messageLogsTable).omit({ id: true, createdAt: true });
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type MessageLog = typeof messageLogsTable.$inferSelect;

export const contactProfilesTable = pgTable("contact_profiles", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  tags: text("tags"),
  notes: text("notes"),
  lastSeen: timestamp("last_seen"),
  messageCount: integer("message_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertContactProfileSchema = createInsertSchema(contactProfilesTable).omit({ id: true, createdAt: true });
export type InsertContactProfile = z.infer<typeof insertContactProfileSchema>;
export type ContactProfile = typeof contactProfilesTable.$inferSelect;

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  reply: text("reply"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({ id: true, createdAt: true, reply: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;

// ─── Per-user FSM cancel counters (E012 limit) ──────────────────────────────────
export const cancelCountersTable = pgTable("cancel_counters", {
  id: serial("id").primaryKey(),
  userKey: text("user_key").notNull().unique(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
});
export type CancelCounter = typeof cancelCountersTable.$inferSelect;

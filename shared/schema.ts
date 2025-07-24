import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  language: text("language").notNull().default("en"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>().default({}),
  lastInteraction: timestamp("last_interaction"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: jsonb("subject").$type<Record<string, string>>().notNull(),
  content: jsonb("content").$type<Record<string, string>>().notNull(),
  variables: text("variables").array().default([]),
  primaryLanguage: text("primary_language").notNull().default("en"),
  supportedLanguages: text("supported_languages").array().default(["en"]),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledEmails = pgTable("scheduled_emails", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  templateId: integer("template_id").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  language: text("language").notNull().default("en"),
  personalizedSubject: text("personalized_subject"),
  personalizedContent: text("personalized_content"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  templateId: integer("template_id"),
  scheduledEmailId: integer("scheduled_email_id"),
  subject: text("subject").notNull(),
  status: text("status").notNull(), // sent, delivered, opened, clicked, bounced, failed
  language: text("language").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  errorMessage: text("error_message"),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export const insertScheduledEmailSchema = createInsertSchema(scheduledEmails).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  personalizedSubject: true,
  personalizedContent: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export type InsertScheduledEmail = z.infer<typeof insertScheduledEmailSchema>;
export type ScheduledEmail = typeof scheduledEmails.$inferSelect;

export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = typeof emailLogs.$inferSelect;

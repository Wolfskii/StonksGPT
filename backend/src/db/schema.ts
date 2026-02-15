import {
  pgTable,
  serial,
  text,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  type: text("type").$type<"stock" | "etf" | "fund">().default("stock"),
  exchange: text("exchange"), // e.g. US, LON, ST for router
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const manualNotes = pgTable("manual_notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  noteDate: timestamp("note_date"), // optional date for "today's context"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyRuns = pgTable("daily_runs", {
  id: serial("id").primaryKey(),
  status: text("status").$type<"running" | "success" | "error">().notNull(),
  inputSnapshot: jsonb("input_snapshot").$type<{ symbols: string[]; date: string; error?: string; riskLevel?: number }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  runId: integer("run_id")
    .notNull()
    .references(() => dailyRuns.id),
  fullOutput: text("full_output").notNull(), // English – full AI advice/reasoning
  fullOutputSv: text("full_output_sv"), // Swedish – same recommendation for locale toggle
  structuredSummary: jsonb("structured_summary").$type<
    Array<{ symbol: string; action: string; reasoning: string }>
  >(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

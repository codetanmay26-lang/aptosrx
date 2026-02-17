import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  issuedAt: z.number(),
});

export type PrescriptionData = z.infer<typeof prescriptionSchema>;

export const verifyPrescriptionSchema = z.object({
  prescriptionId: z.string().min(1, 'Prescription ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
});

export type VerifyPrescriptionData = z.infer<typeof verifyPrescriptionSchema>;

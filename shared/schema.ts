import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mathProblems = pgTable("math_problems", {
  id: serial("id").primaryKey(),
  problemText: text("problem_text").notNull(),
  imageUrl: text("image_url"),
  template: text("template").notNull(),
  topic: text("topic").notNull(),
  gradeLevel: text("grade_level").notNull(),
  rating: integer("rating"),
  feedback: text("feedback"),
});

export const insertMathProblemSchema = createInsertSchema(mathProblems).pick({
  problemText: true,
  imageUrl: true,
  template: true,
  topic: true,
  gradeLevel: true,
  rating: true,
  feedback: true,
});

export type InsertMathProblem = z.infer<typeof insertMathProblemSchema>;
export type MathProblem = typeof mathProblems.$inferSelect;

export const problemInputSchema = z.object({
  problemText: z.string().min(1, "Problem text is required"),
  imageData: z.string().optional(),
});

export type ProblemInput = z.infer<typeof problemInputSchema>;

export const feedbackSchema = z.object({
  template: z.string().min(1, "Template is required"),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

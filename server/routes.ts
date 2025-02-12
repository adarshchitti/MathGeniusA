import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { problemInputSchema, feedbackSchema } from "@shared/schema";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function registerRoutes(app: Express): Server {
  app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
      const input = problemInputSchema.parse({
        problemText: req.body.problemText,
        imageData: req.file?.buffer.toString("base64"),
      });

      // Mock Gemini API response for now
      const analysis = {
        template: `Step 1: ${input.problemText}\nStep 2: Solve using appropriate method\nStep 3: Verify answer`,
        topic: "Algebra",
        gradeLevel: "Grade 8"
      };

      const problem = await storage.createProblem({
        problemText: input.problemText,
        imageUrl: input.imageData ? "data:image/jpeg;base64," + input.imageData : undefined,
        template: analysis.template,
        topic: analysis.topic,
        gradeLevel: analysis.gradeLevel,
        rating: undefined,
        feedback: undefined
      });

      res.json(problem);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.post("/api/problems/:id/feedback", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = feedbackSchema.parse(req.body);
      
      const updated = await storage.updateProblem(id, {
        template: input.template,
        rating: input.rating,
        feedback: input.feedback
      });

      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.get("/api/problems/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const problem = await storage.getProblem(id);
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }
    res.json(problem);
  });

  const httpServer = createServer(app);
  return httpServer;
}

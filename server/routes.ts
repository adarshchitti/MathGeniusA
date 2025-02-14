import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { problemInputSchema } from "@shared/schema";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}
const genAI = new GoogleGenerativeAI(geminiApiKey);

export function registerRoutes(app: Express): Server {
  app.post("/api/analyze", upload.single("image"), async (req, res) => {
    try {
      let problemText = req.body.problemText?.trim() || "";

      // If there's an image but no problem text, perform OCR
      if (req.file) {
        console.log("Processing OCR to extract text...");
        try {
          const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng");
          problemText = text.trim(); // Use OCR text directly
          console.log("OCR Extracted Text:", problemText);
        } catch (ocrError) {
          console.error("OCR failed:", ocrError);
          return res.status(400).json({ error: "Failed to extract text from image" });
        }
      }

      // Ensure we have meaningful input
      if (!problemText) {
        return res.status(400).json({ error: "No valid problem text found" });
      }
      console.log("problemText", problemText)


      // Generate analysis using the actual problem text
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`
        Provide a structured JSON response with the following fields:
        {
          "template": "Provide a template for this math problem",
          "blueprint": "Provide a method to generate similar problems",
          "topic": "The subject area of the problem",
          "gradeLevel": "Estimated grade level for this problem"
        }
        Respond ONLY in JSON format. Do NOT include extra text.
        For the input: "${problemText}"
      `);

      console.log("Heyyy after prompet")
      console.log(result)
      const response = await result.response.text();
      console.log("Raw Gemini response:", response);

      // Clean up the response - remove markdown formatting if present
      const cleanResponse = response.replace(/```json\n|\n```/g, '');
      const analysis = JSON.parse(cleanResponse);
      
      // Send a clean response object
      const responseData = {
        template: analysis.template,
        blueprint: analysis.blueprint,
        topic: analysis.topic,
        gradeLevel: analysis.gradeLevel,
        problemText,
        imageUrl: req.file ? `data:image/jpeg;base64,${req.file.buffer.toString('base64')}` : null
      };

      console.log("Sending to frontend:", responseData);
      res.json(responseData);

    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze problem" });
    }
  });

  // Add this endpoint to handle template state
  app.get("/api/template/:id", async (req, res) => {
    try {
      const state = req.query.state;
      if (!state) {
        return res.status(400).json({ error: "No state provided" });
      }
      
      const decodedState = JSON.parse(decodeURIComponent(state as string));
      res.json(decodedState);
    } catch (error) {
      console.error("Template error:", error);
      res.status(500).json({ error: "Failed to process template state" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { template, blueprint } = req.body;

      if (!template || !blueprint) {
        return res.status(400).json({ error: "Template and blueprint are required" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(`
        Using this template: "${template}"
        And this blueprint: "${blueprint}"
        Generate a new math problem and its solution.
        Respond in JSON format with these fields:
        {
          "question": "The generated math problem",
          "solution": "Step by step solution to the problem"
        }
      `);

      const response = await result.response.text();
      console.log("Raw Gemini response Similar Question:", response);
      const cleanResponse = response.replace(/```json\n|\n```/g, '');
      const generatedContent = JSON.parse(cleanResponse);

      res.json(generatedContent);
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ error: "Failed to generate similar question" });
    }
  });

  return createServer(app);
}


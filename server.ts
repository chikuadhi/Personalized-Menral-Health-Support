/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { LocalDatabase } from "./src/server/db.js";
import { trainAndEvaluateModels, preprocessData, generateSyntheticDataset } from "./src/server/ml.js";
import { ClinicalNLPModule } from "./src/server/nlp.js";
import { AgenticAIEngine } from "./src/server/agent.js";
import { MoodRecord, ChatMessage, UserProfile } from "./src/types.js";

// Load env variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // 1. Core Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // 2. Profile Endpoints
  app.get("/api/profile", (req, res) => {
    const users = LocalDatabase.getUsers();
    res.json(users[0] || null);
  });

  app.put("/api/profile", (req, res) => {
    const updated = LocalDatabase.updateUserProfile(req.body);
    res.json(updated);
  });

  // 3. Reset Data Endpoint (Seeding synthetic logs)
  app.post("/api/reset", (req, res) => {
    LocalDatabase.resetData();
    const syntheticLogs = generateSyntheticDataset(120);
    for (const log of syntheticLogs) {
      LocalDatabase.saveMoodRecord(log);
    }
    res.json({ success: true, count: syntheticLogs.length });
  });

  // 4. Daily Mood Record Endpoints
  app.get("/api/records", (req, res) => {
    const records = LocalDatabase.getMoodRecords();
    // If empty, auto-seed with synthetic data so the dashboard is immediately rich and gorgeous
    if (records.length === 0) {
      const syntheticLogs = generateSyntheticDataset(120);
      for (const log of syntheticLogs) {
        LocalDatabase.saveMoodRecord(log);
      }
      res.json(syntheticLogs);
    } else {
      res.json(records);
    }
  });

  app.post("/api/records/add", async (req, res) => {
    try {
      const {
        moodRating,
        sleepHours,
        stressLevel,
        socialConnections,
        physicalActivity,
        journalText,
      } = req.body;

      const records = LocalDatabase.getMoodRecords();

      // Train models on existing dataset to predict current mood rating based on parameters
      let predictedMoodRating = Math.round(moodRating);
      let predictionModelUsed: "LogisticRegression" | "LSTM" = "LogisticRegression";

      if (records.length >= 10) {
        const pipeline = trainAndEvaluateModels(records);
        const normFeat = [
          (sleepHours - 3) / (10 - 3),
          (stressLevel - 1) / (10 - 1),
          (socialConnections - 1) / (10 - 1),
          (physicalActivity - 0) / (120 - 0),
        ];
        
        // Let's use the LSTM model probability to map back to 1-10 mood rating
        const { prob } = pipeline.lstmModel.forward([normFeat, normFeat, normFeat, normFeat, normFeat]);
        // Scale probability 0-1 to rating 3-10
        predictedMoodRating = Math.max(1, Math.min(10, Math.round(prob * 6 + 3.5)));
        predictionModelUsed = "LSTM";
      }

      // Phase 3: Clinical NLP Analysis
      const nlpResult = ClinicalNLPModule.analyzeText(journalText);

      const newRecord: MoodRecord = {
        id: `record-${Date.now()}`,
        userId: "user-1",
        date: new Date().toISOString().split("T")[0],
        moodRating,
        sleepHours,
        stressLevel,
        socialConnections,
        physicalActivity,
        journalText,
        sentimentScore: nlpResult.sentimentScore,
        primaryEmotion: nlpResult.primaryEmotion,
        keywords: nlpResult.keywords,
        predictedMoodRating,
        predictionModelUsed,
      };

      // Save the mood record
      LocalDatabase.saveMoodRecord(newRecord);

      // Phase 4, 5 & 6: Agentic AI Action Trigger
      const conversationHistory = LocalDatabase.getChatMessages();
      const moodHistory = LocalDatabase.getMoodRecords();

      const aiResponse = await AgenticAIEngine.generateIntervention(
        `[USER JOURNAL CHECK-IN] My Mood: ${moodRating}/10, Stress: ${stressLevel}/10, Sleep: ${sleepHours}h. Journal thoughts: "${journalText}"`,
        newRecord,
        moodHistory
      );

      // Save user log text to chat messages for timeline continuity
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        sender: "user",
        text: `Submitted Journal check-in. Mood: ${moodRating}/10, Stress: ${stressLevel}/10, Sleep: ${sleepHours}h.`,
        timestamp: new Date().toISOString(),
      };
      LocalDatabase.saveChatMessage(userMsg);

      // Save Assistant supportive intervention message
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: "assistant",
        text: aiResponse.response,
        timestamp: new Date().toISOString(),
        agentThoughts: aiResponse.thoughts,
      };
      LocalDatabase.saveChatMessage(assistantMsg);

      res.status(201).json({
        record: newRecord,
        assistantResponse: assistantMsg,
      });
    } catch (err) {
      console.error("Failed to save daily mood record:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // 5. Chat History & Sending Endpoints
  app.get("/api/chat", (req, res) => {
    res.json(LocalDatabase.getChatMessages());
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { text } = req.body;
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        sender: "user",
        text,
        timestamp: new Date().toISOString(),
      };
      LocalDatabase.saveChatMessage(userMsg);

      const moodHistory = LocalDatabase.getMoodRecords();
      const lastRecord = moodHistory[moodHistory.length - 1] || null;

      // Generate Agentic Counselor Response
      const aiResponse = await AgenticAIEngine.generateIntervention(text, lastRecord, moodHistory);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: "assistant",
        text: aiResponse.response,
        timestamp: new Date().toISOString(),
        agentThoughts: aiResponse.thoughts,
      };
      LocalDatabase.saveChatMessage(assistantMsg);

      res.status(201).json(assistantMsg);
    } catch (err) {
      console.error("Chat sending failed:", err);
      res.status(500).json({ error: "Chat processing error" });
    }
  });

  // 6. NLP Instant Interactive Analysis
  app.post("/api/analyze-text", (req, res) => {
    const { text } = req.body;
    const analysis = ClinicalNLPModule.analyzeText(text);
    res.json(analysis);
  });

  // 7. Comparative Model Performance Metrics (Phase 1 vs Phase 2)
  app.get("/api/metrics", (req, res) => {
    const records = LocalDatabase.getMoodRecords();
    if (records.length < 15) {
      // If records are small, let's train on preseeded synthetic history to ensure realistic results are always shown
      const synthetic = generateSyntheticDataset(100);
      const pipeline = trainAndEvaluateModels(synthetic);
      res.json({
        logisticRegression: pipeline.logisticRegression,
        lstm: pipeline.lstm,
        trainedSampleCount: 100,
      });
    } else {
      const pipeline = trainAndEvaluateModels(records);
      res.json({
        logisticRegression: pipeline.logisticRegression,
        lstm: pipeline.lstm,
        trainedSampleCount: records.length,
      });
    }
  });

  // 8. Custom Wellness Content Generation
  app.post("/api/generate/meditation", async (req, res) => {
    const { focus, duration } = req.body;
    const customScript = await AgenticAIEngine.generateCustomMeditation(focus, duration);
    LocalDatabase.addMeditationScript(customScript);
    res.json(customScript);
  });

  app.post("/api/generate/exercise", async (req, res) => {
    const { focus } = req.body;
    const customEx = await AgenticAIEngine.generateCustomExercise(focus);
    LocalDatabase.addTherapyExercise(customEx);
    res.json(customEx);
  });

  // 9. Wellness Content Retrieval (Coping strategies, Meditation Scripts, CBT exercises)
  app.get("/api/coping-strategies", (req, res) => {
    res.json(LocalDatabase.getCopingStrategies());
  });

  app.get("/api/meditations", (req, res) => {
    res.json(LocalDatabase.getMeditationScripts());
  });

  app.get("/api/therapy-exercises", (req, res) => {
    res.json(LocalDatabase.getTherapyExercises());
  });

  // Vite Integration for full-stack SPA serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

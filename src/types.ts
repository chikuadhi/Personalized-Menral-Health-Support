/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MoodRecord {
  id: string;
  userId: string;
  date: string; // ISO Date YYYY-MM-DD
  moodRating: number; // 1 to 10
  sleepHours: number; // Hours of sleep
  stressLevel: number; // 1 to 10
  socialConnections: number; // 1 to 10
  physicalActivity: number; // Minutes of exercise
  journalText: string;
  
  // NLP & Sentiment Analyzed Fields
  sentimentScore: number; // -1 to +1
  primaryEmotion: string; // "Happy" | "Calm" | "Anxious" | "Sad" | "Angry" | "Neutral"
  keywords: string[];
  
  // Model Predicted Fields
  predictedMoodRating?: number;
  predictionModelUsed?: "LogisticRegression" | "LSTM";
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocPoints: { fpr: number; tpr: number }[];
}

export interface ComparisonMetrics {
  logisticRegression: ModelMetrics;
  lstm: ModelMetrics;
}

export interface CopingStrategy {
  id: string;
  title: string;
  description: string;
  category: "Anxiety" | "Sadness" | "Stress" | "Anger" | "General";
  steps: string[];
}

export interface MeditationScript {
  id: string;
  title: string;
  category: string;
  duration: string;
  script: string;
  breathingPattern: string; // e.g., "4-7-8 breathing"
}

export interface TherapyExercise {
  id: string;
  title: string;
  objective: string;
  instructions: string[];
  category: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  agentThoughts?: string; // Phase 6: Agent thought process details
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  focusArea: "Stress Relief" | "Mindfulness" | "Emotional Balance" | "Sleep Improvement";
  created_at: string;
}

export interface DatabaseState {
  users: UserProfile[];
  moodRecords: MoodRecord[];
  chatMessages: ChatMessage[];
  meditationScripts: MeditationScript[];
  therapyExercises: TherapyExercise[];
  copingStrategies: CopingStrategy[];
}

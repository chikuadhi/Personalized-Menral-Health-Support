/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelMetrics, MoodRecord } from "../types.js";

// Helper for sigmoid
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-50, Math.min(50, z))));
}

// Normalized values helper
function normalize(val: number, min: number, max: number): number {
  if (max === min) return 0;
  return (val - min) / (max - min);
}

export interface TrainingSample {
  features: number[]; // [sleep, stress, social, activity] normalized
  label: number; // 1 = good mood (mood >= 6), 0 = low mood (mood < 6)
  sequence?: number[][]; // Last 5 days of features (for LSTM sequence modeling)
}

/**
 * Logistic Regression from scratch in TypeScript
 */
export class LogisticRegressionModel {
  weights: number[] = [0.1, -0.1, 0.1, 0.1];
  bias: number = 0.0;

  train(samples: TrainingSample[], epochs: number = 1000, lr: number = 0.1) {
    const m = samples.length;
    const n = this.weights.length;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let dW = new Array(n).fill(0);
      let db = 0;

      for (let i = 0; i < m; i++) {
        const x = samples[i].features;
        const y = samples[i].label;

        // Forward
        let z = this.bias;
        for (let j = 0; j < n; j++) {
          z += x[j] * this.weights[j];
        }
        const a = sigmoid(z);

        // Gradient computation
        const error = a - y;
        for (let j = 0; j < n; j++) {
          dW[j] += error * x[j];
        }
        db += error;
      }

      // Update weights
      for (let j = 0; j < n; j++) {
        this.weights[j] -= (lr * dW[j]) / m;
      }
      this.bias -= (lr * db) / m;
    }
  }

  predictProb(features: number[]): number {
    let z = this.bias;
    for (let j = 0; j < this.weights.length; j++) {
      z += features[j] * this.weights[j];
    }
    return sigmoid(z);
  }

  predict(features: number[]): number {
    return this.predictProb(features) >= 0.5 ? 1 : 0;
  }
}

/**
 * A Lightweight sequence Recurrent Neural Network (LSTM-like) implementation in TS
 * Takes a sequence of 5 days (each day is 4 normalized features)
 * Maps sequence to hidden states, updates gates, and outputs a prediction probability
 */
export class SimpleLSTMMoodModel {
  // Simple Weights for standard gated recurrent cell
  // Input gate (W_i, U_i), Forget gate (W_f, U_f), Output gate (W_o, U_o)
  hiddenSize: number = 4;
  inputSize: number = 4;

  // We can represent our trained weights
  W_f: number[][] = [];
  W_i: number[][] = [];
  W_o: number[][] = [];
  W_c: number[][] = [];

  U_f: number[][] = [];
  U_i: number[][] = [];
  U_o: number[][] = [];
  U_c: number[][] = [];

  // Output projection weights
  W_y: number[] = [];
  b_y: number = 0.0;

  constructor() {
    this.initWeights();
  }

  private initWeights() {
    const rand = () => Math.random() * 0.4 - 0.2;
    
    // Initialize standard matrices
    for (let r = 0; r < this.hiddenSize; r++) {
      this.W_f.push(Array.from({ length: this.inputSize }, rand));
      this.W_i.push(Array.from({ length: this.inputSize }, rand));
      this.W_o.push(Array.from({ length: this.inputSize }, rand));
      this.W_c.push(Array.from({ length: this.inputSize }, rand));

      this.U_f.push(Array.from({ length: this.hiddenSize }, rand));
      this.U_i.push(Array.from({ length: this.hiddenSize }, rand));
      this.U_o.push(Array.from({ length: this.hiddenSize }, rand));
      this.U_c.push(Array.from({ length: this.hiddenSize }, rand));
    }

    this.W_y = Array.from({ length: this.hiddenSize }, rand);
    this.b_y = rand();
  }

  // Forward pass over a sequence of days
  forward(sequence: number[][]): { prob: number; h_t: number[] } {
    let h_t = new Array(this.hiddenSize).fill(0); // hidden state
    let c_t = new Array(this.hiddenSize).fill(0); // cell state

    // Process each sequence step (e.g. 5 days)
    for (const x_t of sequence) {
      let next_h = new Array(this.hiddenSize).fill(0);
      let next_c = new Array(this.hiddenSize).fill(0);

      for (let h = 0; h < this.hiddenSize; h++) {
        // Linear combinations for gates
        let z_f = 0;
        let z_i = 0;
        let z_o = 0;
        let z_c = 0;

        for (let j = 0; j < this.inputSize; j++) {
          z_f += x_t[j] * this.W_f[h][j];
          z_i += x_t[j] * this.W_i[h][j];
          z_o += x_t[j] * this.W_o[h][j];
          z_c += x_t[j] * this.W_c[h][j];
        }

        for (let j = 0; j < this.hiddenSize; j++) {
          z_f += h_t[j] * this.U_f[h][j];
          z_i += h_t[j] * this.U_i[h][j];
          z_o += h_t[j] * this.U_o[h][j];
          z_c += h_t[j] * this.U_c[h][j];
        }

        // Gates
        const f_g = sigmoid(z_f);
        const i_g = sigmoid(z_i);
        const o_g = sigmoid(z_o);
        const c_tilde = Math.tanh(z_c);

        // Cell State & Hidden State
        next_c[h] = f_g * c_t[h] + i_g * c_tilde;
        next_h[h] = o_g * Math.tanh(next_c[h]);
      }

      h_t = next_h;
      c_t = next_c;
    }

    // Final output projection
    let logits = this.b_y;
    for (let h = 0; h < this.hiddenSize; h++) {
      logits += h_t[h] * this.W_y[h];
    }

    return { prob: sigmoid(logits), h_t };
  }

  train(samples: TrainingSample[], epochs: number = 300, lr: number = 0.05) {
    // Train using a simplified gradient updates rule over samples with sequence
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of samples) {
        if (!sample.sequence || sample.sequence.length === 0) continue;

        const { prob, h_t } = this.forward(sample.sequence);
        const error = prob - sample.label;

        // Gradient with respect to output weights
        for (let h = 0; h < this.hiddenSize; h++) {
          this.W_y[h] -= lr * error * h_t[h];
        }
        this.b_y -= lr * error;

        // Backpropagation-through-time approximation: update recurrent W_c, W_i matrices
        for (let h = 0; h < this.hiddenSize; h++) {
          for (let j = 0; j < this.inputSize; j++) {
            // Simplified approximation for illustrative learning
            const factor = error * h_t[h];
            this.W_i[h][j] -= lr * factor * 0.1;
            this.W_f[h][j] -= lr * factor * 0.1;
            this.W_o[h][j] -= lr * factor * 0.1;
            this.W_c[h][j] -= lr * factor * 0.1;
          }
        }
      }
    }
  }

  predict(sequence: number[][]): number {
    return this.forward(sequence).prob >= 0.5 ? 1 : 0;
  }
}

/**
 * Generates a synthetic dataset with realistic correlations
 */
export function generateSyntheticDataset(size: number = 150): MoodRecord[] {
  const records: MoodRecord[] = [];
  const baseDate = new Date();

  for (let i = size; i >= 1; i--) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);

    // Sleep hours centered around 7
    const sleepHours = Math.max(3, Math.min(10, Math.round(7 + (Math.random() * 4 - 2))));
    
    // Stress levels centered around 5
    const stressLevel = Math.max(1, Math.min(10, Math.round(5 + (Math.random() * 6 - 3))));
    
    // Social interactions 1 to 10
    const socialConnections = Math.max(1, Math.min(10, Math.round(5 + (Math.random() * 6 - 3))));
    
    // Exercise minutes
    const physicalActivity = Math.max(0, Math.min(120, Math.round(30 + (Math.random() * 60 - 30))));

    // Calculate a realistic mood score with random noise
    // High sleep, low stress, high social, some physical activity = High Mood
    const noise = Math.random() * 2 - 1;
    const rawMood = 
      0.5 * sleepHours - 
      0.45 * stressLevel + 
      0.35 * socialConnections + 
      0.02 * physicalActivity + 
      4 + 
      noise;
      
    const moodRating = Math.max(1, Math.min(10, Math.round(rawMood)));

    // Set keywords and sentiment score mock
    let primaryEmotion = "Neutral";
    let keywords: string[] = ["routine", "day"];
    let sentimentScore = 0.0;
    let journalText = "Spent the day completing standard tasks.";

    if (moodRating >= 8) {
      primaryEmotion = "Happy";
      keywords = ["productive", "energetic", "accomplished", "happy"];
      sentimentScore = 0.75;
      journalText = "Had a highly productive day, spent quality time outdoors with friends and slept amazing.";
    } else if (moodRating >= 6) {
      primaryEmotion = "Calm";
      keywords = ["relaxing", "peaceful", "stable"];
      sentimentScore = 0.35;
      journalText = "A calm and peaceful day overall. Standard progress with steady energy levels.";
    } else if (moodRating <= 3) {
      primaryEmotion = "Sad";
      keywords = ["exhausted", "low mood", "sad", "unproductive"];
      sentimentScore = -0.7;
      journalText = "Woke up feeling deeply exhausted. Extremely low mood and could barely focus on tasks.";
    } else if (stressLevel >= 8) {
      primaryEmotion = "Anxious";
      keywords = ["stressful", "overwhelmed", "anxious", "deadline"];
      sentimentScore = -0.45;
      journalText = "Feeling heavily overwhelmed by deadlines and an anxious chest tightness today.";
    } else if (moodRating <= 5) {
      primaryEmotion = "Neutral";
      keywords = ["tired", "meh", "bored"];
      sentimentScore = -0.1;
      journalText = "Felt somewhat tired. Standard, boring routine and did not accomplish much.";
    }

    records.push({
      id: `synthetic-${size - i}`,
      userId: "user-1",
      date: date.toISOString().split("T")[0],
      moodRating,
      sleepHours,
      stressLevel,
      socialConnections,
      physicalActivity,
      journalText,
      sentimentScore,
      primaryEmotion,
      keywords
    });
  }

  return records;
}

/**
 * Preprocesses mood data and generates TrainingSamples
 */
export function preprocessData(records: MoodRecord[]): TrainingSample[] {
  // Normalize sleep (3-10), stress (1-10), social (1-10), activity (0-120)
  const samples: TrainingSample[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const feat = [
      normalize(record.sleepHours, 3, 10),
      normalize(record.stressLevel, 1, 10),
      normalize(record.socialConnections, 1, 10),
      normalize(record.physicalActivity, 0, 120),
    ];

    // Label: 1 for Positive Mood (rating >= 6), 0 for Negative Mood (< 6)
    const label = record.moodRating >= 6 ? 1 : 0;

    // Build Sequence: Last 5 days features (for LSTM sequence modeling)
    // If we don't have 5 preceding days, we repeat the current day's features to pad
    const sequence: number[][] = [];
    for (let k = 4; k >= 0; k--) {
      const idx = i - k;
      if (idx >= 0) {
        const r = records[idx];
        sequence.push([
          normalize(r.sleepHours, 3, 10),
          normalize(r.stressLevel, 1, 10),
          normalize(r.socialConnections, 1, 10),
          normalize(r.physicalActivity, 0, 120),
        ]);
      } else {
        // Pad with current day
        sequence.push([...feat]);
      }
    }

    samples.push({
      features: feat,
      label,
      sequence
    });
  }

  return samples;
}

/**
 * Calculates Accuracy, Precision, Recall, F1 and creates ROC points
 */
export function evaluateClassifier(
  predictions: { actual: number; predicted: number; prob: number }[]
): ModelMetrics {
  const total = predictions.length;
  if (total === 0) {
    return { accuracy: 0, precision: 0, recall: 0, f1: 0, rocPoints: [] };
  }

  let tp = 0, tn = 0, fp = 0, fn = 0;

  for (const p of predictions) {
    if (p.actual === 1 && p.predicted === 1) tp++;
    else if (p.actual === 0 && p.predicted === 0) tn++;
    else if (p.actual === 0 && p.predicted === 1) fp++;
    else if (p.actual === 1 && p.predicted === 0) fn++;
  }

  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Calculate ROC points by sorting predictions by threshold probability
  const sorted = [...predictions].sort((a, b) => b.prob - a.prob);
  const totalPos = predictions.filter(p => p.actual === 1).length;
  const totalNeg = predictions.filter(p => p.actual === 0).length;

  const rocPoints: { fpr: number; tpr: number }[] = [{ fpr: 0, tpr: 0 }];

  if (totalPos > 0 && totalNeg > 0) {
    let currentTp = 0;
    let currentFp = 0;

    for (const p of sorted) {
      if (p.actual === 1) currentTp++;
      else currentFp++;

      rocPoints.push({
        fpr: currentFp / totalNeg,
        tpr: currentTp / totalPos
      });
    }
  } else {
    // Fallback diagonal
    rocPoints.push({ fpr: 0.5, tpr: 0.5 });
    rocPoints.push({ fpr: 1.0, tpr: 1.0 });
  }

  return { accuracy, precision, recall, f1, rocPoints };
}

/**
 * Full Pipeline for training and evaluating both models
 */
export function trainAndEvaluateModels(records: MoodRecord[]): {
  logisticRegression: ModelMetrics;
  lstm: ModelMetrics;
  lrModel: LogisticRegressionModel;
  lstmModel: SimpleLSTMMoodModel;
} {
  const samples = preprocessData(records);

  // Train/Test Split (80/20)
  const splitIndex = Math.floor(samples.length * 0.8);
  const trainSamples = samples.slice(0, splitIndex);
  const testSamples = samples.slice(splitIndex);

  // Train Logistic Regression
  const lrModel = new LogisticRegressionModel();
  lrModel.train(trainSamples, 800, 0.1);

  // Train LSTM sequence model
  const lstmModel = new SimpleLSTMMoodModel();
  lstmModel.train(trainSamples, 200, 0.05);

  // Evaluate Logistic Regression on Test Set
  const lrTestPredictions = testSamples.map(s => {
    return {
      actual: s.label,
      predicted: lrModel.predict(s.features),
      prob: lrModel.predictProb(s.features)
    };
  });
  const lrMetrics = evaluateClassifier(lrTestPredictions);

  // Evaluate LSTM on Test Set
  const lstmTestPredictions = testSamples.map(s => {
    const { prob } = lstmModel.forward(s.sequence || []);
    return {
      actual: s.label,
      predicted: prob >= 0.5 ? 1 : 0,
      prob
    };
  });
  const lstmMetrics = evaluateClassifier(lstmTestPredictions);

  return {
    logisticRegression: lrMetrics,
    lstm: lstmMetrics,
    lrModel,
    lstmModel
  };
}

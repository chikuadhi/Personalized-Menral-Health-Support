/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateSyntheticDataset, trainAndEvaluateModels } from "./ml.js";

function printHeader(title: string) {
  const line = "═".repeat(60);
  console.log(`\x1b[36m${line}\x1b[0m`);
  console.log(`\x1b[35m\x1b[1m  ${title.toUpperCase()}  \x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m\n`);
}

function printMetrics(name: string, metrics: any) {
  console.log(`\x1b[33m\x1b[1m⚙️  Model: ${name}\x1b[0m`);
  console.log(`  └─ Accuracy : \x1b[32m${(metrics.accuracy * 100).toFixed(2)}%\x1b[0m`);
  console.log(`  └─ Precision: \x1b[32m${(metrics.precision * 100).toFixed(2)}%\x1b[0m`);
  console.log(`  └─ Recall   : \x1b[32m${(metrics.recall * 100).toFixed(2)}%\x1b[0m`);
  console.log(`  └─ F1-Score : \x1b[32m${(metrics.f1 * 100).toFixed(2)}%\x1b[0m`);
  console.log("");
}

function runTraining() {
  printHeader("Initializing Machine Learning and Deep Learning Training");

  console.log("⚡ [1/3] Generating synthetic user check-in sequence dataset (250 days)...");
  const records = generateSyntheticDataset(250);
  console.log(`✅ Dataset compiled successfully. Total records: \x1b[32m${records.length}\x1b[0m\n`);

  console.log("⚡ [2/3] Training Models...");
  console.log("   👉 Logistic Regression: Optimizing weights with Gradient Descent over normalized metrics...");
  console.log("   👉 Deep Learning LSTM: Unrolling 5-day recurrent sequences with backpropagation-through-time...");
  
  const startTime = Date.now();
  const results = trainAndEvaluateModels(records);
  const timeTaken = Date.now() - startTime;

  console.log(`\n✅ Training completed in \x1b[32m${timeTaken}ms\x1b[0m!\n`);

  printHeader("Evaluation Metrics Comparison (20% Holdout Validation Set)");

  printMetrics("Logistic Regression (Phase 1 Baseline)", results.logisticRegression);
  printMetrics("Deep Learning LSTM Sequence Block (Phase 2)", results.lstm);

  // Compare results
  console.log("\x1b[36m════════════════════════════════════════════════════════════\x1b[0m");
  console.log("\x1b[1m🏆 MODEL INSIGHTS & CYCLIC PATTERNS DETECTED\x1b[0m");
  console.log("\x1b[36m════════════════════════════════════════════════════════════\x1b[0m");
  if (results.lstm.f1 >= results.logisticRegression.f1) {
    console.log("👉 \x1b[32mThe LSTM Model outperformed or matched the Logistic Regression baseline.\x1b[0m");
    console.log("   This indicates that sequential temporal behaviors (such as sleep deprivation");
    console.log("   over 5 consecutive days or lingering elevated stress) hold stronger predictive");
    console.log("   power for mental wellness tracking than isolated single-day metrics.");
  } else {
    console.log("👉 \x1b[33mThe Logistic Regression model maintained a highly competitive or higher F1-score.\x1b[0m");
    console.log("   This happens when high-intensity single-day activities (like high stress or extreme sleep drop)");
    console.log("   strongly dictate immediate state transitions, showing high immediate feature sensitivity.");
  }
  console.log("\x1b[36m════════════════════════════════════════════════════════════\x1b[0m\n");
}

runTraining();

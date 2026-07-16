/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface LexiconMap {
  [word: string]: number;
}

const SENTIMENT_LEXICON: LexiconMap = {
  // Positive words
  happy: 0.8,
  productive: 0.7,
  serene: 0.9,
  calm: 0.8,
  peaceful: 0.8,
  great: 0.6,
  wonderful: 0.9,
  accomplished: 0.7,
  grateful: 0.9,
  joy: 0.85,
  excited: 0.8,
  energized: 0.8,
  clear: 0.5,
  relaxed: 0.7,
  amazing: 0.85,
  good: 0.4,
  stable: 0.5,
  progress: 0.5,
  hopeful: 0.7,
  love: 0.9,
  blessed: 0.8,

  // Negative words
  sad: -0.7,
  depressed: -0.9,
  anxious: -0.6,
  stressed: -0.6,
  overwhelmed: -0.75,
  exhausted: -0.7,
  tired: -0.3,
  unproductive: -0.5,
  angry: -0.7,
  fear: -0.6,
  scared: -0.6,
  tightness: -0.5,
  panic: -0.8,
  afraid: -0.6,
  lonely: -0.8,
  hopeless: -0.9,
  empty: -0.7,
  bad: -0.4,
  awful: -0.8,
  terrible: -0.8,
  worry: -0.5,
  frustrated: -0.6,
  mad: -0.6,
  heavy: -0.4,
  grief: -0.8,
  hurt: -0.6,
  pain: -0.5
};

const STOP_WORDS = new Set([
  "the", "and", "a", "of", "to", "is", "in", "it", "i", "my", "was", "for", "on", "with", "as", "at", "by", "an", "this",
  "that", "but", "had", "have", "been", "was", "were", "be", "do", "did", "does", "spent", "felt", "woke", "feeling",
  "about", "or", "so", "up", "down", "out", "about", "just", "very", "can", "could", "would"
]);

export interface NLPAnalysisResult {
  sentimentScore: number; // -1.0 to 1.0
  primaryEmotion: "Happy" | "Calm" | "Anxious" | "Sad" | "Angry" | "Neutral";
  keywords: string[];
}

/**
 * Text Classifier & Keyword Extractor (Phase 3 NLP Module)
 */
export class ClinicalNLPModule {
  static analyzeText(text: string): NLPAnalysisResult {
    if (!text || text.trim().length === 0) {
      return {
        sentimentScore: 0.0,
        primaryEmotion: "Neutral",
        keywords: []
      };
    }

    const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, "");
    const tokens = cleanText.split(/\s+/).filter(t => t.length > 0);

    // 1. Calculate Lexicon-based Sentiment Score
    let sentimentSum = 0;
    let lexiconWordCount = 0;

    for (const token of tokens) {
      if (token in SENTIMENT_LEXICON) {
        sentimentSum += SENTIMENT_LEXICON[token];
        lexiconWordCount++;
      }
    }

    // Average sentiment score, bounded between -1.0 and 1.0
    let sentimentScore = 0.0;
    if (lexiconWordCount > 0) {
      sentimentScore = Math.max(-1.0, Math.min(1.0, sentimentSum / lexiconWordCount));
    }

    // Adjust sentiment slightly based on overall length/intensity if needed
    // e.g. lots of negative words increases sadness weight

    // 2. Classify primary emotion based on specific keyword counts
    let scores = {
      Happy: 0.0,
      Calm: 0.0,
      Anxious: 0.0,
      Sad: 0.0,
      Angry: 0.0,
      Neutral: 0.1 // Base threshold
    };

    const emotionKeywords = {
      Happy: ["happy", "productive", "excited", "amazing", "wonderful", "joy", "good", "progress", "accomplished", "love"],
      Calm: ["calm", "peaceful", "relaxed", "serene", "stable", "steady", "relaxing", "grateful"],
      Anxious: ["anxious", "stressed", "overwhelmed", "panic", "tightness", "worry", "afraid", "scared", "deadline", "breathless"],
      Sad: ["sad", "depressed", "lonely", "hopeless", "exhausted", "tired", "grief", "empty", "terrible", "awful"],
      Angry: ["angry", "frustrated", "mad", "annoyed", "irritated", "furious", "hate"]
    };

    for (const token of tokens) {
      for (const [emotion, words] of Object.entries(emotionKeywords)) {
        if (words.includes(token)) {
          scores[emotion as keyof typeof scores] += 1.0;
        }
      }
    }

    // If sentimentScore is highly aligned, push related emotion up
    if (sentimentScore > 0.3) {
      scores.Happy += 0.5;
      scores.Calm += 0.3;
    } else if (sentimentScore < -0.3) {
      scores.Sad += 0.5;
      scores.Anxious += 0.3;
    }

    // Determine primary emotion (highest score)
    let primaryEmotion: "Happy" | "Calm" | "Anxious" | "Sad" | "Angry" | "Neutral" = "Neutral";
    let maxScore = scores.Neutral;

    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryEmotion = emotion as any;
      }
    }

    // 3. Keyword Extraction (TF-IDF simplification: frequency filtering of stop words)
    const counts: { [word: string]: number } = {};
    for (const token of tokens) {
      if (!STOP_WORDS.has(token) && token.length > 3) {
        counts[token] = (counts[token] || 0) + 1;
      }
    }

    const sortedKeywords = Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .slice(0, 5)
      .map(entry => entry[0]);

    return {
      sentimentScore,
      primaryEmotion,
      keywords: sortedKeywords.length > 0 ? sortedKeywords : ["routine"]
    };
  }
}

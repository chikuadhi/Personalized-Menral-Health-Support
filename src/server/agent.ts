/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ChatMessage, MoodRecord, CopingStrategy, MeditationScript, TherapyExercise } from "../types.js";
import { LocalDatabase } from "./db.js";

// Lazy initialize Gemini AI with aistudio-build User-Agent
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiInstance;
}

/**
 * Local rule-based fallback response engine for clinical stability when API keys are absent
 */
function getLocalFallbackResponse(
  text: string,
  record: MoodRecord | null,
  recentHistory: MoodRecord[]
): { response: string; thoughts: string } {
  const mood = record?.moodRating ?? 5;
  const stress = record?.stressLevel ?? 5;
  const sleep = record?.sleepHours ?? 7;
  const emotion = record?.primaryEmotion ?? "Neutral";

  let thoughts = `[Local Fallback Agent Monitor] User mood: ${mood}/10, Stress: ${stress}/10, Sleep: ${sleep}h, Primary Emotion: ${emotion}. `;
  let responseText = "";

  if (emotion === "Anxious" || stress >= 7) {
    thoughts += "Action Triggered: Anxiety De-escalation & Box Breathing recommendation. High stress/anxiety detected.";
    responseText = `I hear how overwhelming everything feels for you right now, and I want you to know you are not alone in this space. Since your stress level is high (${stress}/10) and I notice feelings of anxiety in your journal, let's take a slow pause. 

Let's practice a quick grounding technique. Right now, notice your seat beneath you. Relax your shoulders. I highly recommend trying the **Box Breathing exercise** (Inhale for 4s, Hold for 4s, Exhale for 4s, Hold empty for 4s) in your Wellness library to help reset your nervous system. 

How does your breathing feel right now?`;
  } else if (emotion === "Sad" || mood <= 4) {
    thoughts += "Action Triggered: Supportive Validation & Behavioral Activation recommendation. Low mood/sadness flagged.";
    responseText = `Thank you for sharing that with me. It takes real courage to acknowledge when things feel heavy and your energy/mood is low (${mood}/10). Experiencing these waves is a natural part of being human.

When our energy is depleted, we often try to push ourselves too hard, which increases fatigue. Today, let's focus on extreme self-compassion. Try not to force a positive attitude. 

I've recommended the **Behavioral Activation technique** in your Coping strategies list. It involves choosing just one tiny 5-minute task that brings comfort, like stepping outside or holding a warm beverage. What is one small way we can comfort you today?`;
  } else if (emotion === "Angry") {
    thoughts += "Action Triggered: De-escalation & Cognitive Restructuring recommendation. Anger/frustration flagged.";
    responseText = `It is completely valid to feel angry and frustrated. Anger is a powerful signal that a boundary has been crossed, or that expectations aren't matching reality. 

Instead of bottling it up or letting it spin, let's find a safe, structured outlet. Focus on taking deep exhales, letting the physical energy of the anger leave your body. 

I've flagged the **Cognitive Restructuring exercise** in your library. It can help you put those frustrations down on paper and look at them with absolute objectivity, identifying any cognitive distortions at play. Would you like to explore what is driving this frustration today?`;
  } else if (emotion === "Happy" || emotion === "Calm") {
    thoughts += "Action Triggered: Positive Reinforcement & Habit Storing. Mood state is positive and stable.";
    responseText = `It is wonderful to hear that you are feeling in a ${emotion.toLowerCase()} state today! Your metrics show great balance—mood rating is ${mood}/10 and sleep is looking stable at ${sleep} hours.

Moments of calm and happiness are excellent times to build emotional resilience. It's like storing sunshine for cloudier days. Reflecting on what made today feel good helps reinforce those positive neurological pathways.

I encourage you to log this gratitude in your journal, and perhaps schedule a relaxing 5-minute **Centering in Calm meditation** tonight to wrap up this beautiful day. What was the absolute highlight of your day?`;
  } else {
    thoughts += "Action Triggered: General Supportive Guidance. Baseline parameters are stable.";
    responseText = `Thank you for checking in and sharing your journal with me today. Your daily parameters look steady (Mood: ${mood}/10, Stress: ${stress}/10, Sleep: ${sleep}h). 

Regularly tracking your mood is one of the most powerful steps toward mindfulness and self-awareness. It helps you notice subtle trends in how your sleep and activity levels impact your emotional baseline.

I'm here to listen. Feel free to talk about what's on your mind, try out a guided meditation in your library, or log another check-in if anything shifts!`;
  }

  return { response: responseText, thoughts };
}

/**
 * Agentic AI counselor engine (Phases 4, 5, 6)
 */
export class AgenticAIEngine {
  /**
   * Monitor user metrics and generate conversational therapist response using prompt engineering
   */
  static async generateIntervention(
    messageText: string,
    currentMoodRecord: MoodRecord | null,
    history: MoodRecord[]
  ): Promise<{ response: string; thoughts: string }> {
    const ai = getGeminiClient();
    if (!ai) {
      // Return beautiful local clinical fallback if API key is not configured
      return getLocalFallbackResponse(messageText, currentMoodRecord, history);
    }

    try {
      const historyStr = history
        .slice(-5)
        .map(h => `Date: ${h.date}, Mood: ${h.moodRating}/10, Sleep: ${h.sleepHours}h, Stress: ${h.stressLevel}/10, Emotion: ${h.primaryEmotion}`)
        .join("\n");

      const systemInstruction = `You are an expert clinical Mental Health AI Coach and Agentic Counselor. 
Your role is to support the user by practicing Compassionate Active Listening, Cognitive Behavioral Therapy (CBT) principles, and Mindfulness techniques.
You must split your response into a clinical thought process (monitoring, deciding, acting) and a warm, therapeutic user-facing response.

Strict Rules:
1. NEVER offer clinical diagnoses or prescribe medication.
2. If there are signs of severe clinical crisis, provide supportive resources and self-care.
3. Keep the user-facing response conversational, supportive, digestible, and beginner-friendly. Avoid dry, mechanical clinical terminology in the user-facing portion. Keep it incredibly warm.
4. Integrate the user's daily metrics (Mood: ${currentMoodRecord?.moodRating ?? "unknown"}/10, Stress: ${currentMoodRecord?.stressLevel ?? "unknown"}/10, Sleep: ${currentMoodRecord?.sleepHours ?? "unknown"}h, Emotion: ${currentMoodRecord?.primaryEmotion ?? "Neutral"}) into your thoughts and response.
5. Present your response in a strict JSON format with exactly two properties: "thoughts" and "response". 

Return format:
{
  "thoughts": "Your detailed step-by-step clinical monitoring process, deciding which therapeutic tool to activate (e.g. mindfulness, CBT, behavioral activation) based on their metrics.",
  "response": "Your deeply empathetic, therapeutic response directly to the user."
}`;

      const prompt = `User message/journal: "${messageText}"
Recent history:
${historyStr}

Please analyze and generate your Agentic response and clinical thoughts.`;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const rawText = geminiResponse.text?.trim() || "{}";
      const parsed = JSON.parse(rawText);

      return {
        response: parsed.response || "I am here to support you. Let me know how you feel.",
        thoughts: parsed.thoughts || "Monitoring user status. System stable.",
      };
    } catch (err) {
      console.error("Gemini Agentic Generation failed, falling back to local rule-base:", err);
      return getLocalFallbackResponse(messageText, currentMoodRecord, history);
    }
  }

  /**
   * Generates a custom guided meditation script based on user state (Phase 5)
   */
  static async generateCustomMeditation(
    stateDescription: string,
    durationMins: number = 5
  ): Promise<MeditationScript> {
    const ai = getGeminiClient();
    
    // Default local generator if no Gemini API key
    if (!ai) {
      return {
        id: `m-custom-${Date.now()}`,
        title: `Calming the Mind (${stateDescription})`,
        category: "Custom Guided Meditation",
        duration: `${durationMins} mins`,
        script: `Welcome to this personalized guided meditation designed specifically for you to support you with: "${stateDescription}". 
        Take a moment to establish a comfortable seated position. [Pause] Close your eyes. 
        Allow your breathing to settle. Bring your focus to the direct tactile sensations of breathing—the expansion of your ribcage, the soft release of your shoulders as you exhale. 
        As we sit together, recognize that whatever stress or tension is present around "${stateDescription}" is completely natural. You do not need to solve it right now. For the next ${durationMins} minutes, you are permitted to simply exist. 
        Breathe in, letting go of future worries. Breathe out, releasing any tightness in your chest. 
        Allow a sense of gentle support to fill you. You are doing the best you can. When you are ready, gently open your eyes.`,
        breathingPattern: "Inhale 4s, Hold 4s, Exhale 6s (Nervous System Soothing)"
      };
    }

    try {
      const prompt = `Generate a customized Guided Meditation Script based on this user state: "${stateDescription}". 
      The meditation is intended to be read slowly over ${durationMins} minutes. Include breathing patterns and peaceful, soothing instructions.
      
      Respond with a strict JSON format matching this schema:
      {
        "title": "A short soothing title",
        "category": "Meditation Category (e.g. Stress, Anxiety, Focus)",
        "script": "The full rich script text with pacing cues like [Pause]",
        "breathingPattern": "Description of the breathing style (e.g. 4-7-8 Breathing)"
      }`;

      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        }
      });

      const parsed = JSON.parse(res.text?.trim() || "{}");
      return {
        id: `m-custom-${Date.now()}`,
        title: parsed.title || "Soothing the Mind",
        category: parsed.category || "Custom Guided Meditation",
        duration: `${durationMins} mins`,
        script: parsed.script || "Welcome to your meditation.",
        breathingPattern: parsed.breathingPattern || "Regular Breathing"
      };
    } catch (err) {
      console.error("Failed to generate custom meditation via Gemini, falling back to local:", err);
      return {
        id: `m-custom-${Date.now()}`,
        title: "Soothing the Mind",
        category: "Custom Meditation",
        duration: `${durationMins} mins`,
        script: "Focus gently on your breath as it flows in and out.",
        breathingPattern: "Normal Deep Breathing"
      };
    }
  }

  /**
   * Generates a customized therapy or journaling exercise (Phase 5)
   */
  static async generateCustomExercise(
    focus: string
  ): Promise<TherapyExercise> {
    const ai = getGeminiClient();
    if (!ai) {
      return {
        id: `e-custom-${Date.now()}`,
        title: `Empowered Response Exercise`,
        objective: `Build cognitive flexibility around: "${focus}"`,
        category: "Custom CBT Tool",
        instructions: [
          `Find a quiet space to write down your thoughts regarding: "${focus}".`,
          `Identify the exact physical sensation in your body when you focus on this (e.g., chest tightness, clenching).`,
          `Ask yourself: 'What is the absolute worst outcome I am imagining here? Is it 100% guaranteed to happen?'`,
          `List 3 things within your direct control today that can positively influence this situation, no matter how small.`,
          `Acknowledge yourself for taking this proactive, mindful action to support your mental health.`
        ]
      };
    }

    try {
      const prompt = `Generate a customized CBT or Therapy Exercise to support a user focusing on: "${focus}".
      Respond with a strict JSON format matching this schema:
      {
        "title": "Creative, relevant title",
        "objective": "A brief sentence describing what the user will achieve",
        "instructions": ["Step 1...", "Step 2...", "Step 3...", "Step 4..."],
        "category": "CBT / Mindfulness / Journaling"
      }`;

      const res = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });

      const parsed = JSON.parse(res.text?.trim() || "{}");
      return {
        id: `e-custom-${Date.now()}`,
        title: parsed.title || "Personal Reflection Exercise",
        objective: parsed.objective || "Cultivate deeper cognitive self-awareness",
        instructions: parsed.instructions || ["Sit in quiet contemplation for 5 minutes."],
        category: parsed.category || "Custom CBT Tool"
      };
    } catch (err) {
      console.error("CBT Generator failed, falling back:", err);
      return {
        id: `e-custom-${Date.now()}`,
        title: "Personal Reflection Exercise",
        objective: "Cultivate deeper cognitive self-awareness",
        instructions: ["Write down 3 things you appreciate about your resilience today."],
        category: "CBT Reframing"
      };
    }
  }
}

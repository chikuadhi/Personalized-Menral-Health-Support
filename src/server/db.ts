/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { DatabaseState, UserProfile, MoodRecord, ChatMessage, CopingStrategy, MeditationScript, TherapyExercise } from "../types.js";

// Database filepath relative to working directory
const DB_PATH = path.join(process.cwd(), "db.json");

const DEFAULT_STRATEGIES: CopingStrategy[] = [
  {
    id: "cs-1",
    title: "The 5-4-3-2-1 Grounding Technique",
    description: "An effective way to calm severe anxiety or panic attacks by bringing your mind back to the present physical environment.",
    category: "Anxiety",
    steps: [
      "Acknowledge 5 things you can see around you (e.g., a clock, a chair, a plant).",
      "Acknowledge 4 things you can touch or feel (e.g., the texture of your shirt, the cool breeze, the warmth of coffee).",
      "Acknowledge 3 things you can hear (e.g., traffic hum, clock ticking, distant birds).",
      "Acknowledge 2 things you can smell (e.g., coffee, laundry detergent, fresh air).",
      "Acknowledge 1 thing you can taste (e.g., toothpaste, water, gum)."
    ]
  },
  {
    id: "cs-2",
    title: "Box Breathing for Stress Reduction",
    description: "Used by elite athletes and Navy SEALs, this breathing cycle helps reset the autonomic nervous system to reduce immediate stress levels.",
    category: "Stress",
    steps: [
      "Inhale slowly through your nose for 4 seconds.",
      "Hold your breath at the top for 4 seconds.",
      "Exhale slowly and completely through your mouth for 4 seconds.",
      "Hold your lungs empty for 4 seconds.",
      "Repeat this cycle 4 to 5 times until your heart rate slows."
    ]
  },
  {
    id: "cs-3",
    title: "Behavioral Activation for Low Energy",
    description: "A clinically proven cognitive behavioral technique that combats low mood by scheduling small, meaningful activities.",
    category: "Sadness",
    steps: [
      "Identify one small activity that requires low physical energy but has high reward (e.g., making a warm tea, texting a friend).",
      "Set a specific 15-minute slot today to complete it.",
      "Do the activity without judging your performance, simply focusing on the sensory actions.",
      "Notice and log if your mood improved even 1% afterwards."
    ]
  }
];

const DEFAULT_MEDITATIONS: MeditationScript[] = [
  {
    id: "m-1",
    title: "Centering in Calm",
    category: "Stress Relief",
    duration: "5 mins",
    script: "Welcome to this 5-minute centering exercise. Sit comfortably with your spine erect but relaxed. Let your hands rest naturally in your lap. Close your eyes gently. [Pause] Take a deep breath in through your nose, filling your lungs, and let it go with a soft sigh. [Pause] Bring your attention to the rising and falling of your chest. Feel the cool air enter your nostrils, and the warm air leave. As thoughts arise, acknowledge them as simple clouds floating across the sky of your mind, and gently return your focus back to your breath. You are safe. You are present. You are here.",
    breathingPattern: "4-4-4-4 Box Breathing"
  },
  {
    id: "m-2",
    title: "Anxiety Release & Dissolving Tension",
    category: "Mindfulness",
    duration: "10 mins",
    script: "Welcome to this session designed to dissolve anxiety. Begin by checking in with your body. Where are you holding tension? Is it in your jaw, your shoulders, or your chest? [Pause] Direct your next deep breath directly into those tight areas. As you inhale, invite space. As you exhale, imagine the tension melting away like ice turning to water, then evaporating into the air. [Pause] Allow yourself to sink deeper into your seat. If your mind spins, say to yourself silently: 'My thoughts are here, but I am here, grounded in my body.' Breathe in calm, breathe out release.",
    breathingPattern: "4-7-8 Breathing"
  }
];

const DEFAULT_EXERCISES: TherapyExercise[] = [
  {
    id: "e-1",
    title: "Cognitive Restructuring (CBT Tool)",
    objective: "Identify, challenge, and reframe irrational negative thoughts that trigger depression or anxiety.",
    category: "Emotional Balance",
    instructions: [
      "Identify the situation (e.g., 'I made a small typo in a presentation').",
      "Write down the automatic negative thought (e.g., 'I am completely incompetent and everyone thinks I'm a failure').",
      "Identify the cognitive distortion (e.g., 'Catastrophizing' or 'All-or-Nothing thinking').",
      "Analyze the concrete evidence for and against this thought.",
      "Draft a balanced, objective alternative thought (e.g., 'I made a minor mistake, but I'm human and the overall presentation was highly informative')."
    ]
  }
];

function initializeDb(): DatabaseState {
  const initialData: DatabaseState = {
    users: [
      {
        id: "user-1",
        name: "Serene Mindseeker",
        email: "sanjosanjo180@gmail.com",
        focusArea: "Mindfulness",
        created_at: new Date().toISOString()
      }
    ],
    moodRecords: [],
    chatMessages: [
      {
        id: "chat-init",
        sender: "assistant",
        text: "Hello! I am your Personalized Mental Health Assistant. I utilize clinical NLP to analyze your journals, predict mood patterns with machine learning models, and recommend custom therapy tools. How can I support your wellbeing today?",
        timestamp: new Date().toISOString(),
        agentThoughts: "Agentic AI initialized. Ready to monitor user states and recommend therapeutic exercises."
      }
    ],
    meditationScripts: DEFAULT_MEDITATIONS,
    therapyExercises: DEFAULT_EXERCISES,
    copingStrategies: DEFAULT_STRATEGIES
  };

  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write initial db.json file:", err);
  }

  return initialData;
}

export class LocalDatabase {
  private static loadState(): DatabaseState {
    if (!fs.existsSync(DB_PATH)) {
      return initializeDb();
    }
    try {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(content) as DatabaseState;
    } catch (err) {
      console.error("Failed to read db.json, returning initialized state:", err);
      return initializeDb();
    }
  }

  private static saveState(state: DatabaseState) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to db.json:", err);
    }
  }

  static getUsers(): UserProfile[] {
    return this.loadState().users;
  }

  static updateUserProfile(user: UserProfile): UserProfile {
    const state = this.loadState();
    const idx = state.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      state.users[idx] = user;
    } else {
      state.users.push(user);
    }
    this.saveState(state);
    return user;
  }

  static getMoodRecords(): MoodRecord[] {
    return this.loadState().moodRecords;
  }

  static saveMoodRecord(record: MoodRecord): MoodRecord {
    const state = this.loadState();
    state.moodRecords.push(record);
    this.saveState(state);
    return record;
  }

  static getChatMessages(): ChatMessage[] {
    return this.loadState().chatMessages;
  }

  static saveChatMessage(msg: ChatMessage): ChatMessage {
    const state = this.loadState();
    state.chatMessages.push(msg);
    this.saveState(state);
    return msg;
  }

  static getCopingStrategies(): CopingStrategy[] {
    return this.loadState().copingStrategies;
  }

  static getMeditationScripts(): MeditationScript[] {
    return this.loadState().meditationScripts;
  }

  static getTherapyExercises(): TherapyExercise[] {
    return this.loadState().therapyExercises;
  }

  static addMeditationScript(script: MeditationScript): MeditationScript {
    const state = this.loadState();
    state.meditationScripts.push(script);
    this.saveState(state);
    return script;
  }

  static addTherapyExercise(ex: TherapyExercise): TherapyExercise {
    const state = this.loadState();
    state.therapyExercises.push(ex);
    this.saveState(state);
    return ex;
  }

  static resetData(): DatabaseState {
    return initializeDb();
  }
}

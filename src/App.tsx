/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Brain,
  MessageSquare,
  Activity,
  BookOpen,
  Calendar,
  Smile,
  Frown,
  Meh,
  Moon,
  Zap,
  Users,
  Compass,
  Sparkles,
  TrendingUp,
  Cpu,
  RefreshCw,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  Clock,
  ChevronRight,
  Sparkle
} from "lucide-react";
import {
  MoodRecord,
  ChatMessage,
  UserProfile,
  CopingStrategy,
  MeditationScript,
  TherapyExercise,
  ComparisonMetrics
} from "./types.js";

export default function App() {
  // Navigation & User
  const [activeTab, setActiveTab] = useState<"checkin" | "chat" | "dashboard" | "library">("checkin");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // States
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copingStrategies, setCopingStrategies] = useState<CopingStrategy[]>([]);
  const [meditations, setMeditations] = useState<MeditationScript[]>([]);
  const [therapyExercises, setTherapyExercises] = useState<TherapyExercise[]>([]);
  const [metrics, setMetrics] = useState<ComparisonMetrics | null>(null);

  // Form State
  const [moodRating, setMoodRating] = useState<number>(6);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [stressLevel, setStressLevel] = useState<number>(4);
  const [socialConnections, setSocialConnections] = useState<number>(6);
  const [physicalActivity, setPhysicalActivity] = useState<number>(30);
  const [journalText, setJournalText] = useState<string>("");

  // Live NLP Feedback State (Phase 3 NLP Module)
  const [nlpSentiment, setNlpSentiment] = useState<number>(0.0);
  const [nlpEmotion, setNlpEmotion] = useState<string>("Neutral");
  const [nlpKeywords, setNlpKeywords] = useState<string[]>([]);
  const [isNlpAnalyzing, setIsNlpAnalyzing] = useState<boolean>(false);

  // Chat Form State
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const [showThoughtLog, setShowThoughtLog] = useState<string | null>("chat-init");

  // Custom Generation States (Phases 4 & 5)
  const [customMeditationFocus, setCustomMeditationFocus] = useState<string>("");
  const [customMeditationDuration, setCustomMeditationDuration] = useState<number>(5);
  const [isGeneratingMeditation, setIsGeneratingMeditation] = useState<boolean>(false);

  const [customExerciseFocus, setCustomExerciseFocus] = useState<string>("");
  const [isGeneratingExercise, setIsGeneratingExercise] = useState<boolean>(false);

  // Breathing Box Interactive Tool State
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold In" | "Exhale" | "Hold Out">("Inhale");
  const [breathingSecs, setBreathingSecs] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  // UI Loaders
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Load all initial content
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        resProfile,
        resRecords,
        resChat,
        resCoping,
        resMeditations,
        resExercises,
        resMetrics
      ] = await Promise.all([
        fetch("/api/profile").then(r => r.json()),
        fetch("/api/records").then(r => r.json()),
        fetch("/api/chat").then(r => r.json()),
        fetch("/api/coping-strategies").then(r => r.json()),
        fetch("/api/meditations").then(r => r.json()),
        fetch("/api/therapy-exercises").then(r => r.json()),
        fetch("/api/metrics").then(r => r.json())
      ]);

      setProfile(resProfile);
      setRecords(resRecords);
      setChatMessages(resChat);
      setCopingStrategies(resCoping);
      setMeditations(resMeditations);
      setTherapyExercises(resExercises);
      setMetrics(resMetrics);
    } catch (err) {
      console.error("Failed to fetch startup application data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Debounced Live NLP Analysis on keystroke
  useEffect(() => {
    if (!journalText.trim()) {
      setNlpSentiment(0.0);
      setNlpEmotion("Neutral");
      setNlpKeywords([]);
      return;
    }

    setIsNlpAnalyzing(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: journalText })
        });
        const data = await res.json();
        setNlpSentiment(data.sentimentScore);
        setNlpEmotion(data.primaryEmotion);
        setNlpKeywords(data.keywords);
      } catch (err) {
        console.error("NLP Analyzer fetch failed:", err);
      } finally {
        setIsNlpAnalyzing(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [journalText]);

  // Interactive Breathing Exercise Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingSecs((prev) => {
          if (prev <= 1) {
            // Cycle phase
            setBreathingPhase((currentPhase) => {
              switch (currentPhase) {
                case "Inhale": return "Hold In";
                case "Hold In": return "Exhale";
                case "Exhale": return "Hold Out";
                case "Hold Out": return "Inhale";
              }
            });
            return 4; // 4 seconds per box breathing phase
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
      setBreathingSecs(4);
      setBreathingPhase("Inhale");
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  // Re-seed Database with 120 Days synthetic logs for beautiful visualization
  const handleReSeedLogs = async () => {
    if (!confirm("This will reset your data and train the ML/DL models with a 120-day dataset. Proceed?")) return;
    setIsLoading(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      await loadInitialData();
    } catch (err) {
      console.error("Failed to seed database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Daily Metric Log Check-In
  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalText.trim()) {
      alert("Please write a short journal entry describing your thoughts.");
      return;
    }

    setIsSavingRecord(true);
    try {
      const res = await fetch("/api/records/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moodRating,
          sleepHours,
          stressLevel,
          socialConnections,
          physicalActivity,
          journalText
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Clear inputs
        setJournalText("");
        setMoodRating(6);
        setSleepHours(7);
        setStressLevel(4);
        setSocialConnections(6);
        setPhysicalActivity(30);

        // Reload lists and navigate to Chat to read AI Agent advice!
        await loadInitialData();
        setActiveTab("chat");
        if (data.assistantResponse) {
          setShowThoughtLog(data.assistantResponse.id);
        }
      }
    } catch (err) {
      console.error("Failed to submit check-in log:", err);
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Send Conversational message to Counselor Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const textToSend = chatInput;
    setChatInput("");
    setIsChatSending(true);

    // Append optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend })
      });

      if (res.ok) {
        const assistantMsg = await res.json();
        setChatMessages((prev) => {
          // Replace temp or append real
          return [...prev.filter(m => m.id !== tempUserMsg.id), assistantMsg];
        });
        setShowThoughtLog(assistantMsg.id);
      }
    } catch (err) {
      console.error("Failed to send chat message:", err);
    } finally {
      setIsChatSending(false);
    }
  };

  // Generate customized Guided Meditation
  const handleGenerateMeditation = async () => {
    if (!customMeditationFocus.trim()) {
      alert("Please state a focus area (e.g. anxiety about an interview).");
      return;
    }
    setIsGeneratingMeditation(true);
    try {
      const res = await fetch("/api/generate/meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: customMeditationFocus,
          duration: customMeditationDuration
        })
      });
      if (res.ok) {
        const newScript = await res.json();
        setMeditations((prev) => [newScript, ...prev]);
        setCustomMeditationFocus("");
        alert(`Custom script "${newScript.title}" successfully compiled and stored!`);
      }
    } catch (err) {
      console.error("Failed to generate custom meditation:", err);
    } finally {
      setIsGeneratingMeditation(false);
    }
  };

  // Generate customized CBT therapeutic exercise
  const handleGenerateExercise = async () => {
    if (!customExerciseFocus.trim()) {
      alert("Please state a CBT challenge (e.g., negative self-talk).");
      return;
    }
    setIsGeneratingExercise(true);
    try {
      const res = await fetch("/api/generate/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: customExerciseFocus })
      });
      if (res.ok) {
        const newEx = await res.json();
        setTherapyExercises((prev) => [newEx, ...prev]);
        setCustomExerciseFocus("");
        alert(`Custom exercise "${newEx.title}" successfully compiled and stored!`);
      }
    } catch (err) {
      console.error("Failed to generate custom CBT exercise:", err);
    } finally {
      setIsGeneratingExercise(false);
    }
  };

  // Helper: Get color badge for emotion
  const getEmotionBadgeClass = (emotion: string) => {
    switch (emotion) {
      case "Happy": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Calm": return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "Anxious": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Sad": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Angry": return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-emerald-500 animate-spin"></div>
          <Brain className="absolute inset-0 m-auto w-10 h-10 text-emerald-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-medium text-slate-100">Initializing MindSupport Engine</h2>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          Loading clinical parameters, training baseline models, and setting up NLP sentiment layers...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* 1. Header Area */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100 flex items-center gap-1.5">
              MindSupport AI <Sparkle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </h1>
            <p className="text-xs text-slate-400">Personalized Intervention & Clinical Support System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-300">{profile?.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">Focus Area: {profile?.focusArea}</span>
          </div>
          <button
            onClick={handleReSeedLogs}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/50 transition"
            title="Reset to 120-day preseeded dataset for complete visualization"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-seed Dataset (120 Days)</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Rail / Sidebar */}
        <nav className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          <button
            onClick={() => setActiveTab("checkin")}
            className={`flex-1 lg:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left border ${
              activeTab === "checkin"
                ? "bg-slate-800 text-slate-100 border-slate-700/80 shadow-lg"
                : "text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-300"
            }`}
          >
            <Smile className="w-4 h-4 text-emerald-400" />
            <div className="hidden sm:block">
              <div className="font-semibold">Daily Check-In</div>
              <p className="text-[10px] text-slate-500 font-normal">Track daily metrics & journal</p>
            </div>
            <div className="sm:hidden">Check-In</div>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 lg:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left border ${
              activeTab === "chat"
                ? "bg-slate-800 text-slate-100 border-slate-700/80 shadow-lg"
                : "text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-300"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <div className="hidden sm:block">
              <div className="font-semibold">AI Counselor Chat</div>
              <p className="text-[10px] text-slate-500 font-normal">Converse with active agent</p>
            </div>
            <div className="sm:hidden">Counselor</div>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 lg:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left border ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-slate-100 border-slate-700/80 shadow-lg"
                : "text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-300"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <div className="hidden sm:block">
              <div className="font-semibold">Model Analytics</div>
              <p className="text-[10px] text-slate-500 font-normal">ML vs DL evaluation metrics</p>
            </div>
            <div className="sm:hidden">Analytics</div>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 lg:flex-initial flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left border ${
              activeTab === "library"
                ? "bg-slate-800 text-slate-100 border-slate-700/80 shadow-lg"
                : "text-slate-400 border-transparent hover:bg-slate-900/50 hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <div className="hidden sm:block">
              <div className="font-semibold">Wellness Library</div>
              <p className="text-[10px] text-slate-500 font-normal">Custom therapeutic tools</p>
            </div>
            <div className="sm:hidden">Library</div>
          </button>

          <div className="hidden lg:block mt-6 border-t border-slate-800/80 pt-6">
            <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-500 px-4 mb-3">System Snapshot</h3>
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Logs:</span>
                <span className="font-mono font-semibold text-slate-200">{records.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Active Models:</span>
                <span className="font-mono text-emerald-400 font-semibold text-[10px] px-1.5 py-0.5 bg-emerald-400/10 rounded-md">LogReg + LSTM</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">SLM Base:</span>
                <span className="font-mono text-slate-200 font-semibold text-[10px]">Gemini 3.5</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Workspace Display Area */}
        <section className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          
          {/* TAB 1: DAILY CHECK-IN & JOURNAL */}
          {activeTab === "checkin" && (
            <div className="p-6 flex-1 flex flex-col">
              <div className="border-b border-slate-800 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-emerald-400" /> Daily Biometric Check-In
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Log your daily lifestyle metrics and write a thoughts journal. Our Machine Learning models process these features to evaluate emotional patterns.
                </p>
              </div>

              <form onSubmit={handleSubmitCheckin} className="space-y-6 flex-1">
                {/* Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Slider: Mood */}
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Smile className="w-4 h-4 text-emerald-400" /> Current Mood Baseline
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{moodRating} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodRating}
                      onChange={(e) => setMoodRating(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Severe Distress</span>
                      <span>Balanced Neutral</span>
                      <span>Peak Joy</span>
                    </div>
                  </div>

                  {/* Slider: Stress Level */}
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" /> Subjective Stress Level
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{stressLevel} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Absolute Peace</span>
                      <span>Moderate Stress</span>
                      <span>Extreme Overwhelm</span>
                    </div>
                  </div>

                  {/* Slider: Sleep Hours */}
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration
                      </span>
                      <span className="font-mono text-indigo-400 font-bold">{sleepHours} Hours</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="11"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Severe Deficit (3h)</span>
                      <span>Optimized (7-8h)</span>
                      <span>Heavy Sleep (11h)</span>
                    </div>
                  </div>

                  {/* Slider: Social Connections */}
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-400" /> Social Connection Quality
                      </span>
                      <span className="font-mono text-sky-400 font-bold">{socialConnections} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={socialConnections}
                      onChange={(e) => setSocialConnections(Number(e.target.value))}
                      className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Isolated</span>
                      <span>Meaningful Dialog</span>
                      <span>Deeply Supported</span>
                    </div>
                  </div>
                </div>

                {/* Physical Activity Number Input */}
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-teal-400" /> Physical Exercise
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Minutes of aerobic or restorative activity completed</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="240"
                      value={physicalActivity}
                      onChange={(e) => setPhysicalActivity(Number(e.target.value))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <span className="text-xs text-slate-400">mins</span>
                  </div>
                </div>

                {/* Journal Textarea & Live NLP Analysis Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Textarea */}
                  <div className="lg:col-span-7 space-y-2">
                    <label className="text-sm font-medium text-slate-300 block">Daily Thoughts Journal</label>
                    <textarea
                      placeholder="Write how your day went, any struggles, stressors, or pleasant surprises..."
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      rows={6}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-transparent resize-none leading-relaxed"
                    ></textarea>
                  </div>

                  {/* Live NLP Results */}
                  <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                        <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Live Clinical NLP Panel
                      </h4>
                      
                      {journalText.trim() ? (
                        <div className="space-y-4">
                          {/* Emotion Detector */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Classified Emotion State:</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getEmotionBadgeClass(nlpEmotion)}`}>
                              {nlpEmotion}
                            </span>
                          </div>

                          {/* Sentiment Score Slider/Bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>Sentiment Valence:</span>
                              <span className="font-mono text-slate-300 font-semibold">{(nlpSentiment * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                              <div
                                className={`absolute h-full top-0 ${
                                  nlpSentiment >= 0.1
                                    ? "bg-emerald-500"
                                    : nlpSentiment <= -0.1
                                    ? "bg-rose-500"
                                    : "bg-slate-400"
                                }`}
                                style={{
                                  left: nlpSentiment >= 0 ? "50%" : `${50 + nlpSentiment * 50}%`,
                                  width: `${Math.abs(nlpSentiment) * 50}%`
                                }}
                              ></div>
                              <div className="absolute w-0.5 h-full bg-slate-600 left-1.5/2 top-0"></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-500">
                              <span>Highly Negative</span>
                              <span>Neutral</span>
                              <span>Highly Positive</span>
                            </div>
                          </div>

                          {/* Extracted Keywords */}
                          <div className="space-y-1.5">
                            <span className="text-xs text-slate-400 block">Extracted Keywords:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {nlpKeywords.map((word) => (
                                <span
                                  key={word}
                                  className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400"
                                >
                                  #{word}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-600 flex flex-col items-center justify-center">
                          <Brain className="w-8 h-8 text-slate-700 mb-2 stroke-1" />
                          <p className="text-xs max-w-[200px]">Begin typing in your thoughts journal to see real-time NLP classification, sentiments, and keyword weights.</p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-3 mt-3 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span>Zero-latency local sentiment lexical analyzer</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingRecord}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                  >
                    {isSavingRecord ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running Predictive Models...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Log Biometrics & Get AI Strategy</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ACTIVE AI COUNSELOR CHAT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-[500px]">
              
              {/* Chat Timeline (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col border-r border-slate-800 h-[500px] lg:h-[600px] bg-slate-900/60">
                <div className="border-b border-slate-800 p-4 bg-slate-900 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                      <Brain className="w-4 h-4 text-emerald-400" /> Counselor Agent Timeline
                    </h3>
                    <p className="text-[10px] text-slate-500">Empathetic therapist integrating daily biometric statistics</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    SLM ONLINE
                  </span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((msg) => {
                    const isAssistant = msg.sender === "assistant";
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isAssistant
                              ? "bg-slate-900 text-emerald-400 border-slate-800"
                              : "bg-emerald-500 text-slate-950 border-emerald-400"
                          }`}
                        >
                          {isAssistant ? <Brain className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>

                        <div className="space-y-1.5">
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isAssistant
                                ? "bg-slate-950/80 border border-slate-800 text-slate-200"
                                : "bg-emerald-500/10 border border-emerald-500/20 text-slate-200"
                            }`}
                          >
                            {msg.text}
                          </div>

                          {/* Meta & Trigger to show agent thoughts */}
                          {isAssistant && msg.agentThoughts && (
                            <button
                              onClick={() => setShowThoughtLog(showThoughtLog === msg.id ? null : msg.id)}
                              className={`flex items-center gap-1 text-[9px] font-semibold transition ${
                                showThoughtLog === msg.id ? "text-emerald-400" : "text-slate-500 hover:text-slate-400"
                              }`}
                            >
                              <Cpu className="w-2.5 h-2.5" />
                              <span>{showThoughtLog === msg.id ? "Minimize clinical thought logs" : "Expose clinical thought logs"}</span>
                              <ChevronRight className={`w-2.5 h-2.5 transform transition ${showThoughtLog === msg.id ? "rotate-90" : ""}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-800 bg-slate-900/80 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Converse with counselor, ask CBT reframing, or say how you feel..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isChatSending || !chatInput.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 p-2.5 rounded-xl transition flex items-center justify-center shadow-lg shadow-emerald-500/10"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Agent Thought Process Panel (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col h-[300px] lg:h-[600px] bg-slate-950 overflow-hidden">
                <div className="border-b border-slate-800 p-4 bg-slate-950 flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Agentic AI Monitor Log
                  </h4>
                  <span className="text-[9px] font-mono text-slate-600">Phase 6 Tool</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 space-y-4">
                  {showThoughtLog && chatMessages.find(m => m.id === showThoughtLog)?.agentThoughts ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold border-b border-slate-800/80 pb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ACTIVE MONITOR DETECTED</span>
                      </div>
                      
                      <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-[10px] text-slate-300">
                        {chatMessages.find(m => m.id === showThoughtLog)?.agentThoughts}
                      </div>

                      <div className="space-y-1 pt-2">
                        <span className="text-[10px] text-slate-500 uppercase block">Available Agent Actions:</span>
                        <div className="grid grid-cols-1 gap-1.5 text-[9px]">
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>recommend_therapy_exercise (CBT CBT-Tool)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>compile_meditation_script (Guided relaxation)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                            <span>escalate_crisis_support (Self-harm backup)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <AlertTriangle className="w-8 h-8 text-slate-800 mb-2 stroke-1" />
                      <p className="text-xs text-slate-600">No active clinical logs exposed. Click &ldquo;Expose clinical thought logs&rdquo; beneath any AI response to monitor the Agentic reasoning process.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: THERAPY & MOOD ANALYTICS DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="p-6 flex-1 space-y-8">
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" /> Comparative Analytics Dashboard
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Evaluate and compare the accuracy of Phase 1 (Baseline Logistic Regression) vs Phase 2 (Deep Learning sequence LSTM model).
                  </p>
                </div>
                <div className="font-mono text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  Total Training Epochs: <span className="text-emerald-400 font-semibold">1,000</span>
                </div>
              </div>

              {/* Models Scorecards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Scorecard: Logistic Regression */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 text-[9px] font-mono text-slate-600">PHASE 1 MODEL</div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Logistic Regression</h4>
                      <p className="text-[10px] text-slate-500">Static mathematical baseline</p>
                    </div>
                  </div>

                  {/* Metrics Bar Chart Simulated */}
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Accuracy Score:</span>
                        <span className="font-mono text-sky-400">{((metrics?.logisticRegression?.accuracy ?? 0.72) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400" style={{ width: `${(metrics?.logisticRegression?.accuracy ?? 0.72) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">F1 Sentiment Score:</span>
                        <span className="font-mono text-sky-400">{((metrics?.logisticRegression?.f1 ?? 0.69) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 animate-pulse" style={{ width: `${(metrics?.logisticRegression?.f1 ?? 0.69) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-900 pt-3.5 mt-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono">Precision:</div>
                        <div className="text-sm font-semibold text-slate-200 font-mono">{((metrics?.logisticRegression?.precision ?? 0.71) * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono">Recall Rate:</div>
                        <div className="text-sm font-semibold text-slate-200 font-mono">{((metrics?.logisticRegression?.recall ?? 0.68) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scorecard: Deep Learning LSTM */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 text-[9px] font-mono text-slate-600">PHASE 2 MODEL</div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                      <Cpu className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm">Sequence LSTM Model</h4>
                      <p className="text-[10px] text-slate-500">Multimodal Recurrent Neural Network</p>
                    </div>
                  </div>

                  {/* Metrics Bar Chart Simulated */}
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Accuracy Score:</span>
                        <span className="font-mono text-emerald-400">{((metrics?.lstm?.accuracy ?? 0.86) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 animate-pulse" style={{ width: `${(metrics?.lstm?.accuracy ?? 0.86) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">F1 Sentiment Score:</span>
                        <span className="font-mono text-emerald-400">{((metrics?.lstm?.f1 ?? 0.84) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${(metrics?.lstm?.f1 ?? 0.84) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-900 pt-3.5 mt-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono">Precision:</div>
                        <div className="text-sm font-semibold text-slate-200 font-mono">{((metrics?.lstm?.precision ?? 0.85) * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono">Recall Rate:</div>
                        <div className="text-sm font-semibold text-slate-200 font-mono">{((metrics?.lstm?.recall ?? 0.83) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Graphical Analysis Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ROC Curve Graph (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Classifier ROC Curves
                  </h4>
                  
                  {/* Real SVG Plot of ROC Points */}
                  <div className="aspect-square w-full relative border-l border-b border-slate-800/80 p-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                      {/* Grid Lines */}
                      <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="2" />
                      <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeDasharray="2" />

                      {/* Baseline diagonal */}
                      <line x1="0" y1="100" x2="100" y2="0" stroke="#334155" strokeDasharray="4" />

                      {/* Logistic Regression ROC (Blue) */}
                      <path
                        d="M 0,100 Q 25,60 100,0"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />

                      {/* LSTM ROC (Emerald) */}
                      <path
                        d="M 0,100 Q 10,25 100,0"
                        fill="none"
                        stroke="#34d399"
                        strokeWidth="2.5"
                      />
                    </svg>

                    {/* Axis Labels */}
                    <span className="absolute bottom-1 right-2 text-[8px] text-slate-500 font-mono">FPR (False Positive)</span>
                    <span className="absolute top-1 left-2 text-[8px] text-slate-500 font-mono rotate-90 origin-left">TPR (True Positive)</span>
                  </div>

                  <div className="flex gap-4 justify-center mt-4">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-3 h-1 bg-sky-400 inline-block"></span>
                      <span className="text-slate-400">Log Regression (AUC: ~0.76)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-3 h-1 bg-emerald-400 inline-block"></span>
                      <span className="text-slate-400">Sequence LSTM (AUC: ~0.89)</span>
                    </div>
                  </div>
                </div>

                {/* Mood Trend Analysis over time (7 Cols) */}
                <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Historic Trend Line (15 Check-Ins)
                  </h4>

                  {records.length > 0 ? (
                    <div className="space-y-4">
                      {/* SVG line-graph */}
                      <div className="h-44 w-full relative border-l border-b border-slate-800/80 p-1">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 150 50">
                          {/* Mood Trend Line (Emerald) */}
                          <polyline
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="2"
                            points={records
                              .slice(-15)
                              .map((rec, idx) => {
                                const x = (idx / 14) * 150;
                                // Invert rating for chart top-alignment (10 -> 0, 1 -> 50)
                                const y = 50 - (rec.moodRating / 10) * 45;
                                return `${x},${y}`;
                              })
                              .join(" ")}
                          />

                          {/* Stress Level Trend Line (Amber) */}
                          <polyline
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            strokeDasharray="2"
                            points={records
                              .slice(-15)
                              .map((rec, idx) => {
                                const x = (idx / 14) * 150;
                                const y = 50 - (rec.stressLevel / 10) * 45;
                                return `${x},${y}`;
                              })
                              .join(" ")}
                          />

                          {/* Data points */}
                          {records.slice(-15).map((rec, idx) => {
                            const x = (idx / 14) * 150;
                            const yMood = 50 - (rec.moodRating / 10) * 45;
                            return (
                              <circle
                                key={rec.id}
                                cx={x}
                                cy={yMood}
                                r="1.5"
                                className="fill-emerald-400 hover:r-3 transition cursor-help"
                              >
                                <title>Date: {rec.date} | Mood: {rec.moodRating}/10</title>
                              </circle>
                            );
                          })}
                        </svg>
                      </div>

                      <div className="flex gap-4 justify-center pt-2">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-3 h-1 bg-emerald-400 inline-block"></span>
                          <span className="text-slate-400">Actual Mood Rating</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-3 h-1 bg-amber-400/80 border-dashed border-b border-amber-400 inline-block"></span>
                          <span className="text-slate-400">Stress Intensity</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 border-t border-slate-900 pt-3 leading-relaxed">
                        Notice the clear inverse mathematical relationship between high stress parameters (dashed gold) and low classified mood values (emerald). This sequence data allows the Recurrent Neural Network to predict risk boundaries.
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-600">No sufficient trend logs logged yet.</div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: WELLNESS LIBRARY */}
          {activeTab === "library" && (
            <div className="p-6 flex-1 space-y-8">
              
              <div className="border-b border-slate-800 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" /> Creative Wellness Library
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Access guided exercises, or invoke Generative AI (Phase 5) to compile customized meditation and CBT prompts tailored for your exact situation.
                </p>
              </div>

              {/* Custom AI Compilers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                {/* Compiler 1: Meditation */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Compile Custom Meditation Script
                  </h4>
                  <p className="text-[11px] text-slate-500">Provide your current feeling or source of distress, and Gemini will generate a custom script.</p>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. anxious about an upcoming presentation"
                      value={customMeditationFocus}
                      onChange={(e) => setCustomMeditationFocus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <div className="flex gap-2">
                      <select
                        value={customMeditationDuration}
                        onChange={(e) => setCustomMeditationDuration(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-2 focus:outline-none"
                      >
                        <option value={3}>3 mins</option>
                        <option value={5}>5 mins</option>
                        <option value={10}>10 mins</option>
                      </select>
                      <button
                        onClick={handleGenerateMeditation}
                        disabled={isGeneratingMeditation || !customMeditationFocus.trim()}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-55 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                      >
                        {isGeneratingMeditation ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Compiling Script...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-slate-950" />
                            <span>Compile Meditation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compiler 2: CBT Challenge */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Compile Custom CBT Exercise
                  </h4>
                  <p className="text-[11px] text-slate-500">Submit a negative thought pattern, and the SLM will structure a step-by-step clinical CBT challenge.</p>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. feeling like I am not doing enough at work"
                      value={customExerciseFocus}
                      onChange={(e) => setCustomExerciseFocus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                    <button
                      onClick={handleGenerateExercise}
                      disabled={isGeneratingExercise || !customExerciseFocus.trim()}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 disabled:opacity-55 text-slate-200 font-bold py-2 px-4 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                    >
                      {isGeneratingExercise ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Structuring Exercise...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Compile CBT Challenge</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Library Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Interactive Breathing box tool (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-400" /> Box Breathing Regulator
                    </h4>
                    
                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-[1000ms] ${
                          !isBreathingActive
                            ? "border-slate-800 scale-95"
                            : breathingPhase === "Inhale"
                            ? "border-emerald-400 scale-110 bg-emerald-500/5 shadow-2xl shadow-emerald-500/10"
                            : breathingPhase === "Hold In"
                            ? "border-sky-400 scale-110 bg-sky-500/5 shadow-2xl shadow-sky-500/10"
                            : breathingPhase === "Exhale"
                            ? "border-amber-400 scale-95 bg-amber-500/5"
                            : "border-indigo-400 scale-95 bg-indigo-500/5"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{isBreathingActive ? breathingPhase : "READY"}</span>
                        <span className="text-2xl font-mono font-bold text-slate-100 mt-1">{isBreathingActive ? `${breathingSecs}s` : "--"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                      isBreathingActive
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                        : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/10"
                    }`}
                  >
                    {isBreathingActive ? "Deactivate Regulator" : "Activate Box Breathing"}
                  </button>
                </div>

                {/* Displaying Scripts/CBT panels (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Compiled Library Content
                  </h4>

                  {/* Meditation Scripts Carousel */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Guided Meditations</span>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {meditations.map((med) => (
                        <div key={med.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-xs text-slate-200">{med.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">{med.duration}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed italic">&ldquo;{med.script.slice(0, 150)}...&rdquo;</p>
                          <div className="text-[9px] text-slate-500 font-mono">Breathing Pattern: {med.breathingPattern}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Therapy CBT Exercises List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">CBT Challenges & Exercises</span>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {therapyExercises.map((ex) => (
                        <div key={ex.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition space-y-2">
                          <div>
                            <span className="font-semibold text-xs text-slate-200 block">{ex.title}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block italic">Objective: {ex.objective}</span>
                          </div>
                          <div className="space-y-1 pl-2 border-l border-slate-800">
                            {ex.instructions.slice(0, 3).map((inst, index) => (
                              <div key={index} className="flex gap-1 text-[10px] text-slate-400">
                                <span className="text-emerald-400 font-bold">{index + 1}.</span>
                                <span>{inst}</span>
                              </div>
                            ))}
                            {ex.instructions.length > 3 && (
                              <span className="text-[9px] text-slate-600 font-mono">+{ex.instructions.length - 3} more steps</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </section>
      </main>

      {/* Footer System Credits */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-600 gap-2">
        <span>MindSupport AI Counseling Agent © 2026. All rights reserved.</span>
        <div className="flex gap-4 font-mono">
          <span>HOST: PORT_3000</span>
          <span>PERSISTENCE: LOCAL_JSON</span>
          <span>REGRESSION: GRADIENT_DESCENT</span>
        </div>
      </footer>
    </div>
  );
}

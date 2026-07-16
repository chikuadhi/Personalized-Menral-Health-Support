# Personalized Mental Health Intervention & Support System

An end-to-end full-stack AI-powered mental health intervention and support system. This system combines local, high-performance mathematical modeling, rule-based clinical NLP classification, and advanced Agentic AI counseling using Gemini.

---

## 🚀 Key Modules & Architecture

### 📊 Phase 1: Machine Learning Baseline
- **Model**: Logistic Regression built completely from scratch in TypeScript (`src/server/ml.ts`).
- **Optimization**: Gradient Descent over normalized daily metrics:
  - Sleep Hours
  - Stress Levels
  - Social Connections
  - Physical Activity Minutes
- **Evaluation**: Calculates real Accuracy, Precision, Recall, F1 score, and dynamic Receiver Operating Characteristic (ROC) coordinates.

### 🧠 Phase 2: Deep Learning Neural Network
- **Model**: Sequence-aware Recurrent Neural Network / Long Short-Term Memory (LSTM) block constructed from scratch in TS.
- **Sequence Modeling**: Analyzes the last 5 days of multi-dimensional user logs to capture time-series and cyclic emotional decline/recovery behaviors.
- **Evaluation Comparative**: Quantifies and charts the LSTM sequence performance against the static Logistic Regression model.

### 🔬 Phase 3: Natural Language Processing (NLP) Module
- **Valence Scorer**: Lexicon-based sentiment scoring mapped through a specialized clinical lexicon mapping positive/negative word intensities.
- **Emotion State Classifier**: High-performance classification matching text indicators to 6 core emotion states: `Happy`, `Calm`, `Anxious`, `Sad`, `Angry`, and `Neutral`.
- **Keyword Extractor**: Implements frequency tokenization and stop-word filtering to extract custom hashtags in real time.

### 💬 Phase 4: Small Language Model (SLM) Response Engine
- Powered by `gemini-3.5-flash` with engineered clinical validation prompts.
- Provides personalized, scientifically grounded therapeutic advice and coping strategies.
- Operates with a bulletproof **local fallback engine** to guarantee clinical stability when external API keys are absent.

### 🎨 Phase 5: Generative AI Therapy & Script Generation
- Dynamic compilers for personalized **guided meditations** and custom **CBT exercise plans** generated on-demand based on specific user stressors.

### 🕵️ Phase 6: Agentic AI Monitor & Planner
- Features a real-time monitor that reads user biometrics, triggers de-escalation protocols, and maintains a detailed "Thoughts Log" explaining the reasoning behind recommended coping exercises.

---

## 📂 Project Structure

```
/
├── server.ts                   # Full-Stack Express & Vite Server Entry Point
├── db.json                     # Local JSON database storage
├── metadata.json               # Platform Application metadata
├── package.json                # Dependencies, Build & Dev Scripts
├── src/
│   ├── App.tsx                 # Serene Slate Dashboard Interface
│   ├── main.tsx                # Client Entry point
│   ├── index.css               # Styles & Google Inter / JetBrains Mono typography
│   ├── types.ts                # TypeScript global type system declaration
│   └── server/
│       ├── db.ts               # Local Database persistence layers
│       ├── ml.ts               # Logistic Regression & LSTM Models from scratch
│       ├── nlp.ts              # Clinical NLP lexical sentiment analyzer
│       └── agent.ts            # Agentic Counselor, SLM & meditation generator
```

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Installation
Install all base full-stack dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root:
```env
# Optional: Provide a Gemini API Key to enable GenAI custom scripts
# If omitted, the system seamlessly falls back to the high-fidelity Local Fallback Engine!
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Run Development Server
Boot the Express backend and Vite client concurrently:
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the system.

### 4. Production Build
Compile the application for deployment:
```bash
npm run build
```
This commands builds the static client bundle and packages the Express backend into a single, optimized CJS server module: `dist/server.cjs`.

To start the production server:
```bash
npm run start
```

---

## 🌐 Deployment Guide (Free Hosting)

### Render.com (Web Service)
1. Fork or push the codebase to GitHub.
2. Create a **New Web Service** on Render.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
4. Add Environment Variable:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here` (Optional)

### Railway.app
1. Create a new project on Railway.
2. Link your GitHub repository.
3. Railway automatically detects the `start` script inside `package.json` and provisions the port correctly.

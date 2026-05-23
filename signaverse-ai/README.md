# 🤟 SignaVerse AI
### Real-time Sign Language Recognition System
**Final Year Major Project · CSE Department**

---

## 📌 Project Overview

SignaVerse AI is a real-time hand gesture recognition system that:
- Detects hand landmarks using **MediaPipe**
- Classifies gestures using a **TensorFlow MLP model**
- Streams annotated frames via **WebSocket** to a **React** dashboard
- Translates detected gestures to **Hindi**
- Converts gestures to **speech** using pyttsx3

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python FastAPI + Uvicorn |
| AI / CV | OpenCV + MediaPipe + TensorFlow 2 |
| Charts | Recharts |
| TTS | pyttsx3 |

---

## 📁 Folder Structure

```
signaverse-ai/
├── backend/
│   ├── main.py                  ← FastAPI server + WebSocket
│   ├── requirements.txt
│   ├── models/
│   │   ├── __init__.py
│   │   └── gesture_model.py     ← TensorFlow model + training
│   └── utils/
│       ├── __init__.py
│       └── helpers.py           ← Hindi translation + TTS
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useApi.js
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardLayout.jsx
            ├── DashboardHome.jsx
            └── DetectionPage.jsx
```

---

## ⚡ Installation & Run

### 1. Backend Setup

```bash
cd signaverse-ai/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload
```

**Backend runs on:** `http://localhost:8000`

> **Note:** On first run, the TensorFlow model will be trained and saved automatically (~10-15 seconds). Subsequent starts load from disk instantly.

---

### 2. Frontend Setup

```bash
cd signaverse-ai/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** `http://localhost:5173`

---

## 🔑 Demo Login

| Field | Value |
|-------|-------|
| Username | `demo` |
| Password | `demo123` |

Any non-empty username/password also works for the demo.

---

## 🎯 Features

| Feature | Description |
|---------|------------|
| 🔐 Login Page | Modern dark UI authentication |
| 📊 Dashboard | Live stats, accuracy graph, gesture breakdown |
| 📷 Live Detection | Real webcam → MediaPipe → TensorFlow → annotated stream |
| 📝 Gesture to Text | Gesture name displayed live |
| 🇮🇳 Hindi Translation | Each gesture shown in Hindi |
| 🔊 Gesture to Speech | Offline TTS via pyttsx3 |
| 📈 Accuracy Graph | Real-time recharts area chart |

---

## 🤟 Recognized Gestures

| Gesture | Hindi | Emoji |
|---------|-------|-------|
| Hello | नमस्ते | 👋 |
| Thank You | धन्यवाद | 🙏 |
| Help | मदद करो | 🆘 |
| Yes | हाँ | 👍 |
| No | नहीं | 👎 |

---

## 🏗 Architecture

```
Browser (React)
    │
    ├── REST API calls → FastAPI /api/*
    │       ├── /api/login
    │       ├── /api/stats
    │       └── /api/speak
    │
    └── WebSocket → ws://localhost:8000/ws/detect
            │
            ├── Receives JPEG frames from browser
            ├── Runs MediaPipe hand detection
            ├── Extracts 21 landmark (x,y,z) → 63 features
            ├── Runs TensorFlow MLP inference
            ├── Draws landmarks + text on frame
            └── Returns annotated JPEG + metadata JSON
```

---

## 📊 Model Architecture

```
Input: 63 features (21 landmarks × 3 coords)
   → BatchNormalization
   → Dense(128, ReLU) + Dropout(0.3)
   → Dense(64, ReLU) + Dropout(0.2)
   → Dense(32, ReLU)
   → Dense(5, Softmax)
Output: 5 gesture classes
```

---

## 🐛 Troubleshooting

**Camera not opening?**
- Allow camera permissions in browser
- Check if another app is using the webcam

**WebSocket not connecting?**
- Ensure backend is running: `uvicorn main:app --reload`
- Check `http://localhost:8000` in browser

**TTS not working?**
- Install system TTS: Windows has SAPI built-in; Linux: `sudo apt install espeak`
- pyttsx3 runs in a background thread, non-blocking

**MediaPipe install fails?**
- Use Python 3.9–3.11
- Try: `pip install mediapipe --extra-index-url https://pypi.org/simple`

---

## 👨‍💻 Team

> Final Year CSE Major Project · 2024–25

---

## 📄 License

MIT License – Free for academic use.

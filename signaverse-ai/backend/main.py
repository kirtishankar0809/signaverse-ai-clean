"""
main.py  –  SignaVerse AI  –  FastAPI Backend
"""
from __future__ import annotations

import asyncio
import base64
import json
import time
from collections import deque
from typing import List

import cv2
import mediapipe as mp
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Local imports
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from models.gesture_model import predict, GESTURE_LABELS, get_model
from utils.helpers import translate_to_hindi, speak_gesture

# ──────────────────────────────────────────────
#  App bootstrap
# ──────────────────────────────────────────────
app = FastAPI(title="SignaVerse AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load the TF model on startup
@app.on_event("startup")
async def _startup():
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_model)
    print("[SignaVerse] Ready ✓")

# ──────────────────────────────────────────────
#  MediaPipe setup
# ──────────────────────────────────────────────
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

HAND_DETECTOR = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.6,
)

# ──────────────────────────────────────────────
#  In-memory stats store
# ──────────────────────────────────────────────
stats: dict = {
    "total_detections": 0,
    "gesture_counts": {g: 0 for g in GESTURE_LABELS},
    "accuracy_history": [],          # list of {t, accuracy}
    "session_start": time.time(),
    "last_gesture": None,
    "last_hindi": None,
}
recent_confidences: deque = deque(maxlen=30)

# ──────────────────────────────────────────────
#  REST endpoints
# ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "SignaVerse AI is running"}


@app.post("/api/login")
async def login(body: dict):
    username = body.get("username", "")
    password = body.get("password", "")
    # Simple demo auth
    if username == "demo" and password == "demo123":
        return {"success": True, "token": "signaverse_demo_token", "name": "Research User"}
    if username and password:          # any non-empty creds work for demo
        return {"success": True, "token": "signaverse_demo_token", "name": username.capitalize()}
    return JSONResponse({"success": False, "message": "Invalid credentials"}, status_code=401)


@app.get("/api/stats")
def get_stats():
    avg_acc = (
        round(sum(recent_confidences) / len(recent_confidences) * 100, 1)
        if recent_confidences else 0.0
    )
    return {
        "total_detections": stats["total_detections"],
        "gesture_counts": stats["gesture_counts"],
        "accuracy_history": stats["accuracy_history"][-50:],
        "session_duration": round(time.time() - stats["session_start"]),
        "average_accuracy": avg_acc,
        "last_gesture": stats["last_gesture"],
        "last_hindi": stats["last_hindi"],
    }


@app.post("/api/speak")
async def speak(body: dict):
    gesture = body.get("gesture", "")
    if gesture:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, speak_gesture, gesture)
    return {"ok": True}


@app.get("/api/gestures")
def list_gestures():
    return {"gestures": GESTURE_LABELS}


# ──────────────────────────────────────────────
#  WebSocket – real-time detection
# ──────────────────────────────────────────────
def _process_frame(frame_bytes: bytes):
    """
    Decode JPEG → run MediaPipe → run TF model →
    draw landmarks → return annotated JPEG + metadata.
    """
    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return None, None, None, None

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = HAND_DETECTOR.process(rgb)

    gesture, confidence, hindi = None, 0.0, None

    if result.multi_hand_landmarks:
        hand_lm = result.multi_hand_landmarks[0]

        # Draw landmarks
        mp_drawing.draw_landmarks(
            frame,
            hand_lm,
            mp_hands.HAND_CONNECTIONS,
            mp_drawing_styles.get_default_hand_landmarks_style(),
            mp_drawing_styles.get_default_hand_connections_style(),
        )

        # Build feature vector
        lm_arr = np.array(
            [[lm.x, lm.y, lm.z] for lm in hand_lm.landmark], dtype=np.float32
        )

        gesture, confidence = predict(lm_arr)
        hindi = translate_to_hindi(gesture)

        # Overlay text on frame
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 55), (10, 10, 30), -1)
        cv2.putText(
            frame, f"{gesture}  ({confidence*100:.0f}%)",
            (12, 38), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (80, 255, 180), 2, cv2.LINE_AA,
        )
        cv2.putText(
            frame, hindi, (frame.shape[1] - 180, 38),
            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 200, 80), 2, cv2.LINE_AA,
        )

    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    return buf.tobytes(), gesture, confidence, hindi


@app.websocket("/ws/detect")
async def detect_ws(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected")
    try:
        while True:
            raw = await websocket.receive_bytes()
            loop = asyncio.get_event_loop()
            annotated, gesture, confidence, hindi = await loop.run_in_executor(
                None, _process_frame, raw
            )

            if annotated is None:
                continue

            # Update stats
            if gesture:
                stats["total_detections"] += 1
                stats["gesture_counts"][gesture] = stats["gesture_counts"].get(gesture, 0) + 1
                stats["last_gesture"] = gesture
                stats["last_hindi"] = hindi
                recent_confidences.append(confidence)
                avg = sum(recent_confidences) / len(recent_confidences)
                stats["accuracy_history"].append({
                    "t": round(time.time() - stats["session_start"]),
                    "accuracy": round(avg * 100, 1),
                })

            payload = {
                "frame": base64.b64encode(annotated).decode(),
                "gesture": gesture,
                "confidence": round(confidence * 100, 1) if confidence else 0,
                "hindi": hindi,
            }
            await websocket.send_text(json.dumps(payload))

    except WebSocketDisconnect:
        print("[WS] Client disconnected")
    except Exception as e:
        print(f"[WS] Error: {e}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

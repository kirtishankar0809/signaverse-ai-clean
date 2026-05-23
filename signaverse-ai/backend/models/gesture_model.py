"""
gesture_model.py
Build, train and load a lightweight TensorFlow MLP that classifies
5 ASL-style gestures from MediaPipe hand-landmark coordinates.
"""

import numpy as np
import os
import json
import tensorflow as tf
from tensorflow.keras import layers, models

GESTURE_LABELS = ["Hello", "Thank You", "Help", "Yes", "No"]
NUM_CLASSES = len(GESTURE_LABELS)
# 21 landmarks × 3 coords (x,y,z) = 63 features
INPUT_DIM = 63

MODEL_PATH = os.path.join(os.path.dirname(__file__), "gesture_model.keras")
LABEL_PATH = os.path.join(os.path.dirname(__file__), "labels.json")


# ---------------------------------------------------------------------------
# Synthetic training data
# Each gesture is given a distinct landmark signature so the model can
# actually discriminate – good enough for a real-time demo.
# ---------------------------------------------------------------------------

def _landmark_template():
    """Return a neutral 21×3 array (wrist at origin, fingers relaxed)."""
    pts = np.zeros((21, 3), dtype=np.float32)
    # rough anatomical positions (normalised 0-1 space)
    finger_tips = [4, 8, 12, 16, 20]
    for i, tip in enumerate(finger_tips):
        pts[tip] = [0.1 + i * 0.18, 0.2, 0.0]
    return pts


def _generate_samples(base_fn, n=200, noise=0.03):
    samples = []
    for _ in range(n):
        pts = base_fn()
        pts += np.random.normal(0, noise, pts.shape).astype(np.float32)
        samples.append(pts.flatten())
    return np.array(samples, dtype=np.float32)


def _hello_base():
    """Open hand, all fingers spread."""
    pts = _landmark_template()
    spread = [0.0, 0.15, 0.32, 0.50, 0.68, 0.85]
    for fi, base_x in enumerate(spread[1:], 1):
        for j in range(1, 5):
            idx = fi * 4 + j
            if idx < 21:
                pts[idx] = [base_x, 1.0 - j * 0.18, 0.0]
    return pts


def _thankyou_base():
    """Flat hand moving from chin – fingers together, slight tilt."""
    pts = _landmark_template()
    for fi in range(1, 6):
        for j in range(1, 5):
            idx = fi * 4 + j if fi < 5 else 20
            if idx < 21:
                pts[idx] = [0.45 + fi * 0.02, 0.6 - j * 0.12, 0.05 * j]
    return pts


def _help_base():
    """Closed fist with thumb up."""
    pts = _landmark_template()
    for fi in range(1, 5):
        for j in range(1, 5):
            idx = fi * 4 + j
            if idx < 21:
                pts[idx] = [0.4 + fi * 0.04, 0.3 + j * 0.04, 0.0]
    pts[4] = [0.35, 0.85, 0.0]   # thumb up
    return pts


def _yes_base():
    """Fist bouncing – all fingers curled."""
    pts = _landmark_template()
    for fi in range(1, 5):
        for j in range(1, 5):
            idx = fi * 4 + j
            if idx < 21:
                pts[idx] = [0.38 + fi * 0.05, 0.2 + j * 0.05, 0.02 * j]
    pts[4] = [0.35, 0.22, 0.0]
    return pts


def _no_base():
    """Index & middle fingers extended, rest curled."""
    pts = _landmark_template()
    # index extended
    for j in range(1, 5):
        pts[4 + j] = [0.42, 0.2 + j * 0.17, 0.0]
    # middle extended
    for j in range(1, 5):
        pts[8 + j] = [0.55, 0.2 + j * 0.17, 0.0]
    # ring & pinky curled
    for fi in [3, 4]:
        for j in range(1, 5):
            idx = fi * 4 + j
            if idx < 21:
                pts[idx] = [0.38 + fi * 0.06, 0.22, 0.01]
    return pts


BASE_FNS = [_hello_base, _thankyou_base, _help_base, _yes_base, _no_base]


def build_model():
    inp = layers.Input(shape=(INPUT_DIM,))
    x = layers.BatchNormalization()(inp)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation="relu")(x)
    out = layers.Dense(NUM_CLASSES, activation="softmax")(x)
    model = models.Model(inp, out)
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train_and_save():
    print("[SignaVerse] Generating synthetic training data …")
    X_list, y_list = [], []
    for label_idx, base_fn in enumerate(BASE_FNS):
        samples = _generate_samples(base_fn, n=300)
        X_list.append(samples)
        y_list.append(np.full(len(samples), label_idx, dtype=np.int32))

    X = np.concatenate(X_list)
    y = np.concatenate(y_list)

    # shuffle
    idx = np.random.permutation(len(X))
    X, y = X[idx], y[idx]

    model = build_model()
    model.fit(X, y, epochs=40, batch_size=32, validation_split=0.15, verbose=0)
    model.save(MODEL_PATH)

    with open(LABEL_PATH, "w") as f:
        json.dump(GESTURE_LABELS, f)

    print(f"[SignaVerse] Model saved → {MODEL_PATH}")
    return model


def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_and_save()
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("[SignaVerse] Model loaded from disk.")
        return model
    except Exception:
        return train_and_save()


# Singleton
_model = None


def get_model():
    global _model
    if _model is None:
        _model = load_model()
    return _model


def predict(landmark_array: np.ndarray):
    """
    landmark_array: shape (21, 3) or (63,)
    Returns (gesture_label, confidence_float)
    """
    model = get_model()
    flat = landmark_array.flatten().reshape(1, -1).astype(np.float32)
    probs = model.predict(flat, verbose=0)[0]
    idx = int(np.argmax(probs))
    return GESTURE_LABELS[idx], float(probs[idx])

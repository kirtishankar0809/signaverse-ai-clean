"""
utils/helpers.py
Translation and TTS utilities for SignaVerse AI.
"""

HINDI_MAP = {
    "Hello":     "नमस्ते",
    "Thank You": "धन्यवाद",
    "Help":      "मदद करो",
    "Yes":       "हाँ",
    "No":        "नहीं",
}


def translate_to_hindi(gesture: str) -> str:
    return HINDI_MAP.get(gesture, gesture)


def speak_gesture(gesture: str):
    """
    Use pyttsx3 for offline TTS.
    Runs in a daemon thread so it never blocks the API.
    """
    try:
        import pyttsx3
        import threading

        def _speak():
            try:
                engine = pyttsx3.init()
                engine.setProperty("rate", 150)
                engine.say(gesture)
                engine.runAndWait()
            except Exception:
                pass

        t = threading.Thread(target=_speak, daemon=True)
        t.start()
    except Exception:
        pass

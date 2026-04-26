import torch
from pydub import AudioSegment
import os
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from fer.fer import FER

# import your modules
from emotion_detection.text_emotion import detect_text_emotion
from emotion_detection.voice_emotion import detect_voice_emotion
from emotion_detection.fusion import fuse_emotions, get_health_advice

# ---------------- APP ----------------
app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_detector = FER(mtcnn=False)

# ---------------- TEXT ----------------
# ✅ FIXED: Works with POST + query params
@app.post("/text")
async def text_emotion(request: Request):
    try:
        text = request.query_params.get("text", "")

        if not text:
            return {"emotion": "neutral", "score": 0.0}

        emotion, score = detect_text_emotion(text)

        return {"emotion": emotion, "score": score}

    except Exception as e:
        print("TEXT ERROR:", e)
        return {"emotion": "neutral", "score": 0.0}


# ---------------- FACE ----------------
@app.post("/face")
async def face_emotion(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = face_detector.detect_emotions(frame)

        if results:
            emotions = results[0]["emotions"]

            if emotions.get("sad", 0) > 0.3:
                emotion = "sadness"
            else:
                emotion = max(emotions, key=emotions.get)

            score = emotions.get(emotion, 0.5)
        else:
            emotion, score = "neutral", 0.5

        return {"emotion": emotion, "score": score}

    except Exception as e:
        print("FACE ERROR:", e)
        return {"emotion": "neutral", "score": 0.0}


# ---------------- VOICE ----------------
@app.post("/voice")
async def voice_emotion(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        webm_path = "temp_audio.webm"
        with open(webm_path, "wb") as f:
            f.write(contents)

        wav_path = "temp_audio.wav"
        audio = AudioSegment.from_file(webm_path, format="webm")
        audio.export(wav_path, format="wav")

        emotion, score = detect_voice_emotion(wav_path)

        os.remove(webm_path)
        os.remove(wav_path)

        return {"emotion": emotion, "score": score}

    except Exception as e:
        print("VOICE ERROR:", e)
        return {"emotion": "neutral", "score": 0.0}


# ---------------- FUSION ----------------
@app.post("/fusion")
async def fusion(data: dict):
    try:
        face = data.get("face", {})
        text = data.get("text", {})
        voice = data.get("voice", {})

        final, confidence =fuse_emotions(
            face.get("emotion", "neutral"), face.get("score", 0.5),
            text.get("emotion", "neutral"), text.get("score", 0.5),
            voice.get("emotion", "neutral"), voice.get("score", 0.5)
        )

        advice = get_health_advice(final)

        return {
            "final_emotion": final,
            "confidence": confidence,
            "advice": advice
        }

    except Exception as e:
        print("FUSION ERROR:", e)
        return {
            "final_emotion": "neutral",
            "confidence": 0.0,
            "advice": "Take a deep breath. I'm here for you."
        }
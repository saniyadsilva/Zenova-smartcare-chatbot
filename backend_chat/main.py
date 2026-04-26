"""
main.py  –  Emotion-aware chatbot WebSocket server (Groq / Llama 3)
Place this in your backend_chat/ folder.

Run with:  uvicorn main:app --port 8001 --reload

Setup:
    1. pip install fastapi uvicorn groq
    2. Get a FREE API key at https://console.groq.com
    3. Set it: export GROQ_API_KEY=gsk_...
"""

import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq client ───────────────────────────────────────────────────────────────
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# ── System prompt ─────────────────────────────────────────────────────────────
def build_system_prompt(emotion: str, face_emotion: str = "", voice_emotion: str = "") -> str:
    emotion_context = f"The user's current detected emotion is: {emotion}"
    if face_emotion:
        emotion_context += f" (face: {face_emotion})"
    if voice_emotion:
        emotion_context += f" (voice: {voice_emotion})"

    return f"""You are a warm, empathetic mental wellness companion and health advisor.

{emotion_context}

Your role:
- Give SHORT, conversational replies (2-4 sentences max unless user asks for detail).
- Acknowledge the user's emotional state naturally — don't robotically repeat the label.
- Offer practical, evidence-based health advice relevant to their emotion when appropriate.
- Ask one gentle follow-up question to keep the conversation going.
- Never diagnose. Always suggest professional help for serious concerns.
- Be human, warm, and never preachy.

Emotion-specific guidance:
- sadness/grief  → validate feelings, suggest self-care, social connection
- fear/anxiety   → grounding techniques (breathing, 5-4-3-2-1 senses), reassurance
- anger          → acknowledge frustration, suggest pause or physical release
- joy/happiness  → celebrate with them, encourage sharing the good mood
- neutral        → gentle check-in, open questions

If the user mentions self-harm or crisis, respond with compassion and strongly
encourage them to contact a professional or crisis helpline immediately.
"""


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ WebSocket connected")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            user_message  = data.get("message", "")
            emotion       = data.get("emotion", "neutral")
            face_emotion  = data.get("face", "")
            voice_emotion = data.get("voice", "")
            history       = data.get("history", [])

            if not user_message.strip():
                await websocket.send_text("[END]")
                continue

            # Build message history for Groq
            messages = []
            for msg in history:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
            messages.append({"role": "user", "content": user_message})

            system_prompt = build_system_prompt(emotion, face_emotion, voice_emotion)

            # ── Stream reply from Groq ────────────────────────────────────────
            try:
                stream = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",   # free & fast; upgrade to llama3-70b for better quality
                    messages=[{"role": "system", "content": system_prompt}] + messages,
                    max_tokens=512,
                    stream=True,
                )

                for chunk in stream:
                    token = chunk.choices[0].delta.content
                    if token:
                        await websocket.send_text(token)
                        await asyncio.sleep(0)   # yield to event loop

                await websocket.send_text("[END]")

            except Exception as e:
                print(f"Groq API error: {e}")
                await websocket.send_text(
                    "I'm having a little trouble right now — please try again in a moment."
                )
                await websocket.send_text("[END]")

    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")
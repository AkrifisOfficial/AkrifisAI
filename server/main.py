from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import tempfile
from stable_diffusion import generate_image  # Локальный модуль для генерации изображений

app = FastAPI()

# Настройки CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Конфигурация OpenAI
openai.api_key = os.getenv("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")

@app.post("/chat")
async def chat_endpoint(prompt: str):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return {"response": response.choices[0].message['content']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile):
    try:
        # Сохраняем временный файл
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await audio.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Используем Whisper для транскрипции
        with open(tmp_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
        
        os.unlink(tmp_path)
        return {"text": transcript["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image_endpoint(prompt: str):
    try:
        # Генерация изображения с помощью Stable Diffusion
        image_url = generate_image(prompt)
        return {"image_url": image_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

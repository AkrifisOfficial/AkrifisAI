from huggingface_hub import InferenceClient
import os

def generate_image(prompt: str):
    client = InferenceClient(token=os.getenv("HF_API_TOKEN"))
    image = client.text_to_image(
        prompt,
        model="stabilityai/stable-diffusion-2-1",
        negative_prompt="blurry, ugly, deformed"
    )
    
    # Сохраняем изображение временно (в продакшене используем S3 или подобное)
    image_path = f"/tmp/{hash(prompt)}.png"
    image.save(image_path)
    
    # Возвращаем URL (в реальном проекте загружаем в облачное хранилище)
    return f"http://your-server/images/{os.path.basename(image_path)}"

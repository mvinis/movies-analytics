import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

try:
    # Teste ultra simples
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Oi, responda apenas 'OK' se você estiver ouvindo."
    )
    print("Resposta da IA:", response.text)
except Exception as e:
    print("ERRO FATAL NO GOOGLE:", e)
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"), http_options={'api_version': 'v1'})
# Tenta listar os modelos de novo, mas agora com a chave nova
for m in client.models.list():
    print(m.name)
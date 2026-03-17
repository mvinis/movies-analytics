from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import json
from datetime import datetime
from google import genai
from groq import Groq
from dotenv import load_dotenv
import logging
import subprocess
import sys
from fastapi.responses import StreamingResponse

# Configuração de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# --- CONFIGURAÇÃO DE IA COM FALLBACK PARA TESTES/CI ---
google_key = os.getenv("GOOGLE_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

# 1. Inicialização Gemini (Plano A)
client_gemini = None
try:
    if google_key and google_key != "fake_key_for_testing":
        client_gemini = genai.Client(api_key=google_key)
        logger.info("✅ Cliente Gemini iniciado com sucesso.")
    else:
        logger.warning("⚠️ Google API Key ausente ou fake. Funcionalidades de IA do Gemini estarão limitadas.")
except Exception as e:
    logger.error(f"❌ Erro ao instanciar Gemini: {e}")

# 2. Inicialização Groq (Plano B)
client_groq = None
try:
    if groq_key and groq_key != "fake_key_for_testing":
        client_groq = Groq(api_key=groq_key)
        logger.info("✅ Cliente Groq iniciado com sucesso.")
    else:
        logger.warning("⚠️ Groq API Key ausente ou fake. Funcionalidades de fallback estarão limitadas.")
except Exception as e:
    logger.error(f"❌ Erro ao instanciar Groq: {e}")

MODEL_GEMINI = "gemini-2.0-flash"
MODEL_GROQ = "llama-3.3-70b-versatile"

app = FastAPI(title="Movie Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de Caminhos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARQUET_PATH = os.path.normpath(os.path.join(BASE_DIR, '..', 'data', 'processed', 'movies_processed.parquet'))
METADATA_PATH = os.path.normpath(os.path.join(BASE_DIR, '..', 'data', 'metadata.json'))

# --- FUNÇÕES DE GERAÇÃO COM PROTEÇÃO ---

def generate_with_gemini(stats):
    if not client_gemini:
        return { "correlation": "IA indisponível (Chave não configurada).", "provider": "OFFLINE" }
    
    prompt = f"""
    Aja como um Estrategista de Dados Sênior. Analise estes KPIs:
    - ELITE: {stats.get('high_quality_popular_count', 0)} filmes.
    - VOLUME TOTAL: {stats.get('total_movies', 0)} filmes.
    - MÉDIA DE QUALIDADE: {stats.get('avg_rating', 0)}/10.
    - PICO HISTÓRICO: Ano {stats.get('year_peak', 0)}.
    - CONCENTRAÇÃO: Mês {stats.get('peak_month', 'N/A')}.

    Gere um JSON com insights agressivos: {{ "correlation": "...", "trend": "...", "quality": "...", "market": "..." }}
    """
    
    try:
        response = client_gemini.models.generate_content(
            model=MODEL_GEMINI,
            contents=prompt
        )
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        logger.error(f"Erro na chamada Gemini: {e}")
        raise e

def generate_with_fallback(stats):
    if not client_groq:
        return { "correlation": "IA de Fallback indisponível.", "provider": "OFFLINE" }
    
    prompt = f"KPIs: Elite={stats['high_quality_popular_count']}, AnoPico={stats['year_peak']}, Média={stats['avg_rating']}, MêsPico={stats['peak_month']}."
    
    try:
        completion = client_groq.chat.completions.create(
            model=MODEL_GROQ,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        logger.error(f"Erro na chamada Groq: {e}")
        raise e

# --- LÓGICA DE CACHE ---

def get_cached_insights():
    if not os.path.exists(METADATA_PATH): return None
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("ai_insights")
    except: return None
    return None

def save_insights_to_cache(insights):
    if not os.path.exists(METADATA_PATH): return
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            data[0]["ai_insights"] = insights
            with open(METADATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
    except: pass

# --- HELPERS ---

def get_data_summary():
    if not os.path.exists(PARQUET_PATH): return None
    df = pd.read_parquet(PARQUET_PATH)
    df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
    df_dates = df.dropna(subset=['release_date'])
    
    high_quality_popular = len(df[(df['vote_average'] > 7.5) & (df['popularity'] > 40)])
    year_peak = int(df['release_year'].value_counts().idxmax()) if 'release_year' in df else 0
    peak_month = int(df_dates['release_date'].dt.month.value_counts().idxmax()) if not df_dates.empty else 0
    
    return {
        "total_movies": len(df),
        "avg_rating": round(df['vote_average'].mean(), 2),
        "high_quality_popular_count": high_quality_popular,
        "year_peak": year_peak,
        "peak_month": peak_month
    }

# --- ROTAS ---

@app.get("/api/ai/insights")
async def get_ai_insights():
    cached = get_cached_insights()
    if cached: return cached

    stats = get_data_summary()
    if not stats: return {"error": "Sem dados processados."}

    try:
        new_insights = generate_with_gemini(stats)
        new_insights["provider"] = "GEMINI 2.0 FLASH" 
        save_insights_to_cache(new_insights)
        return new_insights
    except Exception:
        try:
            new_insights = generate_with_fallback(stats)
            new_insights["provider"] = "GROQ (LLAMA 3.3)"
            save_insights_to_cache(new_insights)
            return new_insights
        except Exception:
            return {
                "correlation": "Sistema em manutenção ou chaves de API não configuradas.",
                "provider": "OFFLINE"
            }

@app.get("/api/movies")
def get_movies():
    if not os.path.exists(PARQUET_PATH): return []
    df = pd.read_parquet(PARQUET_PATH)
    return json.loads(df.to_json(orient='records', date_format='iso'))

@app.post("/api/pipeline/run")
async def run_pipeline_task():
    def generate_logs():
        pipeline_path = os.path.join(BASE_DIR, 'run_pipeline.py')
        process = subprocess.Popen(
            [sys.executable, pipeline_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='ignore'
        )

        for line in iter(process.stdout.readline, ""):
            if line:
                yield f"data: {line.strip()}\n\n"
        
        process.stdout.close()
        process.wait()
        yield "data: FINISHED\n\n"

    return StreamingResponse(generate_logs(), media_type="text/event-stream")

@app.get("/api/pipeline/logs")
def get_pipeline_logs():
    if not os.path.exists(METADATA_PATH): return []
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            history = json.load(f)
            if not isinstance(history, list): history = [history]
        return [{
            "id": idx + 1,
            "time": entry.get("last_execution", "---"),
            "step": "Pipeline Total",
            "status": entry.get("status", "---"),
            "detail": entry.get("details", "")
        } for idx, entry in enumerate(history)]
    except: return []

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
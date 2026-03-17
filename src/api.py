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

load_dotenv()

# 1. Configuração Gemini (Plano A)
client_gemini = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)

# 2. Configuração Groq (Plano B)
client_groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_GEMINI = "gemini-2.5-flash-lite"
MODEL_GROQ = "llama-3.3-70b-versatile"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARQUET_PATH = os.path.join(BASE_DIR, '..', 'data', 'processed', 'movies_processed.parquet')
METADATA_PATH = os.path.join(BASE_DIR, '..', 'data', 'metadata.json')

# --- FUNÇÕES DE GERAÇÃO COM ISOLAMENTO DE CONTEXTO ---

def generate_with_gemini(stats):
    prompt = f"""
    Aja como um Estrategista de Dados Sênior. Sua audiência são Produtores de Cinema e Investidores (Stakeholders).
    Analise os seguintes KPIs brutos extraídos do pipeline:
    - ELITE (Alta Qualidade + Alta Popularidade): {stats.get('high_quality_popular_count', 0)} filmes.
    - VOLUME TOTAL: {stats.get('total_movies', 0)} filmes.
    - MÉDIA DE QUALIDADE: {stats.get('avg_rating', 0)}/10.
    - PICO HISTÓRICO: Ano {stats.get('year_peak', 0)}.
    - CONCENTRAÇÃO DE LANÇAMENTOS: Mês de {stats.get('peak_month', 'Indisponível')}.

    Gere um JSON com 4 insights agressivos e estratégicos. REGRAS RÍGIDAS:
    1. PROIBIDO ser óbvio. Se o insight for "Dezembro é bom por causa do Natal", você falhou.
    2. FOCO EM NEGÓCIOS: Use termos como 'Saturação de Mercado', 'ROI', 'Oceano Azul', 'Canibalização de Audiência'.
    3. ESTRUTURA:
       - "correlation": Analise a dificuldade de criar um hit. Se apenas {stats.get('high_quality_popular_count', 0)} em {stats.get('total_movies', 0)} são elite, qual o risco do setor?
       - "trend": O que o pico de {stats.get('year_peak', 0)} diz sobre a sustentabilidade do mercado? Houve bolha de conteúdo?
       - "quality": A média {stats.get('avg_rating', 0)} indica um mercado de 'commodities' ou de 'prestígio'? Onde está o gargalo de qualidade?
       - "market": O mês {stats.get('peak_month', 'Indisponível')} é uma oportunidade ou uma armadilha de marketing (Red Ocean)?

    Responda APENAS o JSON puro:
    {{ "correlation": "...", "trend": "...", "quality": "...", "market": "..." }}
    """
    response = client_gemini.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    clean_json = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean_json)

def generate_with_fallback(stats):

    prompt = f"""
    Siga rigorosamente estas instruções de análise:
    KPIs: Elite={stats['high_quality_popular_count']}, AnoPico={stats['year_peak']}, Média={stats['avg_rating']}, MêsPico={stats['peak_month']}.
    
    Gere um JSON com as chaves:
    - "correlation": Insight sobre o sucesso dos {stats['high_quality_popular_count']} filmes de elite.
    - "trend": Insight sobre a produtividade do ano {stats['year_peak']}.
    - "quality": Insight sobre a qualidade média de {stats['avg_rating']}.
    - "market": Insight sobre a estratégia de lançamentos em {stats['peak_month']}. NÃO cite o volume total de filmes neste campo.

    Responda apenas o JSON puro, sem explicações.
    """
    
    completion = client_groq.chat.completions.create(
        model=MODEL_GROQ,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    raw_data = json.loads(completion.choices[0].message.content)
    
    # Tratamento para o caso de a Groq enviar uma lista dentro de 'insights'
    if "insights" in raw_data and isinstance(raw_data["insights"], list):
        mapped = {}
        for item in raw_data["insights"]:
            tipo = item.get("tipo") or item.get("type")
            if tipo in ["correlation", "trend", "quality", "market"]:
                mapped[tipo] = item.get("descricao") or item.get("content") or ""
        return mapped if mapped else raw_data
        
    return raw_data

# --- LOGICA DE CACHE ---

def get_cached_insights():
    if not os.path.exists(METADATA_PATH): return None
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content: return None
            data = json.loads(content)
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
    
    peak_month_name = int(df_dates['release_date'].dt.month.value_counts().idxmax())
    return {
        "total_movies": len(df),
        "avg_rating": round(df['vote_average'].mean(), 2),
        "high_quality_popular_count": high_quality_popular,
        "year_peak": year_peak,
        "peak_month": peak_month_name
    }

# --- ROTAS ---

@app.get("/api/ai/insights")
async def get_ai_insights():
    # 1. Tenta o Cache
    cached = get_cached_insights()
    if cached: 
        return cached

    stats = get_data_summary()

    # 2. Tenta Gemini
    try:
        logging.info("--- Iniciando chamada ao Gemini ---")
        new_insights = generate_with_gemini(stats)
        new_insights["provider"] = "GEMINI 2.0 FLASH" 
        save_insights_to_cache(new_insights)
        return new_insights
    except Exception as e:
        logging.warning(f"❌ ERRO NO GEMINI: {str(e)}")
        try:
            logging.info("--- Acionando Fallback: Groq ---")
            new_insights = generate_with_fallback(stats)
            
            # 3. Fallback para Groq
            new_insights = generate_with_fallback(stats)
            new_insights["provider"] = "GROQ (LLAMA 3.3)"
            save_insights_to_cache(new_insights)
            return new_insights
        
        except Exception:
                return {
                    "correlation": "Sistema em manutenção...",
                    "provider": "OFFLINE"
                }
        
@app.get("/api/movies")
def get_movies():
    if not os.path.exists(PARQUET_PATH): return []
    df = pd.read_parquet(PARQUET_PATH)
    return json.loads(df.to_json(orient='records'))

@app.post("/api/pipeline/run")
async def run_pipeline_task():
    def generate_logs():
        current_dir = os.path.dirname(os.path.abspath(__file__))
        pipeline_path = os.path.join(current_dir, 'run_pipeline.py')

        # Iniciamos o processo
        process = subprocess.Popen(
            [sys.executable, pipeline_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='cp1252',
            errors='ignore'
        )

        # Lemos a saída linha por linha
        for line in iter(process.stdout.readline, ""):
            if line:
                # Enviamos a linha para o front
                # Formato: "data: Mensagem aqui\n\n" (padrão SSE)
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
            history = json.loads(f.read())
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
    uvicorn.run(app, host="127.0.0.1", port=8000)
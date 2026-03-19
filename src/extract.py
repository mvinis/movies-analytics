import os
import json
import requests
import colorlog
import logging
import sys
import time
from dotenv import load_dotenv

# Configuração do log com cores
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(
    '%(log_color)s%(asctime)s - %(levelname)s - %(message)s',
    log_colors={'INFO': 'green', 'WARNING': 'yellow', 'ERROR': 'red', 'CRITICAL': 'red,bg_white'}
))
logger = colorlog.getLogger(__name__)
if not logger.handlers:
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

load_dotenv()
TOKEN = os.getenv('TMDB_API_KEY')

def fetch_popular_movies(total_movies_target=1000):
    """
    Busca filmes até atingir a meta definida.
    """
    all_movies = []
    headers = {"accept": "application/json", "Authorization": f"Bearer {TOKEN}"}
    
    # Cada página tem 20, então calculamos quantas páginas precisamos
    pages_to_fetch = (total_movies_target // 20) + (1 if total_movies_target % 20 > 0 else 0)
    
    logger.info(f"🎯 Meta: {total_movies_target} filmes. Calculado: {pages_to_fetch} páginas.")

    for page in range(1, pages_to_fetch + 1):
        # O TMDB limita a 500 páginas em endpoints de listagem
        if page > 500:
            logger.warning("⚠️ Limite máximo de 500 páginas atingido (limitação da API TMDB).")
            break

        url = f"https://api.themoviedb.org/3/movie/popular?language=pt-BR&page={page}"
        
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 429: # Too Many Requests
                logger.warning("⏳ Rate limit atingido. Aguardando 5 segundos...")
                time.sleep(5)
                continue
                
            response.raise_for_status()
            data = response.json()
            
            all_movies.extend(data.get('results', []))
            
            if page % 5 == 0: # Log a cada 5 páginas para não encher a tela
                logger.info(f"📊 Progresso: {len(all_movies)} / {total_movies_target} filmes coletados...")
            
            time.sleep(0.1) # Delay sutil
            
        except Exception as e:
            logger.error(f"❌ Falha na página {page}: {e}")
            break

    return {"results": all_movies[:total_movies_target]}

def save_raw_data(data, filename="movies_raw.json"):
    filepath = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    logger.info(f"📂 Dados brutos salvos em: {filepath}")
    logger.info(f"✨ Total final da extração: {len(data['results'])} filmes.")

if __name__ == "__main__":
    try:
        logger.info("🎬 Iniciando pipeline de extração massiva...")
        if not TOKEN:
            raise ValueError("Token da API não encontrado no arquivo .env!")
        
        # Aqui definimos quantas páginas queremos (ex: 5 páginas = 100 filmes)
        movies_consolidated = fetch_popular_movies(total_movies_target=1000)
        
        if movies_consolidated["results"]:
            save_raw_data(movies_consolidated)
            logger.info("🚀 Extração finalizada com sucesso!")
        else:
            logger.warning("⚠️ Nenhum dado foi recuperado.")
            
    except Exception as e:
        logger.error(f"🚨 Erro crítico: {str(e)}")
        sys.exit(1)
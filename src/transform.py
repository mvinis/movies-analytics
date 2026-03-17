import os
import json
import pandas as pd
import colorlog
import logging
import sys

# Configuração do log
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(
    '%(log_color)s%(asctime)s - %(levelname)s - %(message)s',
    log_colors={'INFO': 'green', 'WARNING': 'yellow', 'ERROR': 'red'}
))
logger = colorlog.getLogger(__name__)
if not logger.handlers:
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

def load_raw_data(filename="movies_raw.json"):
    filepath = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Arquivo não encontrado: {filepath}")
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    logger.info(f"📥 Dados brutos carregados de {filename}.")
    return data

def transform_data(raw_data):
    """
    Recebe os dados brutos (dict) e retorna um DataFrame limpo.
    """
    logger.info("🧪 Iniciando limpeza e transformação dos dados...")
    
    # O TMDB manda os filmes dentro da chave 'results'
    df = pd.DataFrame(raw_data['results'])

    # --- REMOÇÃO DE DUPLICADOS ---
    initial_count = len(df)
    df = df.drop_duplicates(subset=['id'], keep='first')
    
    duplicates_removed = initial_count - len(df)
    if duplicates_removed > 0:
        logger.warning(f"♻️  Remoção de Duplicados: {duplicates_removed} registros repetidos eliminados.")
    
    # 1. TRATAMENTO DE DATAS E FILTRO DE QUALIDADE
    initial_count = len(df)
    df = df[df['release_date'].notna() & (df['release_date'] != "")]
    
    # Extrai o ano com segurança
    df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
    df['release_year'] = df['release_date'].dt.year.fillna(0).astype(int)

    removed = initial_count - len(df)
    logger.info(f"🧹 Filtro de Qualidade: {removed} registros incompletos removidos. {len(df)} restantes.")
    
    # 2. TRATAMENTO DO POSTER
    df['poster_url'] = df['poster_path'].apply(
        lambda x: f"https://image.tmdb.org/t/p/w500{x}" if x else ""
    )
    
    # 3. SELEÇÃO DE COLUNAS (Contrato de Dados Gold)
    # Adiciona 'release_date' na lista
    cols_to_keep = ['id', 'title', 'release_date', 'release_year', 'popularity', 'vote_average', 'poster_url', 'genre_ids']
    df_final = df[cols_to_keep]
    
    return df_final

def save_processed_data(df, json_name="movies_cleaned.json", parquet_name="movies_processed.parquet"):
    # Caminhos
    processed_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    os.makedirs(processed_dir, exist_ok=True)
    
    # Salvando JSON
    json_path = os.path.join(processed_dir, json_name)
    df.to_json(json_path, orient='records', force_ascii=False, indent=4, date_format='iso')
    
    # Salvando Parquet (para Performance e Big Data)
    parquet_path = os.path.join(processed_dir, parquet_name)
    df.to_parquet(parquet_path, index=False)
    
    logger.info(f"💾 Dados persistidos em JSON e Parquet na pasta: {processed_dir}")

if __name__ == "__main__":
    try:
        logger.info("⚙️  Pipeline de Transformação iniciado.")
        
        # 1. Load (Carrega do JSON Raw)
        data = load_raw_data()
        
        # 2. Transform (Processa o dicionário 'data')
        df_clean = transform_data(data)
        
        # 3. Save (Persiste o resultado)
        save_processed_data(df_clean)
        
        logger.info("🚀 Estágio de Transformação finalizado com sucesso!")

    except Exception as e:
        logger.error(f"🚨 Erro na transformação: {str(e)}")
        sys.exit(1)
from pathlib import Path
import os
import pandas as pd
import pytest
from unittest.mock import patch, MagicMock
from src.extract import fetch_popular_movies, save_raw_data
from src.transform import load_raw_data, transform_data, save_processed_data

# Caminhos temporários para o teste não sujar os dados reais
TEST_RAW_JSON = "movies_raw_test.json"
TEST_PROCESSED_PARQUET = "movies_processed_test.parquet"

# Pega o caminho deste arquivo -> sobe para 'integration' -> sobe para 'tests' -> sobe para a RAIZ
ROOT_DIR = Path(__file__).resolve().parent.parent.parent

# Agora os caminhos ficam limpos e legíveis
raw_path = ROOT_DIR / "data" / "raw" / TEST_RAW_JSON
processed_path = ROOT_DIR / "data" / "processed" / TEST_PROCESSED_PARQUET

@patch('src.extract.requests.get')
@patch('src.extract.time.sleep')
def test_full_pipeline_flow(mock_sleep, mock_get):
    """
    Testa a integração: Extract -> JSON -> Transform -> Parquet
    """
    # 1. MOCK DE EXTRAÇÃO (Simulando 20 filmes da API)
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [{"id": i, "title": f"Movie {i}", "release_date": "2024-01-01", "vote_average": 5.0, "popularity": 10.0, "poster_path": "/test.jpg", "genre_ids": []} for i in range(20)]
    }
    mock_get.return_value = mock_response

    # --- FASE 1: EXTRAÇÃO ---
    raw_data = fetch_popular_movies(total_movies_target=20)
    save_raw_data(raw_data, filename=TEST_RAW_JSON)
    
    # Verifica se o arquivo RAW foi criado
    raw_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', TEST_RAW_JSON)
    assert os.path.exists(raw_path)

    # --- FASE 2: TRANSFORMAÇÃO ---
    # Carrega o arquivo que a extração acabou de criar
    loaded_raw = load_raw_data(filename=TEST_RAW_JSON)
    df_clean = transform_data(loaded_raw)
    save_processed_data(df_clean, parquet_name=TEST_PROCESSED_PARQUET)

    # --- FASE 3: VALIDAÇÃO FINAL ---
    processed_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed', TEST_PROCESSED_PARQUET)
    assert os.path.exists(processed_path)
    
    df_final = pd.read_parquet(processed_path)
    assert len(df_final) == 20
    assert "release_year" in df_final.columns
    assert "poster_url" in df_final.columns

    # LIMPEZA: Remove os arquivos de teste após o sucesso
    os.remove(raw_path)
    os.remove(processed_path)
    # Remove também o JSON de limpeza que o save_processed_data cria por padrão
    json_clean_path = processed_path.replace(".parquet", ".json")
    if os.path.exists(json_clean_path):
        os.remove(json_clean_path)
import pandas as pd
import pytest
from src.transform import transform_data

def test_transform_data_sucesso():
    # 1. Simula o formato exato que o TMDB envia (chave 'results')
    raw_mock = {
        "results": [
            {
                "id": 101,
                "title": "Vingadores",
                "release_date": "2024-05-20",
                "vote_average": 8.2,
                "popularity": 150.5,
                "poster_path": "/caminho.jpg",
                "genre_ids": [28, 12]
            }
        ]
    }

    # 2. Executa a função
    df_result = transform_data(raw_mock)

    # 3. Verificações (Assertions)
    assert len(df_result) == 1
    assert "release_year" in df_result.columns
    assert df_result["release_year"].iloc[0] == 2024
    assert df_result["poster_url"].iloc[0] == "https://image.tmdb.org/t/p/w500/caminho.jpg"

def test_transform_data_remove_vazios():
    # Testa o filtro de "remover quem não tem release_date" funciona
    raw_mock = {
        "results": [
            # ID = 1 -> tem realease_date
            {"id": 1, "title": "Certo", "release_date": "2023-01-01", "vote_average": 5, "popularity": 10, "poster_path": "", "genre_ids": []},
            # ID = 2 -> NÃO tem realease_date
            {"id": 2, "title": "Errado", "release_date": "", "vote_average": 5, "popularity": 10, "poster_path": "", "genre_ids": []}
        ]
    }
    
    df_result = transform_data(raw_mock)
    
    # Deve sobrar apenas 1 filme, pois o segundo foi filtrado
    assert len(df_result) == 1
    assert df_result["title"].iloc[0] == "Certo"
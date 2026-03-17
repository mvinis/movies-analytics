import pytest
from unittest.mock import patch, MagicMock
from src.extract import fetch_popular_movies

@patch('src.extract.requests.get')
@patch('src.extract.time.sleep')
def test_fetch_popular_movies_sucesso(mock_sleep, mock_get):
    # 1. Configuramos o Mock para retornar 20 filmes (uma página padrão TMDB)
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [{"id": i, "title": f"Filme {i}"} for i in range(20)]
    }
    mock_get.return_value = mock_response

    # 2. Executa apenas 20 filmes (1 página) para ser rápido
    resultado = fetch_popular_movies(total_movies_target=20)

    # 3. Verificações
    assert len(resultado["results"]) == 20
    assert resultado["results"][0]["title"] == "Filme 0"
    assert mock_get.call_count == 1 # Garante que chamou a API exatamente 1 vez
    
@patch('src.extract.requests.get')
@patch('src.extract.time.sleep')
def test_fetch_popular_movies_retry_on_429(mock_sleep, mock_get):
    # Simula o cenário de "Rate Limit":
    # A 1ª chamada retorna 429 (erro de limite), a 2ª chamada retorna 200 (sucesso)
    mock_429 = MagicMock()
    mock_429.status_code = 429
    
    mock_200 = MagicMock()
    mock_200.status_code = 200
    mock_200.json.return_value = {"results": [{"id": 1, "title": "Sucesso após delay"}]}
    
    # O side_effect faz o mock retornar valores diferentes a cada chamada
    mock_get.side_effect = [mock_429, mock_200]

    resultado = fetch_popular_movies(total_movies_target=1)

    # Verificamos se ele realmente tentou de novo e pegou o dado
    assert resultado["results"][0]["title"] == "Sucesso após delay"
    assert mock_sleep.called # Garante que ele executou o time.sleep(5)
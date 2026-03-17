from fastapi.testclient import TestClient
from src.api import app

client = TestClient(app)

def test_read_movies_status():
    # Testa se a rota de filmes está online
    response = client.get("/api/movies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_pipeline_logs():
    # Testa se a rota de logs responde corretamente
    response = client.get("/api/pipeline/logs")
    assert response.status_code == 200
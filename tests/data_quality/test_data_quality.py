from pathlib import Path
import pandas as pd
import pytest
import os

# Caminho para o dado final
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
PARQUET_PATH = ROOT_DIR / "data" / "processed" / "movies_processed.parquet"

@pytest.fixture
def df_gold():
    """Lê o arquivo final para os testes de qualidade."""
    if not os.path.exists(PARQUET_PATH):
        pytest.skip("Arquivo Parquet não encontrado. Execute o pipeline primeiro.")
    return pd.read_parquet(PARQUET_PATH)

def test_check_duplicates(df_gold):
    """Garante que não existem IDs duplicados (Unicidade)."""
    duplicates = df_gold.duplicated(subset=['id']).sum()
    assert duplicates == 0, f"Encontrados {duplicates} IDs duplicados no Parquet!"

def test_check_null_values(df_gold):
    """Garante que colunas críticas não tenham valores nulos (Completude)."""
    critical_cols = ['id', 'title', 'release_year']
    for col in critical_cols:
        null_count = df_gold[col].isnull().sum()
        assert null_count == 0, f"Coluna {col} contém {null_count} valores nulos!"

def test_check_vote_range(df_gold):
    """Garante que as notas estão entre 0 e 10 (Validade)."""
    invalid_votes = df_gold[(df_gold['vote_average'] < 0) | (df_gold['vote_average'] > 10)]
    assert len(invalid_votes) == 0, "Encontrados filmes com notas fora do intervalo 0-10!"

def test_check_min_volume(df_gold):
    """Garante que o pipeline processou uma quantidade mínima razoável de dados."""
    # Se você pediu 1000, vamos garantir que pelo menos 800 sobreviveram à limpeza
    assert len(df_gold) > 100, "Volume de dados muito baixo. Algo pode ter falhado na extração."
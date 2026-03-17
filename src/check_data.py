import pandas as pd
import json
import os

# Apontamos para o arquivo RAW onde os dados chegaram da API
path = os.path.join('data', 'raw', 'movies_raw.json')

if not os.path.exists(path):
    print(f"❌ Erro: O arquivo {path} não foi encontrado!")
else:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # No RAW do TMDB, os filmes ficam dentro da chave 'results'
    df = pd.DataFrame(data['results'])

    # 1. Verificar filmes com data de lançamento vazia ou nula
    filmes_sem_data = df[df['release_date'].isna() | (df['release_date'] == "")]

    # 2. Verificar filmes com datas "estranhas" (ex: apenas o ano ou formato inválido)
    # Tentamos converter e os que falharem viram NaT (Not a Time)
    df['date_dt'] = pd.to_datetime(df['release_date'], errors='coerce')
    filmes_data_invalida = df[df['date_dt'].isna() & ~df['release_date'].isin(["", None])]

    print(f"📊 Total de filmes analisados: {len(df)}")
    print("-" * 50)

    if not filmes_sem_data.empty:
        print(f"⚠️ {len(filmes_sem_data)} filmes encontrados SEM NENHUMA DATA:")
        print(filmes_sem_data[['title', 'popularity']].head(20))
    else:
        print("✅ Nenhum filme com data totalmente vazia.")

    print("-" * 50)

    if not filmes_data_invalida.empty:
        print(f"🧐 {len(filmes_data_invalida)} filmes com FORMATO DE DATA INVÁLIDO:")
        print(filmes_data_invalida[['title', 'release_date']])
    else:
        print("✅ Todos os formatos de data parecem válidos.")
%md

# 🎬 Movie Intelligence Hub: AI-Driven Pipeline & Business Analytics

---

Este projeto implementa uma arquitetura de Data Lakehouse de ponta a ponta, integrada a um motor de Inteligência Artificial Híbrida. A solução extrai dados globais do mercado cinematográfico, aplica transformações colunares de alta performance e utiliza modelos de linguagem (LLMs) para gerar análises estratégicas sobre ROI, saturação de mercado e janelas de oportunidade, entregando tudo em um dashboard analítico reativo.

## 📐 Arquitetura da Solução

---

O ecossistema utiliza o Padrão de Medalhão (Bronze/Silver/Gold) para garantir a linhagem e a qualidade do dado:

- Bronze (Raw): Ingestão de metadados brutos via TMDB API em formato JSON.
- Silver (Processed): Saneamento, normalização de datas e enriquecimento via Pandas, com persistência em Apache Parquet para performance colunar.
- Gold (Insights): Camada de inteligência de negócios onde KPIs estatísticos são processados por modelos de IA para geração de relatórios executivos.

## 🕸️ Funcionalidades de Elite

---

- **AI Hybrid Failover:** Sistema resiliente que prioriza o Google Gemini 2.5 Flash e alterna automaticamente para o Llama 3.3 (via Groq) em caso de limite de cota, garantindo alta disponibilidade da análise.
- **Strategic Prompt Engineering:** A IA atua como um Consultor Sênior, utilizando frameworks como Oceano Azul vs. Oceano Vermelho para identificar anomalias em meses saturados (ex: Dezembro) e sugerir janelas de lucro.
- **Performance Colunar (Parquet):** Substituição de bases tradicionais por arquivos Parquet, otimizando a leitura de grandes volumes de dados no dashboard React.
- **Data Observability:** Monitoramento em tempo real do pipeline. O dashboard exibe logs de execução, status de saúde dos dados e o provedor de IA utilizado no momento.
- **Responsive Data Viz:** Gráficos dinâmicos com Recharts utilizando redimensionamento explícito via Hooks, eliminando erros de renderização em layouts complexos.

## 🛠️ Tecnologias Utilizadas

---

- **Backend:** Python 3.10+, FastAPI (Async), Pandas, PyArrow.
- **Inteligência Artificial:** Google Generative AI (Gemini) & Groq Cloud API.
- **Frontend:** React, TypeScript, Vite, Recharts.
- **Arquitetura:** Medallion Architecture (Bronze/Silver/Gold).

## 📁 Estrutura do Projeto

---

```text
├── data/
│   ├── raw/            # Dados brutos (JSON) - Camada Bronze
│   └── processed/      # Dados colunares (Parquet) - Camada Silver
├── src/
│   ├── api.py          # Servidor FastAPI e Motor de Orquestração de IA
│   ├── extract.py      # Script de ingestão TMDB API
│   ├── transform.py    # Lógica de saneamento e conversão Parquet
│   ├── run_pipeline.py # Orquestrador de execução e logs
│   └── metadata.json   # Registro de auditoria e cache de IA
├── frontend/
│   ├── src/pages/      # Dashboard e visualização de métricas
│   └── src/types/      # Definições de tipos TypeScript
├── .env                # Chaves de API (Gemini/Groq)
└── requirements.txt    # Dependências do ecossistema
```

## ⚙️ Instruções de Configuração

---

**1. Variáveis de Ambiente**

- Crie um arquivo .env na raiz do projeto e adicione:
  `GOOGLE_API_KEY=sua_chave_gemini`<br>
  `GROQ_API_KEY=sua_chave_groq`

- **🔑 Configuração das Chaves de API:**
  Para que o motor de inteligência híbrida funcione, você precisará configurar as chaves de acesso do Google Gemini (Provedor Principal) e da Groq (Provedor de Resiliência/Failover).

- **1. Google Gemini (Google AI Studio)**
  - Acesse o Google AI Studio.
  - Faça login com sua conta Google.
  - No menu lateral esquerdo, clique em "Get API key".
  - Clique no botão "Create API key" (selecione um projeto existente ou crie um novo).
  - Copie a chave gerada e cole no seu arquivo .env no campo `GOOGLE_API_KEY`.

- **2. Groq Cloud (Llama 3.3)**
  - Acesse o Groq Cloud Console.
  - Faça login ou crie uma conta gratuita.
  - Vá na seção "API Keys" no menu lateral.
  - Clique em "Create API Key".
  - Dê um nome (ex: Movie-Pipeline) e copie a chave gerada.
  - Cole no seu arquivo .env no campo `GROQ_API_KEY`.

**2. Configuração do Ambiente (Python)**

- `python -m venv venv`
- No Linux: `source venv/bin/activate`
- No Windows: `.\venv\Scripts\activate`
- `pip install -r requirements.txt`

**3. Execução do Sistema**

- **Rodar Pipeline:** <br>
  `python src/run_pipeline.py` (Isso gera o arquivo Parquet e metadados).
- **Subir Backend:** <br>
  `uvicorn src.api:app --reload`
- **Subir Frontend:**
- `cd frontend `
- `npm install `
- `npm run dev`

## 🚀 Como Rodar (Modo Rápido - Docker)

---

Este projeto está totalmente containerizado. Para subir o ecossistema completo:

- **Configurar Chaves:** Certifique-se de que o seu .env na raiz possui as chaves TMDB_API_KEY e GEMINI_API_KEY.
- **Executar:** `docker compose up --build`
- **Frontend:** http://localhost
- **API Docs:** http://localhost:8000/docs

**Vantagens:**

- **Isolamento:** O Backend não disputa mais com o Python do Windows. Ele tem o próprio ambiente Linux (Debian Slim) com todas as libs (Pandas, PyArrow, FastAPI) instaladas.
- **Comunicação:** O Frontend e o Backend estão na mesma rede virtual do Docker. O Dashboard React agora se relaciona com a API de forma estável.
- **Persistência (Volumes):** Quando o pipeline roda dentro do container e gera o .parquet, o volume (./data:/app/data) garante que o arquivo apareça na sua pasta do Windows em tempo real.

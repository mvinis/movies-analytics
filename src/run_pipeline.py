import subprocess
import json
import os
import pandas as pd
import sys
import logging
from datetime import datetime

# 1. Configuração de Caminhos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
LOGS_DIR = os.path.join(BASE_DIR, '..', 'logs')
METADATA_PATH = os.path.join(DATA_DIR, 'metadata.json')
PARQUET_PATH = os.path.join(DATA_DIR, 'processed', 'movies_processed.parquet')
LOG_FILE = os.path.join(LOGS_DIR, 'pipeline.log')

os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, 'processed'), exist_ok=True)

# 2. Configuração do Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ],
    force=True 
)
logger = logging.getLogger("Pipeline")

def generate_metadata(status="Sucesso", details="Pipeline concluído."):
    """Atualiza o histórico e limpa o cache da IA."""
    logging.info("FINALIZANDO: Gravando metadados e atualizando dashboard...", flush=True)
    
    history = []
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                history = json.load(f)
                if not isinstance(history, list): history = []
        except:
            history = []

    rows = 0
    if status == "Sucesso" and os.path.exists(PARQUET_PATH):
        try:
            df = pd.read_parquet(PARQUET_PATH)
            rows = len(df)
        except:
            rows = 0

    new_entry = {
        "last_execution": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "rows_processed": rows,
        "status": status,
        "details": details,
        "ai_insights": None 
    }

    history.insert(0, new_entry)
    history = history[:15]

    with open(METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=4, ensure_ascii=False)
        
def run_step(script_name, display_name):
    # Avisa ao Dashboard qual etapa está começando
    logging.info(f"{display_name.upper()}: Executando script {script_name}...", flush=True)
    
    script_path = os.path.join(BASE_DIR, script_name)
    
    result = subprocess.run(
        [sys.executable, script_path], 
        capture_output=True, 
        text=True,
        encoding='utf-8',
        errors='replace'
    )
    
    if result.returncode == 0:
        return True, "Sucesso"
    else:
        error_raw = result.stderr.strip() if result.stderr else result.stdout.strip()
        short_error = error_raw.splitlines()[-1] if error_raw else "Erro desconhecido"
        return False, short_error

if __name__ == "__main__":
    logger.info("INICIANDO CICLO DE EXECUÇÃO")
    
    # Passo 1: Extração
    success_extract, msg_extract = run_step("extract.py", "EXTRAINDO")
    
    if success_extract:
        # Passo 2: Transformação
        success_transform, msg_transform = run_step("transform.py", "TRANSFORMANDO")
        
        if success_transform:
            generate_metadata(status="Sucesso", details="Pipeline concluído.")
            logging.info("PRONTO: Todos os dados foram atualizados com sucesso!", flush=True)
        else:
            generate_metadata(status="Falha", details=f"Erro no Transform: {msg_transform}")
            logging.error(f"ERRO: Falha na transformação - {msg_transform}", flush=True)
    else:
        generate_metadata(status="Falha", details=f"Erro no Extract: {msg_extract}")
        logging.error(f"ERRO: Falha na extração - {msg_extract}", flush=True)
        sys.exit(1)

    # Mensagem final para o streaming fechar
    logging.info("FINISHED", flush=True)
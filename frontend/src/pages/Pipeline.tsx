import React, { useEffect, useState } from "react";
import { endpoints } from "../api"; // Ajuste o caminho conforme sua estrutura

interface LogEntry {
  id: number;
  time: string;
  step: string;
  status: string;
  detail: string;
}

export function Pipeline() {
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("TODOS");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Aguardando backend...");
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // 1. Função de busca de logs (Histórico)
  const fetchLogs = async () => {
    try {
      const res = await fetch(endpoints.pipelineLogs);
      if (!res.ok) throw new Error("Erro na resposta da API");
      const data = await res.json();
      setExecutionLogs(Array.isArray(data) ? data : []);
      setError(false);
    } catch (err) {
      console.error("Erro ao conectar com a API de logs:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 2. Monitoramento Reativo e Persistência
  useEffect(() => {
    fetchLogs();

    const savedStatus = localStorage.getItem("pipeline_running");
    if (savedStatus === "true") {
      setIsRunning(true);
      setCurrentStatus("Retomando monitoramento...");

      const checkInterval = setInterval(async () => {
        try {
          const res = await fetch(endpoints.pipelineLogs);
          const data = await res.json();
          const finished = data.some(
            (log: any) =>
              log.step === "Pipeline Total" && log.status === "Sucesso",
          );

          if (finished) {
            setIsRunning(false);
            localStorage.removeItem("pipeline_running");
            setExecutionLogs(data);
            clearInterval(checkInterval);
          }
        } catch (e) {
          console.error("Erro no polling:", e);
        }
      }, 3000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  // 3. Execução com Streaming de Logs (Real-time Feedback)
  const confirmAndRun = async () => {
    setShowModal(false);
    setIsRunning(true);
    setCurrentStatus("Iniciando conexão...");
    localStorage.setItem("pipeline_running", "true");

    try {
      const response = await fetch(endpoints.runPipeline, {
        method: "POST",
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Falha ao ler stream do backend");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            const msg = line.replace("data: ", "").trim();
            if (msg === "FINISHED") {
              setIsRunning(false);
              localStorage.removeItem("pipeline_running");
              fetchLogs();
            } else if (msg) {
              setCurrentStatus(msg); // Atualiza o texto do terminal com o print do Python
            }
          }
        });
      }
    } catch (err) {
      alert("Erro crítico ao conectar com o backend.");
      setIsRunning(false);
      localStorage.removeItem("pipeline_running");
    }
  };

  const filteredLogs = executionLogs.filter((log) => {
    if (filter === "TODOS") return true;
    return log.step?.toUpperCase() === filter;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setCurrentPage(1); // Reseta para a primeira página ao filtrar
  };

  return (
    <main className="page-container">
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
            <h3
              style={{
                color: "#ffd84d",
                marginBottom: "12px",
                fontSize: "20px",
              }}
            >
              Ação Crítica
            </h3>
            <p
              style={{
                color: "#d1d5db",
                lineHeight: "1.6",
                marginBottom: "24px",
                fontSize: "14px",
                textAlign: "left",
              }}
            >
              Você está prestes a iniciar o{" "}
              <strong>Pipeline Completo de ETL</strong> (Extração, Transformação
              e Carga).
              <br />
              <br />• <strong>Consumo de API:</strong> Serão feitas requisições
              que utilizam cotas de processamento.
              <br />• <strong>Sincronização:</strong> Todos os indicadores e
              métricas da plataforma serão atualizados.
              <br />• <strong>Processamento:</strong> Envolve limpeza e
              estruturação de dados, o que pode levar alguns minutos.
              <br />
              <br />O progresso será exibido em tempo real no console abaixo.
              Deseja continuar?
            </p>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={cancelButtonStyle}
              >
                CANCELAR
              </button>
              <button onClick={confirmAndRun} style={confirmButtonStyle}>
                CONFIRMAR ATUALIZAÇÃO
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={headerLayout}>
        <div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#ffd84d",
              margin: 0,
            }}
          >
            Arquitetura e Monitoramento
          </h2>
          <p style={{ color: "#9ca3af", marginTop: "8px", fontSize: "15px" }}>
            Controle persistente com streaming de logs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          disabled={isRunning || error}
          style={{
            ...triggerButtonStyle,
            backgroundColor: isRunning ? "#444" : "#ffd84d",
            cursor: isRunning || error ? "not-allowed" : "pointer",
          }}
        >
          {isRunning ? "⚙️ PROCESSANDO..." : "EXECUTAR PIPELINE"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "32px" }}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>Linhagem do Pipeline (Data Lineage)</h3>
          <div style={diagramContainerStyle}>
            <ArchitectureNode icon="🌐" title="TMDB API" desc="Bronze / Raw" />
            <AnimatedArrow />
            <ArchitectureNode
              icon="🐍"
              title="Python / Pandas"
              desc="Silver / Transform"
            />
            <AnimatedArrow />
            <ArchitectureNode icon="🗄️" title="Parquet" desc="Data Lake" />
            <AnimatedArrow />
            <ArchitectureNode icon="⚡" title="FastAPI" desc="Serving Layer" />
            <AnimatedArrow />
            <ArchitectureNode
              icon="⚛️"
              title="React App"
              desc="Gold / Insights"
            />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={consoleHeaderStyle}>
            <h3 style={titleStyle}>Console de Execução</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {["TODOS", "EXTRACT", "TRANSFORM", "LOAD"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  style={{
                    backgroundColor: filter === cat ? "#ffd84d" : "transparent",
                    color: filter === cat ? "#1b1b1b" : "#9ca3af",
                    border: `1px solid ${filter === cat ? "#ffd84d" : "#333"}`,
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={terminalStyle}>
            {!isRunning && loading ? (
              <p style={{ color: "#ffd84d", fontFamily: "monospace" }}>
                Obtendo metadados...
              </p>
            ) : (
              <>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid rgba(255,216,77,0.2)" }}
                    >
                      <th style={thStyle}>TIMESTAMP</th>
                      <th style={thStyle}>STAGE</th>
                      <th style={thStyle}>STATUS</th>
                      <th style={thStyle}>METADATA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isRunning && (
                      <tr className="terminal-loader-row">
                        <td style={tdStyle}>
                          {new Date().toLocaleTimeString()}
                        </td>
                        <td style={tdStyle}>
                          <strong style={{ color: "#ffd84d" }}>
                            ORQUESTRAÇÃO
                          </strong>
                        </td>
                        <td style={{ ...tdStyle, color: "#ffd84d" }}>
                          ● EM CURSO
                        </td>
                        <td style={{ ...tdStyle, padding: "0" }}>
                          <div style={{ padding: "16px 12px" }}>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#ffd84d",
                                fontFamily: "monospace",
                                textTransform: "uppercase",
                              }}
                            >
                              {currentStatus}
                            </div>
                            <div className="progress-line"></div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {currentLogs.map((log) => (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <td style={tdStyle}>{log.time}</td>
                        <td style={tdStyle}>
                          <strong>{log.step?.toUpperCase()}</strong>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              log.status === "Falha" ? "#ef4444" : "#10b981",
                          }}
                        >
                          ● {log.status}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color: "#9ca3af",
                            fontFamily: "monospace",
                          }}
                        >{`> ${log.detail}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={paginationContainerStyle}>
                  <div style={{ color: "#6b7280", fontSize: "12px" }}>
                    Logs:{" "}
                    <strong>
                      {indexOfFirstItem + 1}-
                      {Math.min(indexOfLastItem, filteredLogs.length)}
                    </strong>{" "}
                    / {filteredLogs.length}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "center",
                    }}
                  >
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      style={arrowButtonStyle(currentPage === 1)}
                    >
                      ❮
                    </button>
                    <span
                      style={{
                        color: "#ffd84d",
                        fontSize: "13px",
                        fontWeight: 700,
                      }}
                    >
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      style={arrowButtonStyle(
                        currentPage === totalPages || totalPages === 0,
                      )}
                    >
                      ❯
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress-bar { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }
        .terminal-loader-row { background-color: rgba(255, 216, 77, 0.05) !important; }
        .progress-line { height: 2px; background: #ffd84d; box-shadow: 0 0 10px #ffd84d; animation: progress-bar 3s infinite linear; }
      `}</style>
    </main>
  );
}

// --- ESTILOS ---
const headerLayout: React.CSSProperties = {
  marginBottom: "32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.8)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
  backgroundColor: "#1b1b1b",
  padding: "40px",
  borderRadius: "20px",
  border: "1px solid #ffd84d44",
  maxWidth: "400px",
  textAlign: "center",
};
const cancelButtonStyle = {
  backgroundColor: "transparent",
  color: "#9ca3af",
  border: "1px solid #333",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  marginRight: "10px",
};
const confirmButtonStyle = {
  backgroundColor: "#ffd84d",
  color: "#1b1b1b",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  fontWeight: 700,
  cursor: "pointer",
};
const triggerButtonStyle = {
  padding: "12px 24px",
  borderRadius: "8px",
  border: "none",
  color: "#1b1b1b",
  fontWeight: 800,
  fontSize: "11px",
  boxShadow: "0 4px 15px rgba(255,216,77,0.2)",
};
const cardStyle = {
  backgroundColor: "#262626",
  padding: "24px",
  borderRadius: "16px",
  border: "1px solid #ffffff0a",
};
const terminalStyle = {
  backgroundColor: "#1b1b1b",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #333",
  overflowX: "auto" as const,
};
const titleStyle = { margin: "0 0 20px 0", fontSize: "18px", color: "#fff" };
const thStyle = {
  padding: "12px",
  color: "#ffd84d",
  fontSize: "10px",
  letterSpacing: "1px",
};
const tdStyle = { padding: "14px 12px", color: "#fff", fontSize: "12px" };
const diagramContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px",
  backgroundColor: "#1b1b1b",
  borderRadius: "12px",
  gap: "10px",
};
const consoleHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};
const paginationContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "24px",
  paddingTop: "20px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};
const arrowButtonStyle = (disabled: boolean): React.CSSProperties => ({
  backgroundColor: "transparent",
  color: disabled ? "#444" : "#ffd84d",
  border: `1px solid ${disabled ? "#333" : "rgba(255, 216, 77, 0.3)"}`,
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "not-allowed" : "pointer",
});

function ArchitectureNode({ icon, title, desc }: any) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#1b1b1b",
        padding: "15px",
        borderRadius: "10px",
        minWidth: "120px",
        border: "1px solid #333",
      }}
    >
      <span style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</span>
      <strong style={{ fontSize: "12px", color: "#ffd84d" }}>{title}</strong>
      <span style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>
        {desc}
      </span>
    </div>
  );
}
function AnimatedArrow() {
  return <div style={{ color: "#ffd84d" }}>➔</div>;
}

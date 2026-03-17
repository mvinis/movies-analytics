import React, { useEffect, useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  Bar,
  BarChart,
} from "recharts";
import { type Movie } from "../types";

interface MetricsProps {
  movies: Movie[];
  error: string | null;
}

// Hook para capturar a largura da janela em tempo real (Responsividade Blindada)
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

export function Metrics({ movies, error }: MetricsProps) {
  const windowWidth = useWindowWidth();
  const [lastUpdate, setLastUpdate] = useState<string>("---");
  const [loadingAi, setLoadingAi] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdatingPipeline] = useState(false); // Loader Global

  const [aiInsights, setAiInsights] = useState<{
    correlation: string;
    trend: string;
    quality: string;
    market: string;
    provider?: string;
  }>({
    correlation: "",
    trend: "",
    quality: "",
    market: "",
    provider: "",
  });

  // Cálculo da largura do gráfico (Resolve erro de width -1 no Grid)
  const chartWidth = useMemo(() => {
    if (windowWidth > 1024) {
      const availableWidth = Math.min(windowWidth, 1200) - 80;
      return availableWidth / 2 - 40;
    }
    return windowWidth - 80;
  }, [windowWidth]);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Busca Logs e Última Atualização
  useEffect(() => {
    if (!error) {
      fetch("http://127.0.0.1:8000/api/pipeline/logs")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const rawDate = data[0].time;
            try {
              const [datePart, timePart] = rawDate.split(" ");
              const [year, month, day] = datePart.split("-");
              const [hour, min] = timePart.split(":");
              setLastUpdate(`${day}/${month}/${year} às ${hour}h${min}`);
            } catch (e) {
              setLastUpdate(rawDate);
            }
          }
        })
        .catch(() => setLastUpdate("Indisponível"));
    }
  }, [error]);

  // Busca Insights da IA (Gemini/Groq)
  useEffect(() => {
    setLoadingAi(true);
    fetch("http://127.0.0.1:8000/api/ai/insights")
      .then((res) => res.json())
      .then((data) => {
        if (data) setAiInsights((prev) => ({ ...prev, ...data }));
        setLoadingAi(false);
      })
      .catch((err) => {
        console.error("Erro no fetch da IA:", err);
        setLoadingAi(false);
      });
  }, []);

  if (error)
    return (
      <main className="page-container">
        <div style={errorContainerStyle}>
          <span style={{ fontSize: "50px" }}>📉</span>
          <h2 style={{ color: "#ef4444", margin: "16px 0" }}>
            Painel Analítico Offline
          </h2>
          <button
            onClick={() => window.location.reload()}
            style={retryButtonStyle}
          >
            Tentar Reconectar
          </button>
        </div>
      </main>
    );

  if (!movies || movies.length === 0)
    return (
      <main className="page-container">
        <p style={loadingStateStyle}>
          ⌛ Calculando indicadores estatísticos...
        </p>
      </main>
    );

  // --- PREPARAÇÃO DE DADOS ---
  const scatterData = movies.map((m) => ({
    name: m.title,
    popularidade: parseFloat(m.popularity.toFixed(2)),
    nota: parseFloat(m.vote_average.toFixed(1)),
  }));

  const yearCount: Record<string, number> = {};
  movies.forEach((m) => {
    if (m.release_year)
      yearCount[m.release_year] = (yearCount[m.release_year] || 0) + 1;
  });
  const lineData = Object.keys(yearCount)
    .sort()
    .map((year) => ({ ano: year, quantidade: yearCount[year] }));

  const bins = ["0-2", "2-4", "4-6", "6-8", "8-10"];
  const distributionData = bins.map((range) => {
    const [min, max] = range.split("-").map(Number);
    const count = movies.filter(
      (m) => m.vote_average >= min && m.vote_average < (max === 10 ? 11 : max),
    ).length;
    return { faixa: range, quantidade: count };
  });

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const seasonalData = monthNames.map((name, index) => {
    const count = movies.filter(
      (m) => m.release_date && new Date(m.release_date).getMonth() === index,
    ).length;
    return { mes: name, quantidade: count };
  });

  return (
    <main
      className="page-container"
      style={{ position: "relative", overflowX: "hidden" }}
    >
      {/* 🚀 ANIMAÇÃO DE LOADING GLOBAL (DATA SYNC) */}
      {isUpdatingPipeline && (
        <div style={globalLoaderOverlay}>
          <div style={loaderContent}>
            <div className="scanner"></div>
            <span style={{ fontSize: "40px" }}>⚡</span>
            <h3 style={{ color: "#ffd84d", margin: "10px 0" }}>
              Sincronizando Data Lake
            </h3>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            >
              EXECUTANDO: EXTRAÇÃO TMDB {">"} PARQUET CONVERSION
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "32px", padding: "0 20px" }}>
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#ffd84d",
            margin: 0,
          }}
        >
          Métricas e Análises Profundas
        </h2>
        <div style={updateBadgeStyle}>
          <span>🕒</span>
          <span>
            Última atualização: <strong>{lastUpdate}</strong>
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        {/* GRÁFICO 1 */}
        <div className="metric-card" style={cardStyle}>
          <h3 style={titleStyle}>Popularidade vs. Nota Média</h3>
          <div style={chartWrapperStyle}>
            {isMounted && (
              <ScatterChart
                width={chartWidth}
                height={300}
                margin={{ top: 20, right: 30, bottom: 20, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="nota"
                  type="number"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis
                  dataKey="popularidade"
                  type="number"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <RechartsTooltip
                  cursor={{ stroke: "#ffd84d" }}
                  contentStyle={tooltipStyle}
                />
                <Scatter data={scatterData} fill="#ffd84d" fillOpacity={0.6} />
              </ScatterChart>
            )}
          </div>
          <AIInsightBox
            loading={loadingAi}
            text={aiInsights.correlation}
            provider={aiInsights.provider}
          />
        </div>

        {/* GRÁFICO 2 */}
        <div className="metric-card" style={cardStyle}>
          <h3 style={titleStyle}>Evolução de Lançamentos</h3>
          <div style={chartWrapperStyle}>
            {isMounted && (
              <LineChart
                width={chartWidth}
                height={300}
                data={lineData}
                margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis dataKey="ano" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#ffd84d"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}
          </div>
          <AIInsightBox
            loading={loadingAi}
            text={aiInsights.trend}
            provider={aiInsights.provider}
          />
        </div>

        {/* GRÁFICO 3 */}
        <div className="metric-card" style={cardStyle}>
          <h3 style={titleStyle}>Distribuição de Notas</h3>
          <div style={chartWrapperStyle}>
            {isMounted && (
              <BarChart
                width={chartWidth}
                height={300}
                data={distributionData}
                margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis dataKey="faixa" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="quantidade"
                  fill="#ffd84d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </div>
          <AIInsightBox
            loading={loadingAi}
            text={aiInsights.quality}
            provider={aiInsights.provider}
          />
        </div>

        {/* GRÁFICO 4 */}
        <div className="metric-card" style={cardStyle}>
          <h3 style={titleStyle}>Sazonalidade Mensal</h3>
          <div style={chartWrapperStyle}>
            {isMounted && (
              <BarChart
                width={chartWidth}
                height={300}
                data={seasonalData}
                margin={{ top: 20, right: 20, bottom: 20, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="quantidade"
                  fill="#ffd84d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </div>
          <AIInsightBox
            loading={loadingAi}
            text={aiInsights.market}
            provider={aiInsights.provider}
          />
        </div>
      </div>

      <style>{`
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; padding: 0 20px; width: 100%; box-sizing: border-box; }
        .metric-card { min-width: 0; overflow: hidden; }
        
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .scanner {
          position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(to right, transparent, #ffd84d, transparent);
          box-shadow: 0 0 15px #ffd84d;
          animation: scan 2s infinite linear;
        }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        .pulse { animation: pulse 1.5s infinite ease-in-out; }
        
        @media (max-width: 1024px) { .metrics-grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}

function AIInsightBox({
  loading,
  text,
  provider,
}: {
  loading: boolean;
  text: string;
  provider?: string;
}) {
  return (
    <div style={aiInsightBoxStyle}>
      <div style={aiHeaderContainer}>
        <div style={aiLabelStyle}>
          <span className={loading ? "pulse" : ""}>🤖</span> ESTRATEGISTA IA
        </div>
        {!loading && text && (
          <div style={verifiedBadgeStyle}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            VERIFICADO: {provider || "AI ENGINE"}
          </div>
        )}
      </div>
      <p style={aiInsightTextStyle}>
        {loading
          ? "Processando heurísticas estratégicas..."
          : text || "Aguardando análise de dados..."}
      </p>
    </div>
  );
}

// --- ESTILOS ---
const cardStyle = {
  backgroundColor: "#262626",
  padding: "28px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
};
const chartWrapperStyle = {
  width: "100%",
  height: 300,
  display: "flex",
  justifyContent: "center" as const,
};
const titleStyle = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "18px",
  fontWeight: 700,
  color: "#ffffff",
};
const tooltipStyle = {
  backgroundColor: "#1b1b1b",
  border: "1px solid #ffd84d",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};
const updateBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "#ffd84d",
  backgroundColor: "rgba(255, 216, 77, 0.05)",
  padding: "8px 12px",
  borderRadius: "6px",
  width: "fit-content",
  border: "1px solid rgba(255, 216, 77, 0.1)",
  marginTop: "8px",
};
const loadingStateStyle = {
  padding: "40px",
  color: "#ffd84d",
  textAlign: "center" as const,
  fontFamily: "monospace",
};
const errorContainerStyle: React.CSSProperties = {
  backgroundColor: "#262626",
  padding: "60px 20px",
  borderRadius: "16px",
  border: "1px solid #ef4444",
  textAlign: "center",
  marginTop: "40px",
};
const retryButtonStyle = {
  padding: "10px 24px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 700,
  marginTop: "20px",
};
const aiInsightBoxStyle = {
  marginTop: "20px",
  padding: "18px",
  backgroundColor: "rgba(255, 216, 77, 0.02)",
  borderRadius: "12px",
  border: "1px solid rgba(255, 216, 77, 0.1)",
  borderLeft: "4px solid #ffd84d",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
};
const aiHeaderContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};
const aiLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#ffd84d",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1px",
};
const verifiedBadgeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "9px",
  fontWeight: 800,
  color: "#10b981",
  backgroundColor: "rgba(16, 185, 129, 0.1)",
  padding: "4px 8px",
  borderRadius: "4px",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};
const aiInsightTextStyle = {
  margin: 0,
  fontSize: "13px",
  color: "#d1d5db",
  lineHeight: "1.7",
};

const globalLoaderOverlay: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  zIndex: 9999,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const loaderContent: React.CSSProperties = {
  textAlign: "center",
  padding: "40px",
  backgroundColor: "#1b1b1b",
  borderRadius: "20px",
  border: "1px solid rgba(255, 216, 77, 0.3)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  position: "relative",
  overflow: "hidden",
  minWidth: "300px",
};

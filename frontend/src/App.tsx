import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./sections/Header";
import { ProjectOverview } from "./sections/ProjectOverview";
import { KpiCards } from "./sections/KpiCards";
import { type Movie } from "./types";

// Importação das páginas
import { Metrics } from "./pages/Metrics";
import { Catalog } from "./pages/Catalog";
import { Pipeline } from "./pages/Pipeline";
import { MovieDetail } from "./pages/MovieDetail";

import "./index.css";

// --- SUB-COMPONENTE: OVERVIEW PAGE ---
function OverviewPage({ movies, loading, error }: any) {
  if (error) {
    return (
      <main className="page-container" style={{ flex: 1 }}>
        <ProjectOverview />
        <div style={errorBoxStyle}>
          <span style={{ fontSize: "50px" }}>📡</span>
          <h3 style={{ color: "#ef4444", marginTop: "16px", fontSize: "22px" }}>
            Conexão Interrompida
          </h3>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "15px",
              maxWidth: "500px",
              margin: "16px auto",
            }}
          >
            Verifique se o backend (main.py) está ligado.
          </p>
          <code style={errorCodeStyle}>Log técnico: {error}</code>
          <br />
          <button
            onClick={() => window.location.reload()}
            style={retryButtonStyle}
          >
            Tentar Reconectar
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-container" style={{ flex: 1 }}>
        <ProjectOverview />
        <p
          style={{
            color: "#ffd84d",
            padding: "40px",
            textAlign: "center",
            fontFamily: "monospace",
          }}
        >
          ⌛ Sincronizando com o Data Lakehouse...
        </p>
      </main>
    );
  }

  const hasMovies = movies.length > 0;
  const top10 = hasMovies
    ? [...movies].sort((a, b) => b.popularity - a.popularity).slice(0, 10)
    : [];
  const maxPopularity = hasMovies
    ? Math.max(...top10.map((m) => m.popularity))
    : 0;

  return (
    <main className="page-container" style={{ flex: 1 }}>
      <ProjectOverview />
      <KpiCards movies={movies} />
      <div style={containerStyle}>
        <h3 style={titleStyle}>Top 10 Filmes Mais Populares</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {top10.map((movie) => (
            <div key={movie.id} className="movie-data-row">
              <div className="poster-wrapper">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="mini-poster-chart"
                />
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}
                  >
                    {movie.title}
                  </span>
                  <span
                    style={{
                      color: "#ffd84d",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {movie.popularity.toFixed(0)} pts
                  </span>
                </div>
                <div style={barBackgroundStyle}>
                  <div
                    style={{
                      ...barFillStyle,
                      width: `${(movie.popularity / maxPopularity) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚀 ESTADOS GLOBAIS DE BUSCA E PÁGINA (Eles vivem aqui para não serem resetados)
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    fetch("http://127.0.0.1:8000/api/movies", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Movie[]) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.name === "AbortError" ? "Timeout" : "Servidor Offline");
        setLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));
  }, []);

  return (
    <BrowserRouter>
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage movies={movies} loading={loading} error={error} />
            }
          />
          <Route
            path="/catalog"
            element={
              <Catalog
                movies={movies}
                error={error}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            }
          />
          <Route
            path="/metrics"
            element={<Metrics movies={movies} error={error} />}
          />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/movie/:id" element={<MovieDetail movies={movies} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// --- ESTILOS MANTIDOS ---
const containerStyle = {
  backgroundColor: "#262626",
  padding: "32px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  marginBottom: "40px",
};
const titleStyle = {
  marginTop: 0,
  marginBottom: "32px",
  fontSize: "20px",
  fontWeight: 700,
  color: "#ffd84d",
};
const barBackgroundStyle = {
  width: "100%",
  height: "12px",
  backgroundColor: "rgba(255,255,255,0.05)",
  borderRadius: "10px",
  overflow: "hidden",
};
const barFillStyle = {
  height: "100%",
  backgroundColor: "#ffd84d",
  borderRadius: "10px",
  transition: "width 1s ease-in-out",
};
const errorBoxStyle: React.CSSProperties = {
  backgroundColor: "#262626",
  padding: "60px 20px",
  borderRadius: "16px",
  border: "1px solid #ef4444",
  textAlign: "center",
  marginTop: "40px",
  boxShadow: "0 10px 30px rgba(239, 68, 68, 0.1)",
};
const errorCodeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 16px",
  backgroundColor: "#1b1b1b",
  color: "#fca5a5",
  borderRadius: "4px",
  fontSize: "12px",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  fontFamily: "monospace",
};
const retryButtonStyle: React.CSSProperties = {
  marginTop: "32px",
  padding: "12px 28px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

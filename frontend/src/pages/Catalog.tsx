import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Movie } from "../types";

const GENRE_MAP: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção Científica",
  10770: "Cinema TV",
  53: "Suspense",
  10752: "Guerra",
  37: "Faroeste",
};

export function Catalog({
  movies,
  error,
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
}: {
  movies: Movie[];
  error: string | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number | ((p: number) => number)) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  // ❌ REMOVIDO: const [searchTerm, setSearchTerm] = useState("");
  // ❌ REMOVIDO: const [currentPage, setCurrentPage] = useState(1);

  const moviesPerPage = 30;
  const navigate = useNavigate();

  // 1. Filtragem dinâmica (Base total para o filtro)
  const allFilteredMovies = movies.filter((movie) => {
    const searchLower = searchTerm.trim().toLowerCase();
    if (!searchLower) return true;

    const matchesTitle = (movie.title || "")
      .toLowerCase()
      .includes(searchLower);
    const matchesGenreName = (movie.genre_ids || []).some((id) => {
      const genreName = GENRE_MAP[id];
      return genreName && genreName.toLowerCase().includes(searchLower);
    });

    return matchesTitle || matchesGenreName;
  });

  // 2. Cálculo dos índices para fatiar a página atual
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = allFilteredMovies.slice(
    indexOfFirstMovie,
    indexOfLastMovie,
  );
  const totalPages = Math.ceil(allFilteredMovies.length / moviesPerPage);

  // 3. Destaques (Sempre baseados no Top da busca atual, idependente da página)
  const featuredMovies = [...allFilteredMovies]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6);

  // Reset de página ao digitar
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Volta para a página 1 em cada nova busca
  };

  useEffect(() => {
    const isIdStillVisible = featuredMovies.some((m) => m.id === activeId);
    if (featuredMovies.length > 0 && (!activeId || !isIdStillVisible)) {
      setActiveId(featuredMovies[0].id);
    }
  }, [featuredMovies, activeId]);

  // Renderizações de Erro/Loading omitidas para brevidade, mantenha as suas...
  if (error) return <main>/* Seu componente de erro */</main>;
  if (!movies || movies.length === 0) return <main>/* Seu loading */</main>;

  return (
    <main className="page-container">
      <div style={headerFlexStyle}>
        <div>
          <h2 style={pageTitleStyle}>Catálogo Interativo</h2>
          <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "15px" }}>
            Explore os dados enriquecidos do Data Lakehouse.
          </p>
        </div>

        <div style={{ position: "relative", minWidth: "300px" }}>
          <input
            type="text"
            placeholder="Pesquisar filme pelo título, gênero..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={searchInputStyle}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={clearButtonStyle}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO EM ALTA */}
      {!searchTerm && (
        <section style={{ marginBottom: "48px" }}>
          <h3 style={sectionTitleStyle}>🔥 Em Alta</h3>
          <div className="dynamic-row">
            {featuredMovies.map((movie) => (
              <div
                key={`feat-${movie.id}`}
                className={`dynamic-card ${activeId === movie.id ? "active" : ""}`}
                onClick={() =>
                  window.innerWidth <= 768
                    ? navigate(`/movie/${movie.id}`)
                    : setActiveId(movie.id)
                }
              >
                <img src={movie.poster_url} alt={movie.title} />
                <div className="dynamic-info">
                  <span style={ratingLabelStyle}>
                    ★ {movie.vote_average.toFixed(1)} / 10
                  </span>
                  <h2 style={cardTitleStyle}>{movie.title}</h2>
                  <p style={cardYearStyle}>Lançamento: {movie.release_year}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/movie/${movie.id}`);
                    }}
                    style={detailButtonStyle}
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GRID COMPLETO COM PAGINAÇÃO */}
      <section style={{ marginBottom: "60px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            {searchTerm
              ? `Resultados: ${allFilteredMovies.length}`
              : "🍿 Catálogo Completo"}
          </h3>

          {/* CONTROLE DE PAGINAÇÃO MINIMALISTA */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => p - 1);
                  window.scrollTo(0, 500);
                }}
                style={arrowButtonStyle(currentPage === 1)}
              >
                ❮
              </button>

              <span
                style={{
                  color: "#ffd84d",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => p + 1);
                  window.scrollTo(0, 500);
                }}
                style={arrowButtonStyle(currentPage === totalPages)}
              >
                ❯
              </button>
            </div>
          )}
        </div>

        {currentMovies.length > 0 ? (
          <div
            key={`grid-container-${searchTerm}-${currentPage}`}
            style={gridStyle}
          >
            {currentMovies.map((movie) => (
              <div
                key={`grid-item-${movie.id}`}
                className="movie-card"
                style={{ height: "270px" }}
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  style={gridImageStyle}
                  loading="lazy"
                />
                <div style={gridOverlayStyle}>
                  <h3 style={gridTitleStyle}>{movie.title}</h3>
                  <div style={gridMetaStyle}>
                    <span style={{ color: "#d1d5db", fontSize: "12px" }}>
                      {movie.release_year}
                    </span>
                    <span
                      style={{
                        color: "#ffd84d",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      ★ {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}
          >
            <p>Nenhum filme encontrado. 🔍</p>
          </div>
        )}
      </section>
    </main>
  );
}

// --- ESTILOS ADICIONAIS ---
const arrowButtonStyle = (disabled: boolean): React.CSSProperties => ({
  backgroundColor: "transparent",
  color: disabled ? "#444" : "#ffd84d",
  border: `1px solid ${disabled ? "#333" : "rgba(255, 216, 77, 0.4)"}`,
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s",
});

// Reutilize seus outros estilos (gridStyle, searchInputStyle, etc...)
const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "24px",
};
const headerFlexStyle: React.CSSProperties = {
  marginBottom: "40px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  flexWrap: "wrap",
  gap: "20px",
};
const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "#262626",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};
const clearButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#6b7280",
  cursor: "pointer",
};
const pageTitleStyle = {
  fontSize: "28px",
  fontWeight: 700,
  color: "#ffffff",
  margin: 0,
};
const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#ffd84d",
  marginBottom: "16px",
};
const ratingLabelStyle = {
  color: "#000",
  fontWeight: "bold" as any,
  fontSize: "12px",
  letterSpacing: "1px",
  marginBottom: "8px",
  display: "block",
};
const cardTitleStyle = {
  color: "#000",
  margin: "0 0 8px 0",
  fontSize: "28px",
  fontWeight: 700,
  lineHeight: 1.1,
};
const cardYearStyle = { color: "#000", fontSize: "15px", margin: "0 0 24px 0" };
const detailButtonStyle = {
  padding: "10px 20px",
  backgroundColor: "#000",
  color: "#ffd84d",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};
const gridImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};
const gridOverlayStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background:
    "linear-gradient(to top, rgba(27, 27, 27, 0.95) 0%, rgba(27, 27, 27, 0.4) 40%, transparent 100%)",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  padding: "16px",
};
const gridTitleStyle = {
  margin: "0 0 4px 0",
  fontSize: "14px",
  color: "#ffffff",
  fontWeight: 600,
  lineHeight: 1.2,
  zIndex: 2,
};
const gridMetaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  zIndex: 2,
};

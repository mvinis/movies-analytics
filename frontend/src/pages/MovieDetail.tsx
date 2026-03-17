import { useParams, useNavigate } from "react-router-dom";
import { type Movie } from "../types";

// Dicionário para converter IDs em nomes de gêneros
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

export function MovieDetail({ movies }: { movies: Movie[] }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const movie = movies.find((m) => m.id === Number(id));

  if (!movie) {
    return (
      <main
        className="page-container"
        style={{ color: "#fff", textAlign: "center", paddingTop: "100px" }}
      >
        <h2>Filme não encontrado...</h2>
        <button
          onClick={() => navigate("/catalog")}
          style={{
            background: "#ffd84d",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          Voltar ao Catálogo
        </button>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div
        style={{
          backgroundColor: "#262626",
          padding: "40px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "32px",
            border: "1px solid #ffd84d",
            background: "transparent",
            padding: "8px 20px",
            borderRadius: "100px",
            cursor: "pointer",
            fontWeight: 600,
            color: "#ffd84d",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#ffd84d";
            e.currentTarget.style.color = "#1b1b1b";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#ffd84d";
          }}
        >
          ← Voltar
        </button>

        <div
          style={{
            display: "flex",
            gap: "60px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <img
            src={movie.poster_url}
            alt={movie.title}
            style={{
              width: "380px",
              borderRadius: "16px",
              boxShadow: "0 0 30px rgba(255, 216, 77, 0.1)",
            }}
          />

          <div style={{ flex: 1, minWidth: "300px" }}>
            <h1
              style={{
                fontSize: "56px",
                fontWeight: 800,
                color: "#ffd84d",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {movie.title}
            </h1>

            {/* SEÇÃO DE GÊNEROS (TAGS) */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "15px",
                flexWrap: "wrap",
              }}
            >
              {movie.genre_ids?.map((id) => (
                <span
                  key={id}
                  style={{
                    backgroundColor: "rgba(255, 216, 77, 0.1)",
                    color: "#ffd84d",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "1px solid rgba(255, 216, 77, 0.2)",
                  }}
                >
                  {GENRE_MAP[id] || "Outro"}
                </span>
              ))}
            </div>

            <p
              style={{
                fontSize: "20px",
                color: "#d1d5db",
                margin: "20px 0 40px 0",
                fontWeight: 500,
              }}
            >
              {movie.release_year}{" "}
            </p>

            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "32px",
                  marginBottom: "32px",
                }}
              >
                <Metric
                  label="Nota Média"
                  value={`★ ${movie.vote_average.toFixed(1)}`}
                  highlight
                />
                <Metric
                  label="Popularidade"
                  value={`${movie.popularity.toFixed(0)}`}
                />
                <Metric
                  label="Total de Votos"
                  value={movie.vote_count?.toLocaleString()}
                />
                <Metric label="ID Data Lake" value={`#${movie.id}`} />
              </div>
              <div style={{ color: "#fff" }}>
                <p>{movie.overview}</p>
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                backgroundColor: "#1b1b1b",
                borderRadius: "12px",
                borderLeft: "4px solid #ffd84d",
              }}
            >
              <h4
                style={{
                  margin: "0 10px 0",
                  color: "#ffd84d",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>⚙️</span> Metadados de
                Engenharia
              </h4>
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  margin: 0,
                  fontFamily: "monospace",
                }}
              >
                STATUS: SUCCESS | FORMAT: PARQUET | ENGINE: PANDAS <br />
                Pipeline sincronizado com API FastAPI. Dados persistidos na
                camada Silver.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <span
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "2px",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <p
        style={{
          fontSize: "28px",
          color: highlight ? "#ffd84d" : "#fff",
          fontWeight: 800,
          margin: "4px 0 0 0",
        }}
      >
        {value}
      </p>
    </div>
  );
}

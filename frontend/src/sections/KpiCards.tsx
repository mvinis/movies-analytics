interface Movie {
  id: number;
  title: string;
  release_year: number;
  popularity: number;
  vote_average: number;
}

interface KpiCardsProps {
  movies: Movie[];
}

export function KpiCards({ movies }: KpiCardsProps) {
  if (!movies || movies.length === 0) return null;

  const totalMovies = movies.length;

  const avgPopularity = (
    movies.reduce((acc, curr) => acc + curr.popularity, 0) / totalMovies
  ).toFixed(1);

  const topRatedMovie = movies.reduce((prev, current) =>
    prev.vote_average > current.vote_average ? prev : current,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "24px",
        marginBottom: "24px",
      }}
    >
      {/* Card 1: Total de Filmes */}
      <div style={cardStyle}>
        <p style={titleStyle}>Total Processado</p>
        <h2 style={valueStyle}>
          {totalMovies} <span style={suffixStyle}>filmes</span>
        </h2>
      </div>

      {/* Card 2: Média de Popularidade */}
      <div style={cardStyle}>
        <p style={titleStyle}>Média de Popularidade</p>
        <h2 style={valueStyle}>
          {avgPopularity} <span style={suffixStyle}>pts</span>
        </h2>
      </div>

      {/* Card 3: Top Nota */}
      <div style={cardStyle}>
        <p style={titleStyle}>Maior Nota ({topRatedMovie.vote_average})</p>
        <h2 style={valueStyle} title={topRatedMovie.title}>
          {topRatedMovie.title.length > 18
            ? `${topRatedMovie.title.substring(0, 18)}...`
            : topRatedMovie.title}
        </h2>
      </div>
    </div>
  );
}

// --- ESTILOS ATUALIZADOS PARA O TEMA DARK/YELLOW ---

const cardStyle = {
  backgroundColor: "#262626", // Fundo cinza escuro
  padding: "24px",
  borderRadius: "16px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  borderLeft: "4px solid #ffd84d", // Detalhe lateral em amarelo para um ar de "executivo"
};

const titleStyle = {
  margin: "0 0 8px 0",
  color: "#9ca3af", // Cinza suave para os rótulos
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
};

const valueStyle = {
  margin: 0,
  color: "#ffd84d", // Os números/valores agora são amarelos para saltarem aos olhos
  fontSize: "32px",
  fontWeight: 800,
  lineHeight: 1.2,
};

const suffixStyle = {
  fontSize: "14px",
  color: "#d1d5db",
  fontWeight: 500,
  marginLeft: "4px",
};

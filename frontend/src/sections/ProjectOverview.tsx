export function ProjectOverview() {
  return (
    <div
      style={{
        backgroundColor: "#262626", // Cinza escuro para destacar do fundo preto
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "16px",
          fontSize: "22px",
          fontWeight: 700,
          color: "#ffd84d", // Título em amarelo para destaque
        }}
      >
        Sobre o Projeto
      </h2>

      <p
        style={{
          color: "#d1d5db", // Cinza claro para leitura confortável no dark mode
          lineHeight: "1.7",
          fontSize: "15px",
          marginBottom: "28px",
          maxWidth: "1000px",
        }}
      >
        Este dashboard representa a camada de consumo de um pipeline completo de
        Engenharia de Dados. Os dados brutos são extraídos via API do The Movie
        Database (TMDB), processados e enriquecidos utilizando Python e Pandas,
        e armazenados no formato colunar Parquet para otimização de leitura. Uma
        API RESTful em FastAPI serve os dados processados para esta interface
        interativa construída em React com TypeScript, simulando um fluxo
        analítico de ponta a ponta comum em ambientes corporativos.
      </p>

      {/* Tags das Tecnologias - Estilizadas com a paleta amarela */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={tagStyle}>🐍 Python</span>
        <span style={tagStyle}>🐼 Pandas</span>
        <span style={tagStyle}>🗄️ Parquet</span>
        <span style={tagStyle}>⚡ FastAPI</span>
        <span style={tagStyle}>⚛️ React + TSX</span>
      </div>
    </div>
  );
}

// Estilo de Tag atualizado para o tema Dark/Yellow
const tagStyle: React.CSSProperties = {
  backgroundColor: "rgba(255, 216, 77, 0.1)", // Amarelo bem suave no fundo
  color: "#ffd84d", // Texto em amarelo
  padding: "8px 16px",
  borderRadius: "100px", // Formato de pílula
  fontSize: "13px",
  fontWeight: 600,
  border: "1px solid rgba(255, 216, 77, 0.2)",
  transition: "all 0.3s ease",
};

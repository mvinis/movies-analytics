// frontend/src/api.ts

// Aqui o TS entende que isso é uma string
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Definimos um "contrato" para os nossos endpoints
interface ApiEndpoints {
  movies: string;
  pipelineLogs: string;
  aiInsights: string;
  runPipeline: string;
}

export const endpoints: ApiEndpoints = {
  movies: `${API_BASE_URL}/api/movies`,
  pipelineLogs: `${API_BASE_URL}/api/pipeline/logs`,
  aiInsights: `${API_BASE_URL}/api/ai/insights`,
  runPipeline: `${API_BASE_URL}/api/pipeline/run`,
};

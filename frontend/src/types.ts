// src/types.ts
export interface Movie {
  release_date: string | number | Date;
  id: number;
  title: string;
  overview: string;
  genre_ids: number[];
  release_year: number;
  popularity: number;
  vote_average: number;
  poster_url: string;
  original_language?: string;
  vote_count?: number;
}

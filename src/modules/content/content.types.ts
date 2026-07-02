export type ContentCategory =
  | "Todos"
  | "Animes"
  | "Mangas"
  | "Filmes"
  | "Series"
  | "Livros"
  | "Jogos";

export type ContentItem = {
  id: string;
  title: string;
  image?: string;
  description?: string;
  meta: {
    first: string;
    second: string;
    third: string;
  };
};

export type LoadResult = {
  items: ContentItem[];
  lastPage: number;
  hasNextPage: boolean;
};

export type ContentQuery = {
  category: ContentCategory;
  page: number;
};

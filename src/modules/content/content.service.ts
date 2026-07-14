import { env } from "../../config/env";
// import { getCachedJson, setCachedJson } from "../../infra/cache/redisClient";
import { AppError } from "../../shared/errors/AppError";
import { contentRepository } from "./content.repository";
import {
  ContentCategory,
  ContentLanguage,
  ContentQuery,
  ContentSearchQuery,
  LoadResult,
} from "./content.types";

const implementedCategories = new Set<ContentCategory>([
  "Todos",
  "Animes",
  "Mangas",
  "Filmes",
  "Series",
  "Livros",
  "Jogos",
]);

function buildCacheKey(query: ContentQuery) {
  return `content:${query.category.toLowerCase()}:page:${query.page}:language:${
    query.language ?? "default"
  }`;
}

function extractBookIsbn(query: string): string | null {
  const trimmedQuery = query.trim();
  const numericQuery = trimmedQuery.replace(/[\s-]/g, "");

  if (/^\d{10}(\d{3})?$/.test(numericQuery)) {
    return numericQuery;
  }

  if (!/amazon\./i.test(trimmedQuery)) {
    return null;
  }

  const amazonProductMatch = trimmedQuery.match(
    /\/(?:dp|gp\/product)\/([0-9-]{10,17})(?:[/?#]|$)/i,
  );
  const amazonProductDigits = amazonProductMatch?.[1]?.replace(/\D/g, "");

  if (amazonProductDigits && /^\d{10}(\d{3})?$/.test(amazonProductDigits)) {
    return amazonProductDigits;
  }

  const isbnLikeMatch = trimmedQuery.match(/(?:^|\D)(\d{13}|\d{10})(?:\D|$)/);

  return isbnLikeMatch?.[1] ?? null;
}

async function loadCategory(
  category: ContentCategory,
  page: number,
  language?: ContentLanguage,
): Promise<LoadResult> {
  if (category === "Animes" || category === "Mangas") {
    if (!env.myAnimeListClientId) {
      throw new AppError("Configure MyAnimeList client id.", 503);
    }

    return contentRepository.loadMyAnimeListContent(category, page);
  }

  if (category === "Filmes" || category === "Series") {
    if (!env.tmdbBearerToken && !env.tmdbApiKey) {
      throw new AppError("Configure TMDB access token or API key.", 503);
    }

    return contentRepository.loadTmdbContent(category, page, language);
  }

  if (category === "Jogos") {
    if (!env.twitchClientId || !env.twitchClientSecret) {
      throw new AppError("Configure Twitch client id and secret.", 503);
    }

    return contentRepository.loadGames(page);
  }

  if (category === "Livros") {
    return contentRepository.loadBooks(page, language);
  }

  throw new AppError("Categoria ainda nao implementada.", 404);
}

async function searchCategory(
  category: ContentCategory,
  query: string,
  page: number,
  language?: ContentLanguage,
): Promise<LoadResult> {
  if (category === "Animes" || category === "Mangas") {
    if (!env.myAnimeListClientId) {
      throw new AppError("Configure MyAnimeList client id.", 503);
    }

    return contentRepository.searchMyAnimeListContent(category, query, page);
  }

  if (category === "Filmes" || category === "Series") {
    if (!env.tmdbBearerToken && !env.tmdbApiKey) {
      throw new AppError("Configure TMDB access token or API key.", 503);
    }

    return contentRepository.searchTmdbContent(category, query, page, language);
  }

  if (category === "Jogos") {
    if (!env.twitchClientId || !env.twitchClientSecret) {
      throw new AppError("Configure Twitch client id and secret.", 503);
    }

    return contentRepository.searchGames(query, page);
  }

  if (category === "Livros") {
    const isbn = extractBookIsbn(query);

    return isbn
      ? contentRepository.searchBooksByIsbn(isbn, page, language)
      : contentRepository.searchBooks(query, page, language);
  }

  throw new AppError("Categoria ainda nao implementada.", 404);
}

async function loadAll(language?: ContentLanguage): Promise<LoadResult> {
  const loaders: Array<Promise<LoadResult>> = [
    contentRepository.loadBooks(1, language),
  ];

  if (env.myAnimeListClientId) {
    loaders.push(contentRepository.loadMyAnimeListContent("Animes", 1));
    loaders.push(contentRepository.loadMyAnimeListContent("Mangas", 1));
  }

  if (env.tmdbBearerToken || env.tmdbApiKey) {
    loaders.push(contentRepository.loadTmdbContent("Filmes", 1, language));
    loaders.push(contentRepository.loadTmdbContent("Series", 1, language));
  }

  if (env.twitchClientId && env.twitchClientSecret) {
    loaders.push(contentRepository.loadGames(1));
  }

  const settledResults = await Promise.allSettled(loaders);
  const results = settledResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (results.length === 0) {
    throw new AppError("Nao foi possivel carregar os conteudos agora.", 502);
  }

  return {
    items: results.flatMap((result) => result.items.slice(0, 8)),
    lastPage: 1,
    hasNextPage: false,
  };
}

async function searchAll(
  query: string,
  language?: ContentLanguage,
): Promise<LoadResult> {
  const loaders: Array<Promise<LoadResult>> = [
    contentRepository.searchBooks(query, 1, language),
  ];

  if (env.myAnimeListClientId) {
    loaders.push(
      contentRepository.searchMyAnimeListContent("Animes", query, 1),
    );
    loaders.push(
      contentRepository.searchMyAnimeListContent("Mangas", query, 1),
    );
  }

  if (env.tmdbBearerToken || env.tmdbApiKey) {
    loaders.push(
      contentRepository.searchTmdbContent("Filmes", query, 1, language),
    );
    loaders.push(
      contentRepository.searchTmdbContent("Series", query, 1, language),
    );
  }

  if (env.twitchClientId && env.twitchClientSecret) {
    loaders.push(contentRepository.searchGames(query, 1));
  }

  const settledResults = await Promise.allSettled(loaders);
  const results = settledResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (results.length === 0) {
    throw new AppError("Nao foi possivel buscar os conteudos agora.", 502);
  }

  return {
    items: results.flatMap((result) => result.items.slice(0, 8)),
    lastPage: 1,
    hasNextPage: false,
  };
}

export const contentService = {
  async list(query: ContentQuery): Promise<LoadResult> {
    if (!implementedCategories.has(query.category)) {
      throw new AppError("Categoria ainda nao implementada.", 404);
    }

    const cacheKey = buildCacheKey(query);
    // const cached = await getCachedJson<LoadResult>(cacheKey);

    // if (cached) {
    //   return cached;
    // }

    const result =
      query.category === "Todos"
        ? await loadAll(query.language)
        : await loadCategory(query.category, query.page, query.language);

    // await setCachedJson(cacheKey, result, env.contentCacheTtlSeconds);
    return result;
  },

  async search(searchQuery: ContentSearchQuery): Promise<LoadResult> {
    if (!implementedCategories.has(searchQuery.category)) {
      throw new AppError("Categoria ainda nao implementada.", 404);
    }

    return searchQuery.category === "Todos"
      ? searchAll(searchQuery.query, searchQuery.language)
      : searchCategory(
          searchQuery.category,
          searchQuery.query,
          searchQuery.page,
          searchQuery.language,
        );
  },
};

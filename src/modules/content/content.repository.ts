import { env } from "../../config/env";
import { buildApiUrl } from "../../shared/http/buildApiUrl";
import { ContentLanguage, LoadResult } from "./content.types";

type MyAnimeListPicture = {
  medium?: string;
  large?: string;
};

type MyAnimeListNode = {
  id: number;
  title: string;
  alternative_titles?: {
    en?: string;
  };
  main_picture?: MyAnimeListPicture;
  mean?: number;
  media_type?: string;
  synopsis?: string;
  num_episodes?: number;
  num_chapters?: number;
  num_volumes?: number;
};

type MyAnimeListResponse = {
  data: Array<{
    node: MyAnimeListNode;
  }>;
  paging?: {
    next?: string;
    previous?: string;
  };
};

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
};

type TmdbResponse = {
  total_pages: number;
  results: TmdbItem[];
};

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type IgdbGameItem = {
  id: number;
  name: string;
  cover?: {
    image_id?: string;
  };
  genres?: Array<{ name?: string }>;
  platforms?: Array<{ name?: string }>;
  total_rating?: number;
  first_release_date?: number;
};

type BrasilApiIsbnResponse = {
  title?: string;
};

type OpenLibraryBookItem = {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
};

type OpenLibraryResponse = {
  numFound: number;
  docs: OpenLibraryBookItem[];
};

type GoogleBooksVolumeItem = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    categories?: string[];
  };
};

type GoogleBooksResponse = {
  totalItems: number;
  items?: GoogleBooksVolumeItem[];
};

type FetchJsonResult<T> = {
  response: Response;
  data: T;
};

let twitchTokenCache: { token: string; expiresAt: number } | null = null;

const myAnimeListFields = [
  "alternative_titles",
  "main_picture",
  "mean",
  "media_type",
  "synopsis",
  "num_episodes",
  "num_chapters",
  "num_volumes",
].join(",");

function getMyAnimeListImage(item: MyAnimeListNode) {
  return item.main_picture?.large ?? item.main_picture?.medium;
}

function yearFromDate(date?: string) {
  return date ? date.slice(0, 4) : "-";
}

function yearFromUnixTimestamp(timestamp?: number) {
  return timestamp ? new Date(timestamp * 1000).getFullYear().toString() : "-";
}

function escapeIgdbSearchQuery(query: string) {
  return query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function mapMyAnimeListResult(
  category: "Animes" | "Mangas",
  result: MyAnimeListResponse,
  page: number,
): LoadResult {
  const hasNextPage = Boolean(result.paging?.next);

  return {
    items: result.data.map(({ node }) => ({
      id: `${category}-${node.id}`,
      title: node.alternative_titles?.en || node.title,
      image: getMyAnimeListImage(node),
      description: node.synopsis,
      meta: {
        first: node.media_type ?? "-",
        second: node.mean ? String(node.mean) : "-",
        third:
          category === "Animes"
            ? node.num_episodes
              ? String(node.num_episodes)
              : "-"
            : (node.num_chapters ?? node.num_volumes)
              ? String(node.num_chapters ?? node.num_volumes)
              : "-",
      },
    })),
    lastPage: hasNextPage ? page + 1 : page,
    hasNextPage,
  };
}

function mapTmdbResult(
  category: "Filmes" | "Series",
  result: TmdbResponse,
  page: number,
): LoadResult {
  return {
    items: result.results.map((item) => ({
      id: `${category}-${item.id}`,
      title: item.title || item.name || "Sem titulo",
      image: item.poster_path
        ? `${env.tmdbImageBaseUrl.replace(/\/$/, "")}${item.poster_path}`
        : undefined,
      description: item.overview,
      meta: {
        first: category === "Filmes" ? "Filme" : "Serie",
        second: item.vote_average ? item.vote_average.toFixed(1) : "-",
        third: yearFromDate(item.release_date ?? item.first_air_date),
      },
    })),
    lastPage: result.total_pages,
    hasNextPage: page < result.total_pages,
  };
}

function mapGamesResult(
  data: IgdbGameItem[],
  page: number,
  limit: number,
  totalCount: number,
): LoadResult {
  const offset = (page - 1) * limit;

  return {
    items: data.map((item) => ({
      id: `Jogos-${item.id}`,
      title: item.name,
      image: item.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${item.cover.image_id}.jpg`
        : undefined,
      description:
        [
          item.genres
            ?.map((genre) => genre.name)
            .filter(Boolean)
            .join(", "),
          item.platforms
            ?.map((platform) => platform.name)
            .filter(Boolean)
            .join(", "),
        ]
          .filter(Boolean)
          .join(" | ") || "Sem generos informados.",
      meta: {
        first: "Jogo",
        second: item.total_rating ? item.total_rating.toFixed(1) : "-",
        third: yearFromUnixTimestamp(item.first_release_date),
      },
    })),
    lastPage: Math.max(1, Math.ceil(totalCount / limit)),
    hasNextPage: offset + data.length < totalCount,
  };
}

function mapBooksResult(
  result: OpenLibraryResponse,
  page: number,
  maxResults: number,
): LoadResult {
  return {
    items: result.docs.map((item) => ({
      id: `Livros-${item.key}`,
      title: item.title ?? "Sem titulo",
      image: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : undefined,
      description: item.subject?.slice(0, 6).join(", "),
      meta: {
        first: item.author_name?.[0] ?? "Livro",
        second: item.number_of_pages_median
          ? `${item.number_of_pages_median} p.`
          : "-",
        third: item.first_publish_year ? String(item.first_publish_year) : "-",
      },
    })),
    lastPage: Math.max(1, Math.ceil(result.numFound / maxResults)),
    hasNextPage: page * maxResults < result.numFound,
  };
}

function mapGoogleBooksResult(
  result: GoogleBooksResponse,
  page: number,
  maxResults: number,
): LoadResult {
  const totalItems = result.totalItems || 0;

  return {
    items: (result.items ?? []).map((item) => {
      const volumeInfo = item.volumeInfo;

      return {
        id: `Livros-${item.id}`,
        title: volumeInfo?.title ?? "Sem titulo",
        image:
          volumeInfo?.imageLinks?.thumbnail ??
          volumeInfo?.imageLinks?.smallThumbnail,
        description:
          volumeInfo?.description ??
          volumeInfo?.categories?.slice(0, 6).join(", "),
        meta: {
          first: volumeInfo?.authors?.[0] ?? "Livro",
          second: volumeInfo?.pageCount ? `${volumeInfo.pageCount} p.` : "-",
          third: volumeInfo?.publishedDate?.slice(0, 4) ?? "-",
        },
      };
    }),
    lastPage: Math.max(1, Math.ceil(totalItems / maxResults)),
    hasNextPage: page * maxResults < totalItems,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson<T>(
  url: URL,
  init?: RequestInit,
): Promise<FetchJsonResult<T>> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`External request failed with status ${response.status}`);
  }

  return {
    response,
    data: (await response.json()) as T,
  };
}

async function getJson<T>(url: URL, init?: RequestInit): Promise<T> {
  return (await fetchJson<T>(url, init)).data;
}

async function getJsonWithRetry<T>(
  url: URL,
  init?: RequestInit,
  maxAttempts = 5,
  retryDelayMs = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await getJson<T>(url, init);
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        await delay(retryDelayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("External request failed.");
}

async function getTwitchAccessToken() {
  const cachedToken = twitchTokenCache;

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  if (!env.twitchClientId || !env.twitchClientSecret) {
    throw new Error("Twitch credentials are missing.");
  }

  const url = new URL("https://id.twitch.tv/oauth2/token");
  url.searchParams.set("client_id", env.twitchClientId);
  url.searchParams.set("client_secret", env.twitchClientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const { data } = await fetchJson<TwitchTokenResponse>(url, {
    method: "POST",
  });

  if (!data.access_token) {
    throw new Error("Twitch access token was not returned.");
  }

  twitchTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(data.expires_in - 60, 60) * 1000,
  };

  return data.access_token;
}

async function getBookTitleByIsbn(isbn: string): Promise<string> {
  const url = buildApiUrl("https://brasilapi.com.br/api/isbn/v1", `/${isbn}`);

  const result = await getJson<BrasilApiIsbnResponse>(url);
  const title = result.title?.trim();

  if (!title) {
    throw new Error("BrasilAPI did not return a book title.");
  }

  return title;
}

async function searchGoogleBooks(
  query: string,
  page: number,
  language?: ContentLanguage,
): Promise<LoadResult> {
  const maxResults = 40;
  const startIndex = (page - 1) * maxResults;
  const url = new URL(env.googleBooksSearchUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("startIndex", String(startIndex));

  if (language) {
    url.searchParams.set("langRestrict", language === "pt-BR" ? "pt" : "en");
  }

  if (env.googleBooksApiKey) {
    url.searchParams.set("key", env.googleBooksApiKey);
  }

  const result = await getJsonWithRetry<GoogleBooksResponse>(url);

  return mapGoogleBooksResult(result, page, maxResults);
}

export const contentRepository = {
  async loadMyAnimeListContent(
    category: "Animes" | "Mangas",
    page: number,
  ): Promise<LoadResult> {
    if (!env.myAnimeListClientId) {
      throw new Error("MyAnimeList client id is missing.");
    }

    const limit = 50;
    const offset = (page - 1) * limit;
    const url = buildApiUrl(
      env.myAnimeListBaseUrl,
      category === "Animes" ? "/anime/ranking" : "/manga/ranking",
    );
    url.searchParams.set("ranking_type", "all");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", myAnimeListFields);

    const result = await getJson<MyAnimeListResponse>(url, {
      headers: {
        "X-MAL-CLIENT-ID": env.myAnimeListClientId,
      },
    });

    return mapMyAnimeListResult(category, result, page);
  },

  async searchMyAnimeListContent(
    category: "Animes" | "Mangas",
    query: string,
    page: number,
  ): Promise<LoadResult> {
    if (!env.myAnimeListClientId) {
      throw new Error("MyAnimeList client id is missing.");
    }

    const limit = 50;
    const offset = (page - 1) * limit;
    const url = buildApiUrl(
      env.myAnimeListBaseUrl,
      category === "Animes" ? "/anime" : "/manga",
    );
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("fields", myAnimeListFields);

    const result = await getJson<MyAnimeListResponse>(url, {
      headers: {
        "X-MAL-CLIENT-ID": env.myAnimeListClientId,
      },
    });

    return mapMyAnimeListResult(category, result, page);
  },

  async loadTmdbContent(
    category: "Filmes" | "Series",
    page: number,
    language: ContentLanguage = "en-US",
  ): Promise<LoadResult> {
    const url = buildApiUrl(
      env.tmdbBaseUrl,
      category === "Filmes" ? env.tmdbMovieEndpoint : env.tmdbTvEndpoint,
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("language", language);

    if (env.tmdbApiKey && !env.tmdbBearerToken) {
      url.searchParams.set("api_key", env.tmdbApiKey);
    }

    const result = await getJson<TmdbResponse>(url, {
      headers: env.tmdbBearerToken
        ? {
            Authorization: `Bearer ${env.tmdbBearerToken}`,
          }
        : undefined,
    });

    return mapTmdbResult(category, result, page);
  },

  async searchTmdbContent(
    category: "Filmes" | "Series",
    query: string,
    page: number,
    language: ContentLanguage = "en-US",
  ): Promise<LoadResult> {
    const url = buildApiUrl(
      env.tmdbBaseUrl,
      category === "Filmes" ? "/search/movie" : "/search/tv",
    );
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("language", language);

    if (env.tmdbApiKey && !env.tmdbBearerToken) {
      url.searchParams.set("api_key", env.tmdbApiKey);
    }

    const result = await getJson<TmdbResponse>(url, {
      headers: env.tmdbBearerToken
        ? {
            Authorization: `Bearer ${env.tmdbBearerToken}`,
          }
        : undefined,
    });

    return mapTmdbResult(category, result, page);
  },

  async loadGames(page: number): Promise<LoadResult> {
    if (!env.twitchClientId || !env.twitchClientSecret) {
      throw new Error("Twitch credentials are missing.");
    }

    const limit = 50;
    const offset = (page - 1) * limit;
    const body = `fields id,name,cover.image_id,genres.name,platforms.name,total_rating,first_release_date;\nsort total_rating desc;\nlimit ${limit};\noffset ${offset};`;
    const token = await getTwitchAccessToken();
    const url = buildApiUrl("https://api.igdb.com/v4", "/games");

    const { response, data } = await fetchJson<IgdbGameItem[]>(url, {
      method: "POST",
      headers: {
        "Client-ID": env.twitchClientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body,
    });

    const totalCountHeader = response.headers.get("x-total-count");
    const totalCount = Number(totalCountHeader);
    const normalizedTotalCount =
      Number.isFinite(totalCount) && totalCount > 0 ? totalCount : data.length;

    return mapGamesResult(data, page, limit, normalizedTotalCount);
  },

  async searchGames(query: string, page: number): Promise<LoadResult> {
    if (!env.twitchClientId || !env.twitchClientSecret) {
      throw new Error("Twitch credentials are missing.");
    }

    const limit = 50;
    const offset = (page - 1) * limit;
    const body = `search "${escapeIgdbSearchQuery(query)}";\nfields id,name,cover.image_id,genres.name,platforms.name,total_rating,first_release_date;\nlimit ${limit};\noffset ${offset};`;
    const token = await getTwitchAccessToken();
    const url = buildApiUrl("https://api.igdb.com/v4", "/games");

    const { response, data } = await fetchJson<IgdbGameItem[]>(url, {
      method: "POST",
      headers: {
        "Client-ID": env.twitchClientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body,
    });

    const totalCountHeader = response.headers.get("x-total-count");
    const totalCount = Number(totalCountHeader);
    const normalizedTotalCount =
      Number.isFinite(totalCount) && totalCount > 0 ? totalCount : data.length;

    return mapGamesResult(data, page, limit, normalizedTotalCount);
  },

  async loadBooks(
    page: number,
    language?: ContentLanguage,
  ): Promise<LoadResult> {
    const maxResults = 50;
    const url = new URL(env.openLibrarySearchUrl);
    url.searchParams.set("q", "subject:fiction");
    url.searchParams.set("limit", String(maxResults));
    url.searchParams.set("page", String(page));

    if (language) {
      url.searchParams.set("language", language === "pt-BR" ? "por" : "eng");
    }

    const result = await getJson<OpenLibraryResponse>(url);

    return mapBooksResult(result, page, maxResults);
  },

  async searchBooks(
    query: string,
    page: number,
    language?: ContentLanguage,
  ): Promise<LoadResult> {
    return searchGoogleBooks(query, page, language);
  },

  async searchBooksByIsbn(
    isbn: string,
    page: number,
    language?: ContentLanguage,
  ): Promise<LoadResult> {
    const title = await getBookTitleByIsbn(isbn);

    return searchGoogleBooks(title, page, language);
  },
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3000,
  redisUrl: process.env.REDIS_URL,
  contentCacheTtlSeconds: Number(process.env.CONTENT_CACHE_TTL_SECONDS) || 900,
  mongoDbDirect: process.env.MONGO_DB_DIRECT,
  mongoDbName: process.env.MONGO_DB_NAME ?? "contentListData",
  jikanBaseUrl: process.env.VITE_JIKAN_BASE_URL ?? "https://api.jikan.moe/v4",
  jikanAnimeEndpoint: process.env.VITE_JIKAN_ANIME_ENDPOINT ?? "/anime",
  jikanMangaEndpoint: process.env.VITE_JIKAN_MANGA_ENDPOINT ?? "/manga",
  tmdbBearerToken: process.env.VITE_TMDB_ACCESS_TOKEN,
  tmdbApiKey: process.env.VITE_TMDB_API_KEY,
  tmdbBaseUrl: process.env.VITE_TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
  tmdbImageBaseUrl:
    process.env.VITE_TMDB_IMAGE_BASE_URL ?? "https://image.tmdb.org/t/p/w500",
  tmdbMovieEndpoint:
    process.env.VITE_TMDB_TRENDING_MOVIE_ENDPOINT ?? "/trending/movie/week",
  tmdbTvEndpoint:
    process.env.VITE_TMDB_TRENDING_TV_ENDPOINT ?? "/trending/tv/week",
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
  openLibrarySearchUrl:
    process.env.VITE_OPEN_LIBRARY_SEARCH_URL ??
    "https://openlibrary.org/search.json",
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
};

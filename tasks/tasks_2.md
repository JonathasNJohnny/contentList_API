# Documentação de Rotas e Métodos de Busca (Repository)

Este documento centraliza as rotas, parâmetros e a lógica de implementação para estender o `contentRepository` com suporte a pesquisas em tempo real nas APIs Jikan, TMDB, IGDB e Open Library.

## 🛠️ Modificações no `contentRepository`

Para manter o código limpo, reaproveitamos os mesmos types e mapeamentos, adicionando o parâmetro `query` para filtrar os resultados.

### 1. Jikan API (Animes & Mangás)

A Jikan utiliza o mesmo endpoint de listagem para buscas. Basta injetar o parâmetro `q` na URL.

```typescript
async searchJikanContent(
  category: "Animes" | "Mangas",
  query: string,
  page: number,
): Promise<LoadResult> {
  const endpoint = category === "Animes" ? env.jikanAnimeEndpoint : env.jikanMangaEndpoint;
  const url = buildApiUrl(env.jikanBaseUrl, endpoint);

  url.searchParams.set("q", query);
  url.searchParams.set("page", String(page));

  const result = await getJson<JikanResponse>(url);

  // O mapeamento interno (return) permanece IDÊNTICO ao método loadJikanContent
}

```

### 2. TMDB (Filmes & Séries)

O TMDB exige a mudança do endpoint de `/discover` ou `/popular` para os endpoints dedicados de `/search`.

```typescript
async searchTmdbContent(
  category: "Filmes" | "Series",
  query: string,
  page: number,
): Promise<LoadResult> {
  // Altera a rota para o segmento de search da API
  const endpoint = category === "Filmes" ? "/search/movie" : "/search/tv";
  const url = buildApiUrl(env.tmdbBaseUrl, endpoint);

  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("language", "pt-BR"); // Opcional: Garante resultados em português

  if (env.tmdbApiKey && !env.tmdbBearerToken) {
    url.searchParams.set("api_key", env.tmdbApiKey);
  }

  const result = await getJson<TmdbResponse>(url, {
    headers: env.tmdbBearerToken ? { Authorization: `Bearer ${env.tmdbBearerToken}` } : undefined,
  });

  // O mapeamento interno (return) permanece IDÊNTICO ao método loadTmdbContent
}

```

### 3. IGDB (Jogos)

No IGDB, a busca é feita via texto puro no `body` utilizando a cláusula `search`.

> ⚠️ **Regra da API:** Ao usar `search`, a cláusula `sort` **deve ser removida**, pois a API ordena automaticamente por relevância.

```typescript
async searchGames(query: string, page: number): Promise<LoadResult> {
  if (!env.twitchClientId || !env.twitchClientSecret) {
    throw new Error("Twitch credentials are missing.");
  }

  const limit = 50;
  const offset = (page - 1) * limit;

  // Substituído 'sort' por 'search'
  const body = `search "${query}";\nfields id,name,cover.image_id,genres.name,platforms.name,total_rating,first_release_date;\nlimit ${limit};\noffset ${offset};`;

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

  // O mapeamento interno (return) permanece IDÊNTICO ao método loadGames
}

```

### 4. Open Library (Livros)

O método original já usava o endpoint de busca. Apenas alteramos o parâmetro estático `subject:fiction` pelo termo digitado pelo usuário.

```typescript
async searchBooks(query: string, page: number): Promise<LoadResult> {
  const maxResults = 50;
  const url = new URL(env.openLibrarySearchUrl);

  url.searchParams.set("q", query); // Passa a string de busca de forma dinâmica
  url.searchParams.set("limit", String(maxResults));
  url.searchParams.set("page", String(page));

  const result = await getJson<OpenLibraryResponse>(url);

  // O mapeamento interno (return) permanece IDÊNTICO ao método loadBooks
}

```

---

## 📌 Resumo dos Endpoints Utilizados

| Provedor        | Tipo de Conteúdo | URL Base / Endpoint de Busca                | Parâmetro de Texto       |
| --------------- | ---------------- | ------------------------------------------- | ------------------------ |
| **Jikan**       | Animes           | `https://api.jikan.moe/v4/anime`            | `q`                      |
| **Jikan**       | Mangás           | `https://api.jikan.moe/v4/manga`            | `q`                      |
| **TMDB**        | Filmes           | `https://api.themoviedb.org/3/search/movie` | `query`                  |
| **TMDB**        | Séries           | `https://api.themoviedb.org/3/search/tv`    | `query`                  |
| **IGDB**        | Jogos            | `https://api.igdb.com/v4/games`             | `search "..."` (No Body) |
| **OpenLibrary** | Livros           | `https://openlibrary.org/search.json`       | `q`                      |

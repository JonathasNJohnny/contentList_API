import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { contentService } from "./content.service";
import { ContentCategory, ContentLanguage } from "./content.types";

const categoryMap: Record<string, ContentCategory> = {
  todos: "Todos",
  animes: "Animes",
  mangas: "Mangas",
  filmes: "Filmes",
  series: "Series",
  séries: "Series",
  livros: "Livros",
  jogos: "Jogos",
};

const languageMap: Record<string, ContentLanguage> = {
  english: "en-US",
  en: "en-US",
  "en-us": "en-US",
  portuguese: "pt-BR",
  portugues: "pt-BR",
  pt: "pt-BR",
  "pt-br": "pt-BR",
};

function normalizeCategory(value: unknown): ContentCategory {
  const rawCategory = String(value ?? "todos")
    .trim()
    .toLowerCase();
  const category = categoryMap[rawCategory];

  if (!category) {
    throw new AppError("Categoria invalida.", 400);
  }

  return category;
}

function normalizePage(value: unknown) {
  const page = Number(value ?? 1);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Pagina invalida.", 400);
  }

  return page;
}

function normalizeSearchQuery(value: unknown) {
  const query = String(value ?? "").trim();

  if (!query) {
    throw new AppError("Parametro query e obrigatorio.", 400);
  }

  return query;
}

function normalizeLanguage(value: unknown): ContentLanguage | undefined {
  const rawLanguage = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!rawLanguage) {
    return "en-US";
  }

  const normalizedLanguage = rawLanguage
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const language = languageMap[normalizedLanguage];

  if (!language) {
    throw new AppError("Idioma invalido.", 400);
  }

  return language;
}

export const contentController = {
  async index(request: Request, response: Response) {
    const result = await contentService.list({
      category: normalizeCategory(request.query.category),
      page: normalizePage(request.query.page),
      language: normalizeLanguage(request.query.language),
    });

    response.json(result);
  },

  async search(request: Request, response: Response) {
    const result = await contentService.search({
      category: normalizeCategory(request.query.category),
      query: normalizeSearchQuery(request.query.query),
      page: normalizePage(request.query.page),
      language: normalizeLanguage(request.query.language),
    });

    response.json(result);
  },

  async showByCategory(request: Request, response: Response) {
    const result = await contentService.list({
      category: normalizeCategory(request.params.category),
      page: normalizePage(request.params.page ?? request.query.page),
      language: normalizeLanguage(request.query.language),
    });

    response.json(result);
  },

  async searchByCategory(request: Request, response: Response) {
    const result = await contentService.search({
      category: normalizeCategory(request.params.category),
      query: normalizeSearchQuery(request.query.query),
      page: normalizePage(request.params.page ?? request.query.page),
      language: normalizeLanguage(request.query.language),
    });

    response.json(result);
  },
};

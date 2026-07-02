import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { contentService } from "./content.service";
import { ContentCategory } from "./content.types";

const categoryMap: Record<string, ContentCategory> = {
  todos: "Todos",
  animes: "Animes",
  mangas: "Mangas",
  filmes: "Filmes",
  series: "Series",
  "séries": "Series",
  livros: "Livros",
  jogos: "Jogos"
};

function normalizeCategory(value: unknown): ContentCategory {
  const rawCategory = String(value ?? "todos").trim().toLowerCase();
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

export const contentController = {
  async index(request: Request, response: Response) {
    const result = await contentService.list({
      category: normalizeCategory(request.query.category),
      page: normalizePage(request.query.page)
    });

    response.json(result);
  },

  async showByCategory(request: Request, response: Response) {
    const result = await contentService.list({
      category: normalizeCategory(request.params.category),
      page: normalizePage(request.params.page ?? request.query.page)
    });

    response.json(result);
  }
};

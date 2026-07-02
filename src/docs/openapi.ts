import { OpenAPIV3 } from "openapi-types";

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "ContentList API",
    version: "1.0.0",
    description: "API para listar conteudos de animes, mangas, filmes, series, livros e jogos."
  },
  servers: [
    {
      url: "http://localhost:3003",
      description: "Local"
    }
  ],
  tags: [
    {
      name: "Content",
      description: "Listagem paginada de conteudos"
    },
    {
      name: "Health",
      description: "Status da API e dependencias"
    }
  ],
  paths: {
    "/": {
      get: {
        summary: "Mensagem raiz da API",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API em execucao",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "ContentList API is running"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      get: {
        summary: "Consulta status da API",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Status da API e dependencias",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/api/content": {
      get: {
        summary: "Lista conteudos por categoria",
        tags: ["Content"],
        parameters: [
          {
            name: "category",
            in: "query",
            required: false,
            schema: {
              $ref: "#/components/schemas/ContentCategory"
            },
            description: "Categoria desejada. O padrao e todos.",
            example: "animes"
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 1
            },
            description: "Pagina da categoria."
          }
        ],
        responses: {
          "200": {
            description: "Conteudos encontrados",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoadResult"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "404": {
            $ref: "#/components/responses/NotFound"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    },
    "/api/content/{category}": {
      get: {
        summary: "Lista conteudos por categoria via path",
        tags: ["Content"],
        parameters: [
          {
            name: "category",
            in: "path",
            required: true,
            schema: {
              $ref: "#/components/schemas/ContentCategory"
            },
            example: "animes"
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 1
            }
          }
        ],
        responses: {
          "200": {
            description: "Conteudos encontrados",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoadResult"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "404": {
            $ref: "#/components/responses/NotFound"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    },
    "/api/content/{category}/{page}": {
      get: {
        summary: "Lista conteudos por categoria e pagina via path",
        tags: ["Content"],
        parameters: [
          {
            name: "category",
            in: "path",
            required: true,
            schema: {
              $ref: "#/components/schemas/ContentCategory"
            },
            example: "animes"
          },
          {
            name: "page",
            in: "path",
            required: true,
            schema: {
              type: "integer",
              minimum: 1
            },
            example: 2
          }
        ],
        responses: {
          "200": {
            description: "Conteudos encontrados",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoadResult"
                }
              }
            }
          },
          "400": {
            $ref: "#/components/responses/BadRequest"
          },
          "404": {
            $ref: "#/components/responses/NotFound"
          },
          "500": {
            $ref: "#/components/responses/InternalServerError"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ContentCategory: {
        type: "string",
        enum: ["todos", "animes", "mangas", "filmes", "series", "livros", "jogos"]
      },
      ContentItem: {
        type: "object",
        required: ["id", "title", "meta"],
        properties: {
          id: {
            type: "string",
            example: "Animes-1"
          },
          title: {
            type: "string",
            example: "Cowboy Bebop"
          },
          image: {
            type: "string",
            nullable: true,
            example: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg"
          },
          description: {
            type: "string",
            nullable: true
          },
          meta: {
            $ref: "#/components/schemas/ContentMeta"
          }
        }
      },
      ContentMeta: {
        type: "object",
        required: ["first", "second", "third"],
        properties: {
          first: {
            type: "string",
            description: "Tipo, autor ou genero principal"
          },
          second: {
            type: "string",
            description: "Nota, paginas ou outro dado secundario"
          },
          third: {
            type: "string",
            description: "Ano, episodios, capitulos ou outro dado complementar"
          }
        }
      },
      LoadResult: {
        type: "object",
        required: ["items", "lastPage", "hasNextPage"],
        properties: {
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ContentItem"
            }
          },
          lastPage: {
            type: "integer",
            example: 1109
          },
          hasNextPage: {
            type: "boolean",
            example: true
          }
        }
      },
      HealthResponse: {
        type: "object",
        required: ["status", "redis", "mongo"],
        properties: {
          status: {
            type: "string",
            example: "ok"
          },
          redis: {
            type: "string",
            enum: ["connected", "disabled_or_unavailable"]
          },
          mongo: {
            type: "string",
            enum: ["connected", "unavailable", "not_configured"]
          }
        }
      },
      ErrorResponse: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string"
          }
        }
      }
    },
    responses: {
      BadRequest: {
        description: "Requisicao invalida",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      NotFound: {
        description: "Recurso nao encontrado",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse"
            }
          }
        }
      },
      InternalServerError: {
        description: "Erro interno",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse"
            }
          }
        }
      }
    }
  }
};

import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./openapi";

const swaggerRoutes = Router();

swaggerRoutes.get("/docs.json", (_request, response) => {
  response.json(openApiDocument);
});

swaggerRoutes.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

export { swaggerRoutes };

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import "express-async-errors";

import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { routes } from "./routes/index";

export const app = express();

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart Bicycle Sharing API",
      version: "1.0.0",
    },
    servers: [{ url: config.app.corsOrigin }],
  },
  apis: ["src/routes/*.ts"],
});

app.use(helmet());
app.use(
  cors({
    origin: config.app.corsOrigin,
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(routes);

app.use(errorHandler);


import "express-async-errors";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/v1", routes);

  app.use(notFoundHandler);
  // ملاحظة: express يتعرف على middleware الأخطاء عبر توقيعها بأربع وسائط
  app.use(errorHandler as unknown as express.ErrorRequestHandler);

  return app;
}

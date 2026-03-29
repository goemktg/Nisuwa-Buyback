import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findFrontendDistDir(): string | null {
  const candidates = [
    // When API server is started from repository root.
    path.resolve(process.cwd(), "artifacts", "buyback", "dist", "public"),
    // When API server is started from artifacts/api-server.
    path.resolve(process.cwd(), "..", "buyback", "dist", "public"),
    // When running directly from source layout.
    path.resolve(__dirname, "..", "..", "buyback", "dist", "public"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendDistDir = findFrontendDistDir();

if (frontendDistDir) {
  app.use(express.static(frontendDistDir));

  app.get("/{*path}", (req, res, next) => {
    // Keep unknown API paths as API 404 responses.
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(frontendDistDir, "index.html"));
  });

  logger.info({ frontendDistDir }, "Serving frontend static build");
}

export default app;

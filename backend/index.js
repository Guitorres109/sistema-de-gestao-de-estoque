import "dotenv/config";

import express from "express";
import path from "path";
import helmet from "helmet";

import pinoHttp from "pino-http";
import logger from "./src/utils/logger.js";
import routes from "./src/routes/routes.js";
import authRoute from "./src/routes/authRoutes.js";
import database from "./src/database/sqlite.js";

const { ready } = database;
console.clear();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(express.json());

// ======================================================
// PINO HTTP
// ======================================================

app.use(
  pinoHttp({
    logger,

    autoLogging: false,

    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
  }),
);

// ======================================================
// FILTRO DE USER-AGENT
// ======================================================

app.use((req, res, next) => {
  const ua = req.get("User-Agent") || "";

  if (ua.includes("curl") || ua.includes("python-requests")) {
    req.log.warn(
      {
        userAgent: ua,
        ip: req.ip,
      },
      "Acesso bloqueado por firewall",
    );

    return res.status(403).json({
      error: "Acesso bloqueado por firewall",
    });
  }

  next();
});

// ======================================================
// BANCO DE DADOS
// ======================================================

ready
  .then(() => {
    logger.info("Banco de dados inicializado");

    // ==================================================
    // ROTAS
    // ==================================================

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "src/pages/api.html"));
    });

    app.get("/api/verificar", (req, res) => {
      req.log.info("Verificação de servidor realizada");

      res.json({
        status: "success",
        message: "Servidor está online e respondendo!",
      });
    });

    app.use("/api", routes);
    app.use("/api/auth", authRoute);

    // ==================================================
    // INICIAR SERVIDOR
    // ==================================================

    app.listen(PORT, () => {
      logger.info(`Servidor iniciado na porta ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Erro ao inicializar banco de dados");

    console.error(err);

    process.exit(1);
  });

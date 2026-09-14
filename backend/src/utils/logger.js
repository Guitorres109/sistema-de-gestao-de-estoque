import pino from "pino";

import { salvarLog } from "../services/logService.js";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    transport: process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname"
            }
        }
        : undefined
});

function salvar(nivel, args) {
    try {
        let mensagem = "";
        let dados = null;

        if (typeof args[0] === "string") {
            mensagem = args[0];
            dados = args[1] ?? null;
        } else {
            dados = args[0] ?? null;
            mensagem = args[1] ?? "";
        }

        salvarLog(nivel, mensagem, dados);
    } catch (err) {
        console.error("Erro ao salvar log:", err);
    }
}

export function logInfo(mensagem, dados = null) {
    logger.info(dados || {}, mensagem);
    salvar("info", [mensagem, dados]);
}

export function logWarn(mensagem, dados = null) {
    logger.warn(dados || {}, mensagem);
    salvar("warn", [mensagem, dados]);
}

export function logError(mensagem, dados = null) {
    logger.error(dados || {}, mensagem);
    salvar("error", [mensagem, dados]);
}

export function logDebug(mensagem, dados = null) {
    logger.debug(dados || {}, mensagem);
    salvar("debug", [mensagem, dados]);
}

export default logger;
import { get, ready, run } from "../database/sqlite.js";

const MAX_LOGS = 100;

export async function salvarLog(nivel, mensagem, dados = null) {
    try {
        await ready;

        await run(`
            INSERT INTO logs (
                nivel,
                mensagem,
                dados
            )
            VALUES (?, ?, ?)
        `, [
            nivel,
            mensagem,
            dados ? JSON.stringify(dados) : null
        ]);

        await run(`
            DELETE FROM logs
            WHERE id NOT IN (
                SELECT id
                FROM logs
                ORDER BY id DESC
                LIMIT ?
            )
        `, [MAX_LOGS]);

    } catch (err) {
        console.error("Erro ao salvar log:", err);
    }
}

export async function obterLogs() {
    await ready;

    const resultado = await get(`
        SELECT json_group_array(
            json_object(
                'id', id,
                'nivel', nivel,
                'mensagem', mensagem,
                'dados', dados,
                'criado_em', criado_em
            )
        ) AS logs
        FROM (
            SELECT
                id,
                nivel,
                mensagem,
                dados,
                criado_em
            FROM logs
            ORDER BY id DESC
        )
    `);

    return resultado?.logs
        ? JSON.parse(resultado.logs)
        : [];
}
const { ready, query, run, get } = require('../database/sqlite');
const Usuario = require('./usuario');
const Produto = require('./produto')

//Formatar todos os clientes do banco
async function formatar(row) {
  if (!row) return null;

  const ids = JSON.parse(row.itens_saida || "[]");

  const produtos = [];

  for (const id of ids) {
    const produto = await Produto.findById(id);

    if (produto) {
      produtos.push(produto);
    }
  }

  return {
    _id: row.id,
    id: row.id,
    numero_saida: row.numero_saida,
    itens_saida: produtos,
    usuario: await Usuario.findById(row.usuario_id),
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const Saida = {

  async findAll(busca = "") {
    await ready;

    const rows = query(
        "SELECT * FROM saidas ORDER BY created_at"
    );

    return Promise.all(rows.map(formatar));
    },


  //Procurar cliente por ID
  async findById(id) {
    await ready;
    return formatar(get('SELECT * FROM saidas WHERE id = ?', [id]));
  },

  //Criar novo cliente
  async create({ itens_saida, usuario_id, observacoes = "" }) {
    await ready;

    const ultimaSaida = get(`
        SELECT numero_saida
        FROM saidas
        ORDER BY numero_saida DESC
        LIMIT 1
    `);

    // Se não existir nenhuma saída, começa em 1
    const numero_saida = ultimaSaida
        ? Number(ultimaSaida.numero_saida) + 1
        : 1;

    const itensSaidaJson = JSON.stringify(itens_saida);

    const info = run(
        `INSERT INTO saidas (
        numero_saida,
        itens_saida,
        usuario_id,
        observacoes
        ) VALUES (?, ?, ?, ?)`,
        [
        numero_saida,
        itensSaidaJson,
        usuario_id,
        observacoes,
        ],
    );

    return this.findById(info.lastInsertRowid);
    },

  //Atualizar cadastro de cliente
  async update(id, { itens_saida, observacoes = '' }) {
    await ready;
    const atual = get('SELECT * FROM saida WHERE id = ?', [id]);
    if (!atual) return null;

    run(`
      UPDATE produtos SET
        itens_saida  = ?,
        observacoes = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `, [
      itens_saida        ?? atual.itens_saida,
      observacoes    ?? atual.observacoes,
      id
    ]);

    return this.findById(id);
  },

  //Deletar cliente
  async delete(id) {
    await ready;
    const info = run('DELETE FROM saidas WHERE id = ?', [id]);
    return info.changes > 0;
  },
};

module.exports = Saida;
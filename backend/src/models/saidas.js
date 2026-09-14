const { ready, query, run, get } = require('../database/sqlite');
const Usuario = require('./usuario');

//Formatar todos os clientes do banco
function formatar(row) {
  if (!row) return null;
  return {
    _id:        row.id,
    id:         row.id,
    numero_saida:       row.numero_saida,
    usuario:   Usuario.findById(row.Usuario_id),
    observacoes:      row.observacoes,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

//Objeto de cliente
const Saida = {

  async findAll(busca = '') {
    await ready;
    const rows = query('SELECT * FROM saidas WHERE disponivel = 1 ORDER BY created_at');
    return rows.map(formatar);
  },

  //Procurar cliente por ID
  async findById(id) {
    await ready;
    return formatar(get('SELECT * FROM saidas WHERE id = ?', [id]));
  },

  //Criar novo cliente
  async create({ itens_saida, usuario_id, observacoes = '' }) {
    await ready;
    const numero_saida = null
    const info = run(
      'INSERT INTO saida (numero_saida, itens_saida, usuario_id, observacoes) VALUES (?, ?, ?, ?)',
      [numero_saida, itens_saida, usuario_id, observacoes]
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
    const info = run('DELETE FROM saida WHERE id = ?', [id]);
    return info.changes > 0;
  },
};

module.exports = Saida;
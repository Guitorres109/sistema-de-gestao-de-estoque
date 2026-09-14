const { ready, query, run, get } = require('../database/sqlite');

//Formatar todos os clientes do banco
function formatar(row) {
  if (!row) return null;
  return {
    _id:        row.id,
    id:         row.id,
    nome:       row.nome,
    descricao:   row.descricao,
    estoque:      row.estoque,
    estoque_min:      row.estoque_min,
    disponivel:      row.disponivel,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

//Objeto de cliente
const Produto = {

  async findAll(busca = '') {
    await ready;
    let rows;
    if (busca) {
      const t = `%${busca}%`;
      rows = query(
        'SELECT * FROM produtos WHERE disponivel = 1 AND (nome LIKE ?) ORDER BY nome',
        [t]
      );
    } else {
      rows = query('SELECT * FROM produtos WHERE disponivel = 1 ORDER BY nome');
    }
    return rows.map(formatar);
  },

  //Procurar cliente por ID
  async findById(id) {
    await ready;
    return formatar(get('SELECT * FROM produtos WHERE id = ?', [id]));
  },

  //Criar novo cliente
  async create({ nome, descricao, estoque, estoque_min }) {
    await ready;
    const info = run(
      'INSERT INTO produtos (nome, descricao, estoque, estoque_min) VALUES (?, ?, ?, ?)',
      [nome.trim(), descricao.trim(), estoque, estoque_min]
    );
    return this.findById(info.lastInsertRowid);
  },

  //Atualizar cadastro de cliente
  async update(id, { nome, descricao, estoque, estoque_min, disponivel }) {
    await ready;
    const atual = get('SELECT * FROM produtos WHERE id = ?', [id]);
    if (!atual) return null;

    run(`
      UPDATE produtos SET
        nome        = ?,
        descricao    = ?,
        estoque    = ?,
        estoque_min = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `, [
      nome        ?? atual.nome,
      descricao    ?? atual.descricao,
      estoque      ?? atual.estoque,
      estoque_min ?? atual.estoque_min,
      id
    ]);

    return this.findById(id);
  },

  //Deletar cliente
  async delete(id) {
    await ready;
    const info = run('DELETE FROM produtos WHERE id = ?', [id]);
    return info.changes > 0;
  },
};

module.exports = Produto;
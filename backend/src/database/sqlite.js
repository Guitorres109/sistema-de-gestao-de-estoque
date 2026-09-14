const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

//COnectar ao Banco
const DB_PATH = process.env.DB_PATH
  || path.join(__dirname, '..', '..', 'almoxarifado.db');

const state = { db: null };

const ready = (async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    state.db = new SQL.Database(fileBuffer);
  } else {
    state.db = new SQL.Database();
  }

  const db = state.db;

  //verificar Banco completo
  db.run('PRAGMA foreign_keys = ON');

  // criar tabela e não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      senha       TEXT    NOT NULL,
      perfil      TEXT    NOT NULL DEFAULT 'Atendente',
      ativo       INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // criar tabela e não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      descricao    TEXT    NOT NULL DEFAULT '',
      estoque      INTEGER NOT NULL,
      estoque_min  INTEGER NOT NULL DEFAULT 1,
      disponivel   INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // criar tabela e não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS saidas (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_saida    INTEGER,
      usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
      observacoes     TEXT    NOT NULL DEFAULT '',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // criar tabela e não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nivel TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        dados TEXT,
        criado_em DATETIME DEFAULT (datetime('now', '-3 hours'))
    )
  `);

  salvar();

  console.log('SQLite (sql.js) conectado:', DB_PATH);
  return db;
})();

//função de salvar dados no DB
function salvar() {
  if (!state.db) return;
  const data = state.db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

//Enviar dados para query
function query(sql, params = []) {
  const stmt    = state.db.prepare(sql);
  const results = [];
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

//Rodar select no DB
function run(sql, params = []) {
  state.db.run(sql, params);
  const meta = query('SELECT last_insert_rowid() as id, changes() as changes');
  salvar();
  return {
    lastInsertRowid: meta[0]?.id,
    changes:         meta[0]?.changes,
  };
}

//Obter dados do banco
function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

//Exportar modulos
module.exports = { ready, query, run, get, salvar };
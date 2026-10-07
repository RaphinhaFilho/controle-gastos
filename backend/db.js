const Database = require('better-sqlite3');
const path = require('path');

// Cria (ou abre) o arquivo banco.db na pasta do backend
const db = new Database(path.join(__dirname, 'banco.db'));

// Ativa foreign keys (para o usuario_id funcionar como chave estrangeira)
db.pragma('foreign_keys = ON');

// Cria a tabela de usuários se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Cria a tabela de transações se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS transacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('receita', 'despesa')),
    categoria TEXT NOT NULL,
    data TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
`);

console.log('✅ Banco de dados pronto!');

module.exports = db;

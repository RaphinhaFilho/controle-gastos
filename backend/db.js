require('dotenv').config(); // <-- ESSA LINHA PRECISA SER A PRIMEIRA!
const { Pool } = require('pg');

// Se estiver no Render (produção), exige SSL. Se estiver local, desativa.
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Cria as tabelas se não existirem
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        tipo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        data TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Banco PostgreSQL conectado e tabelas criadas!');
  } catch (error) {
    console.error('❌ Erro ao inicializar o banco PostgreSQL:', error.message);
    throw error;
  }
};

module.exports = { pool, initDb };

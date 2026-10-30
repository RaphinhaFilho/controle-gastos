require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

// Importa as rotas
const rotasUsuarios = require('./routes/usuarios');
const rotasTransacoes = require('./routes/transacoes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARES GLOBAIS ============

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

// ============ ROTA RAIZ (TESTE) ============

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API do Controle de Gastos rodando 🚀'
  });
});

// ============ ROTAS ============

app.use('/api', rotasUsuarios);
app.use('/api/transacoes', rotasTransacoes);

// ============ TRATAMENTO DE ERRO GENÉRICO ============

app.use((err, req, res, next) => {
  console.error('Erro:', err);

  res.status(500).json({
    erro: 'Erro interno no servidor'
  });
});

// ============ SOBE O SERVIDOR ============

const iniciarServidor = async () => {
  try {
    await initDb();
    await pool.query('SELECT 1');

    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Erro ao inicializar o banco PostgreSQL:', err);
    await pool.end();
    process.exitCode = 1;
  }
};

iniciarServidor();

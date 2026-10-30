const express = require('express');
const pool = require('../db');
const { autenticar } = require('../auth');

const router = express.Router();

// Todas as rotas daqui exigem login
router.use(autenticar);

// GET / (listar)
router.get('/', async (req, res, next) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM transacoes WHERE usuario_id = $1 ORDER BY data DESC, id DESC',
      [req.usuario.id]
    );
    return res.json(resultado.rows);
  } catch (err) {
    return next(err);
  }
});

// POST / (criar)
router.post('/', async (req, res) => {
  try {
    const {
      descricao,
      valor,
      tipo,
      categoria,
      data
    } = req.body || {};

    if (!descricao || valor === undefined || valor === null || !tipo || !categoria || !data) {
      return res.status(400).json({
        erro: 'Todos os campos são obrigatórios'
      });
    }

    if (typeof descricao !== 'string' || typeof categoria !== 'string' || typeof data !== 'string') {
      return res.status(400).json({
        erro: 'Todos os campos são obrigatórios'
      });
    }

    if (tipo !== 'receita' && tipo !== 'despesa') {
      return res.status(400).json({
        erro: 'Tipo deve ser "receita" ou "despesa"'
      });
    }

    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
      return res.status(400).json({
        erro: 'Valor deve ser maior que zero'
      });
    }

    const resultado = await pool.query(
      `INSERT INTO transacoes
        (usuario_id, descricao, valor, tipo, categoria, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.usuario.id,
        descricao,
        valor,
        tipo,
        categoria,
        data
      ]
    );
    const nova = resultado.rows[0];

    return res.status(201).json(nova);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      erro: 'Erro ao criar transação'
    });
  }
});

// DELETE /:id (deletar)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({
        erro: 'Transação não encontrada'
      });
    }

    // A condição garante que só o proprietário possa excluir a transação.
    const resultado = await pool.query(
      'DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        erro: 'Transação não encontrada'
      });
    }

    return res.json({
      mensagem: 'Transação removida'
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      erro: 'Erro ao deletar transação'
    });
  }
});

module.exports = router;

const express = require('express');
const db = require('../db');
const { autenticar } = require('../auth');

const router = express.Router();

// Todas as rotas daqui exigem login
router.use(autenticar);

// GET / (listar)
router.get('/', (req, res) => {
  const transacoes = db
    .prepare(
      'SELECT * FROM transacoes WHERE usuario_id = ? ORDER BY data DESC, id DESC'
    )
    .all(req.usuario.id);

  return res.json(transacoes);
});

// POST / (criar)
router.post('/', (req, res) => {
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

    const resultado = db
      .prepare(
        `INSERT INTO transacoes
        (usuario_id, descricao, valor, tipo, categoria, data)
        VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.usuario.id,
        descricao,
        valor,
        tipo,
        categoria,
        data
      );

    const nova = db
      .prepare('SELECT * FROM transacoes WHERE id = ? AND usuario_id = ?')
      .get(resultado.lastInsertRowid, req.usuario.id);

    return res.status(201).json(nova);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      erro: 'Erro ao criar transação'
    });
  }
});

// DELETE /:id (deletar)
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(404).json({
        erro: 'Transação não encontrada'
      });
    }

    // A condição garante que só o proprietário possa excluir a transação.
    const resultado = db
      .prepare('DELETE FROM transacoes WHERE id = ? AND usuario_id = ?')
      .run(id, req.usuario.id);

    if (resultado.changes === 0) {
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

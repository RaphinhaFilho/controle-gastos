const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { gerarToken } = require('../auth');

const router = express.Router();

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios'
      });
    }

    if (typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({
        erro: 'Email inválido'
      });
    }

    if (typeof senha !== 'string' || senha.length < 4) {
      return res.status(400).json({
        erro: 'Senha deve ter pelo menos 4 caracteres'
      });
    }

    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existente.rowCount > 0) {
      return res.status(400).json({
        erro: 'Email já cadastrado'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      'INSERT INTO usuarios (email, senha_hash) VALUES ($1, $2)',
      [email, senhaHash]
    );

    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso'
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      erro: 'Erro ao criar usuário'
    });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios'
      });
    }

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      });
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      });
    }

    const token = gerarToken(usuario);

    return res.json({
      token,
      email: usuario.email
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      erro: 'Erro ao fazer login'
    });
  }
});

module.exports = router;

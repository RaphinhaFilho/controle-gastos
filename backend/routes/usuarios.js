const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
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

    const existente = db
      .prepare('SELECT id FROM usuarios WHERE email = ?')
      .get(email);

    if (existente) {
      return res.status(400).json({
        erro: 'Email já cadastrado'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    db.prepare(
      'INSERT INTO usuarios (email, senha_hash) VALUES (?, ?)'
    ).run(email, senhaHash);

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

    const usuario = db
      .prepare('SELECT * FROM usuarios WHERE email = ?')
      .get(email);

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

require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET não está definido no .env');
  process.exit(1);
}

// Gera um token para um usuário logado
function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// Middleware: protege rotas que exigem login
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não enviado' });
  }

  // Formato esperado: "Bearer eyJhbGciOi..."
  const partes = authHeader.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    return res.status(401).json({ erro: 'Formato de token inválido' });
  }

  const token = partes[1];

  try {
    const dados = jwt.verify(token, JWT_SECRET);

    req.usuario = {
      id: dados.id,
      email: dados.email
    };

    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

module.exports = { gerarToken, autenticar };

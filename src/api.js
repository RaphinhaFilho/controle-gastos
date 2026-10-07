const API_URL = 'http://localhost:3000';
const TOKEN_KEY = 'token';
const EMAIL_KEY = 'email';

// ============ TOKEN ============

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaLogado() {
  return Boolean(getToken());
}

function ehRotaProtegida(endpoint) {
  const pathname = new URL(endpoint, API_URL).pathname;
  return pathname === '/api/transacoes' || pathname.startsWith('/api/transacoes/');
}

async function fazerFetch(endpoint, options = {}, protegida = ehRotaProtegida(endpoint)) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  new Headers(options.headers || {}).forEach((value, name) => headers.set(name, value));

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = new URL(endpoint, API_URL).toString();
  const resposta = await fetch(url, { ...options, headers });

  if (resposta.status === 401 && protegida) logout();

  return resposta;
}

// ============ FETCH GENÉRICO ============

async function fetchAPI(endpoint, options = {}) {
  const resposta = await fazerFetch(endpoint, options);
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const erro = new Error(dados.erro || 'Erro na requisição');
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

// Mantido para compatibilidade com consumidores que precisam tratar a Response.
export function fetchProtegido(url, options = {}) {
  return fazerFetch(url, options, true);
}

// ============ AUTENTICAÇÃO ============

export async function registrar(email, senha) {
  return fetchAPI('/api/register', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function login(email, senha) {
  const dados = await fetchAPI('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  if (!dados.token) {
    throw new Error('A API não retornou um token de autenticação.');
  }

  setToken(dados.token);
  if (dados.email) localStorage.setItem(EMAIL_KEY, dados.email);

  // login.js aguarda esta função e não faz outro redirecionamento.
  window.location.href = 'index.html';
  return dados;
}

export function logout() {
  removeToken();
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem('logado');
  window.location.href = 'login.html';
}

// ============ TRANSAÇÕES ============

export async function listarTransacoes() {
  return fetchAPI('/api/transacoes');
}

export async function criarTransacao(dados) {
  return fetchAPI('/api/transacoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export async function deletarTransacao(id) {
  return fetchAPI(`/api/transacoes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

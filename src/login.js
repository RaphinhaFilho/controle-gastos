import { login } from './api.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const openEyeIcon = passwordToggle.querySelector('[data-eye-open]');
const closedEyeIcon = passwordToggle.querySelector('[data-eye-closed]');
const loginForm = document.getElementById('login-form');
const submitButton = document.getElementById('submit-button');
const message = document.getElementById('form-message');
const buttonLabel = submitButton.querySelector('.button-label');

passwordToggle.addEventListener('click', () => {
  const showingPassword = passwordInput.type === 'password';
  passwordInput.type = showingPassword ? 'text' : 'password';
  passwordToggle.setAttribute('aria-label', showingPassword ? 'Ocultar senha' : 'Mostrar senha');
  passwordToggle.setAttribute('aria-pressed', String(showingPassword));
  passwordToggle.classList.toggle('is-visible', showingPassword);
  openEyeIcon.hidden = !showingPassword;
  closedEyeIcon.hidden = showingPassword;
});

async function handleLogin(event) {
  event.preventDefault();
  if (submitButton.disabled) return;

  message.hidden = true;
  message.textContent = '';
  message.classList.remove('is-info');

  if (!emailInput.value.trim() || !passwordInput.value) {
    message.textContent = 'Preencha seu email e sua senha para continuar.';
    message.hidden = false;
    (!emailInput.value.trim() ? emailInput : passwordInput).focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  buttonLabel.textContent = 'Entrando...';

  try {
    await login(emailInput.value.trim(), passwordInput.value);
  } catch (error) {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    buttonLabel.textContent = 'Entrar';
    message.textContent = error.status === 400 || error.status === 401
      ? 'Email ou senha inválidos'
      : 'Não foi possível conectar ao sistema. Tente novamente.';
    message.hidden = false;
  }
}

loginForm.addEventListener('submit', handleLogin);

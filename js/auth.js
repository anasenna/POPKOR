(() => {
  'use strict';
  const ACCOUNT_KEY = 'popkor-auth-account-v1';
  const SESSION_KEY = 'popkor-auth-session-v1';
  const NEXT_KEY = 'popkor-auth-next';
  const $ = (selector) => document.querySelector(selector);

  function readAccount() {
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      throw new Error('Para configurar o acesso com senha, abra o projeto pelo Live Server no VS Code.');
    }
    const bytes = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function safeNextPage() {
    const next = sessionStorage.getItem(NEXT_KEY) || 'index.html';
    sessionStorage.removeItem(NEXT_KEY);
    const allowed = /^(index|vendas|estoque|financeiro)\.html(?:\?.*)?$/;
    return allowed.test(next) ? next : 'index.html';
  }

  function setupProtectedPage() {
    const logoutButton = $('#logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(NEXT_KEY);
        window.location.replace('login.html');
      });
    }
  }

  function setupLoginPage() {
    const form = $('#login-form');
    if (!form) return;

    const intro = $('#login-intro');
    const title = $('#login-title');
    const submit = $('#login-submit');
    const footer = $('#login-footer');
    const confirmField = $('#confirm-password-field');
    const confirmPassword = $('#login-confirm-password');
    const password = $('#login-password');
    const username = $('#login-username');
    const error = $('#login-error');
    const toggle = $('#toggle-password');
    let account = readAccount();

    if (sessionStorage.getItem(SESSION_KEY) === 'authenticated') {
      window.location.replace(safeNextPage());
      return;
    }

    function setError(message) {
      error.textContent = message;
      error.hidden = !message;
    }

    function renderMode() {
      const firstAccess = !account;
      title.textContent = firstAccess ? 'Criar seu acesso' : 'Bem-vinda de volta!';
      intro.textContent = firstAccess
        ? 'Cadastre um usuário e uma senha para entrar no painel da POPKOR neste navegador.'
        : 'Entre para acessar suas vendas, seu estoque e o financeiro.';
      submit.textContent = firstAccess ? 'Criar acesso e entrar' : 'Entrar';
      confirmField.hidden = !firstAccess;
      confirmPassword.disabled = !firstAccess;
      confirmPassword.required = firstAccess;
      password.autocomplete = firstAccess ? 'new-password' : 'current-password';
      username.autocomplete = firstAccess ? 'username' : 'username';
      footer.textContent = firstAccess
        ? 'Primeiro acesso? Crie suas credenciais aqui. Elas ficam salvas apenas neste navegador.'
        : 'Digite o usuário e a senha cadastrados neste navegador.';
    }

    renderMode();
    username.focus();

    toggle.addEventListener('click', () => {
      const reveal = password.type === 'password';
      password.type = reveal ? 'text' : 'password';
      confirmPassword.type = reveal ? 'text' : 'password';
      toggle.textContent = reveal ? 'Ocultar senha' : 'Mostrar senha';
      toggle.setAttribute('aria-pressed', String(reveal));
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      setError('');
      account = readAccount();
      const user = username.value.trim();
      const pass = password.value;

      if (user.length < 3) {
        setError('O usuário precisa ter pelo menos 3 caracteres.');
        username.focus();
        return;
      }
      if (pass.length < 8) {
        setError('A senha precisa ter pelo menos 8 caracteres.');
        password.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = account ? 'Verificando...' : 'Criando acesso...';
      try {
        const passwordHash = await hashPassword(pass);
        if (!account) {
          if (pass !== confirmPassword.value) {
            setError('As senhas não coincidem. Digite-as novamente.');
            confirmPassword.focus();
            return;
          }
          account = { username: user.toLocaleLowerCase('pt-BR'), passwordHash, createdAt: new Date().toISOString() };
          localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
        } else {
          if (user.toLocaleLowerCase('pt-BR') !== String(account.username).toLocaleLowerCase('pt-BR') || passwordHash !== account.passwordHash) {
            setError('Usuário ou senha incorretos. Confira os dados e tente novamente.');
            password.value = '';
            password.focus();
            return;
          }
        }
        sessionStorage.setItem(SESSION_KEY, 'authenticated');
        window.location.replace(safeNextPage());
      } catch (err) {
        setError(err && err.message ? err.message : 'Não foi possível validar o acesso neste navegador.');
      } finally {
        submit.disabled = false;
        if (!sessionStorage.getItem(SESSION_KEY)) submit.textContent = readAccount() ? 'Entrar' : 'Criar acesso e entrar';
      }
    });
  }

  if (document.body.dataset.page === 'login') setupLoginPage();
  else setupProtectedPage();
})();

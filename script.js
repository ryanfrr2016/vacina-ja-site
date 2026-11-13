// AUTENTICAÇÃO DEMONSTRATIVA — funciona apenas neste navegador.
// Não use senhas reais/importantes. Não é um sistema de contas seguro para produção.
const $ = (selector) => document.querySelector(selector);
const modal = $("#authModal");
const message = $("#authMessage");
const USERS_KEY = "vacinaJa_demo_users_v1";
const SESSION_KEY = "vacinaJa_demo_session_v1";

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }
  catch { return {}; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function setMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
async function hashPassword(password, salt) {
  // Hash local para evitar guardar a senha em texto simples.
  // Ainda assim, armazenamento no navegador não equivale a autenticação segura.
  if (window.crypto?.subtle && window.TextEncoder) {
    const bytes = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  // Compatibilidade para visualização em ambientes locais sem Web Crypto.
  return btoa(unescape(encodeURIComponent(`${salt}:${password}`)));
}
function showTab(tab) {
  const signup = tab === "signup";
  $("#loginForm").hidden = signup;
  $("#signupForm").hidden = !signup;
  $("#authTitle").textContent = signup ? "Crie sua conta" : "Bem-vindo de volta!";
  $("#authSubtitle").textContent = signup ? "Preencha os dados para se cadastrar." : "Acesse sua conta para continuar.";
  document.querySelectorAll(".auth-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  setMessage("");
}
function openAuth(tab = "login") {
  modal.hidden = false;
  $("#authForms").hidden = false;
  $("#accountPanel").hidden = true;
  showTab(tab);
  document.body.style.overflow = "hidden";
}
function closeAuth() {
  modal.hidden = true;
  document.body.style.overflow = "";
}
function currentSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}
function showAccount(user) {
  $("#authForms").hidden = true;
  $("#accountPanel").hidden = false;
  $("#accountGreeting").textContent = `Olá, ${user.name || "visitante"}!`;
  $("#accountEmail").textContent = user.email || "";
}
function refreshAccount() {
  const session = currentSession();
  if (session) showAccount(session);
}
document.querySelectorAll("[data-open-auth]").forEach(b => b.addEventListener("click", () => openAuth(b.dataset.openAuth)));
document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => showTab(b.dataset.tab)));
$("#closeAuth").addEventListener("click", closeAuth);
modal.addEventListener("click", e => { if (e.target === modal) closeAuth(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeAuth(); });
document.querySelectorAll("[data-toggle]").forEach(b => b.addEventListener("click", () => {
  const field = document.getElementById(b.dataset.toggle);
  field.type = field.type === "password" ? "text" : "password";
  b.textContent = field.type === "password" ? "Mostrar" : "Ocultar";
}));

$("#signupForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const password = $("#signupPassword").value;
  const confirm = $("#signupConfirm").value;
  if (password.length < 8) return setMessage("A senha precisa ter pelo menos 8 caracteres.", true);
  if (password !== confirm) return setMessage("As senhas não correspondem.", true);
  const users = getUsers();
  if (users[email]) return setMessage("Já existe um cadastro demonstrativo com esse e-mail.", true);
  const salt = crypto?.getRandomValues ? Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x => x.toString(16).padStart(2, "0")).join("") : String(Date.now());
  const passwordHash = await hashPassword(password, salt);
  users[email] = { name, email, salt, passwordHash };
  saveUsers(users);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
  setMessage("Cadastro realizado! Sua conta demonstrativa está conectada.");
  showAccount({ name, email });
});
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;
  const user = getUsers()[email];
  if (!user) return setMessage("Cadastro não encontrado neste navegador. Crie uma conta primeiro.", true);
  const candidate = await hashPassword(password, user.salt);
  if (candidate !== user.passwordHash) return setMessage("Senha incorreta. Confira os dados e tente novamente.", true);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
  setMessage("Acesso realizado com sucesso!");
  showAccount({ name: user.name, email: user.email });
});
$("#forgotPassword").addEventListener("click", () => {
  setMessage("Como este é um cadastro demonstrativo local, a recuperação automática de senha não está disponível. Crie outro cadastro com um e-mail diferente ou limpe os dados demonstrativos do navegador.");
});
$("#signOut").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  $("#accountPanel").hidden = true;
  $("#authForms").hidden = false;
  showTab("login");
});
$("#notificationBell").addEventListener("click", () => {
  document.querySelector("#atualizacoes").scrollIntoView({ behavior: "smooth" });
});
$("#menuToggle").addEventListener("click", () => {
  const open = $("#mainNav").classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("#mainNav a").forEach(a => a.addEventListener("click", () => {
  $("#mainNav").classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
}));
$("#year").textContent = new Date().getFullYear();
refreshAccount();

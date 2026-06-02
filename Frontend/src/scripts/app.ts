export {};

declare global {
  interface Window {
    HELPDESK_API_BASE_URL: string;
    HELPDESK_APP_BASE_URL: string;
    DOMPurify?: { sanitize: (html: string) => string };
  }
}

type Role = 'admin' | 'dev' | 'cliente';
type ChamadoStatus = 'aberto' | 'finalizado';
type TarefaStatus = 'aberto' | 'fechado';
type ValorTipo = 'hora' | 'fixo';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface User {
  id: string;
  username: string;
  email: string;
  telefone: string | null;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SessionPayload {
  token: string;
  user: User;
}

interface Tarefa {
  id: string;
  chamadoId: string;
  descricao: string;
  dtInicio: string;
  dtFim: string | null;
  status: TarefaStatus;
  duracaoMinutos?: number | null;
}

interface Chamado {
  id: string;
  nome: string;
  mensagem?: string | null;
  mensagemHtml?: string | null;
  clienteId: string;
  usuarioId: string;
  status: ChamadoStatus;
  dtInicio: string;
  dtFim: string | null;
  valor: number;
  valorTipo: ValorTipo;
  valorTotal?: number;
  tempoTotalMinutos?: number;
  tempoTotalFormatado?: string;
  usuario: Pick<User, 'id' | 'username' | 'role'>;
  cliente: Pick<User, 'id' | 'username' | 'email' | 'telefone' | 'role'>;
  tarefas: Tarefa[];
}

interface DashboardData {
  resumo: Array<{
    id: string;
    nome: string;
    status: ChamadoStatus;
    tempoTotalMinutos: number;
    tempoFormatado: string;
    valor: number;
    valorTipo: ValorTipo;
    valorTotal: number;
  }>;
  topUsuarios: Array<{ id: string; username: string; count: number }>;
}

type UserPayload = Partial<Pick<User, 'username' | 'email' | 'telefone' | 'role' | 'active'>> & { password?: string };
type ChamadoPayload = Partial<Pick<Chamado, 'nome' | 'mensagem' | 'mensagemHtml' | 'clienteId' | 'usuarioId' | 'valor' | 'valorTipo'>>;
type TarefaPayload = Pick<Tarefa, 'descricao'>;

const API_BASE = window.HELPDESK_API_BASE_URL;
const APP_BASE = window.HELPDESK_APP_BASE_URL || '/';

const state: {
  users: User[];
  tickets: Chamado[];
  ticket: Chamado | null;
} = {
  users: [],
  tickets: [],
  ticket: null,
};

function $<T extends HTMLElement = any>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento nao encontrado: ${id}`);
  return element as T;
}

const money = (value: unknown) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string | null | undefined) => (value ? new Date(value).toLocaleString('pt-BR') : '-');
const sanitize = (html: string | null | undefined) => window.DOMPurify ? window.DOMPurify.sanitize(html || '') : html || '';
const appUrl = (path: string) => `${APP_BASE.replace(/\/$/, '')}${path}`;
const navigate = (path: string) => {
  location.href = appUrl(path);
};
const stripHtml = (html: string) => {
  const div = document.createElement('div');
  div.innerHTML = sanitize(html);
  return div.textContent || div.innerText || '';
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado';
}

function closest<T extends HTMLElement>(event: Event, selector: string): T | null {
  return (event.target as Element | null)?.closest(selector) as T | null;
}

function toast(message: string, type = 'info') {
  const item = document.createElement('div');
  item.className = `toast ${type}`;
  item.textContent = message;
  $('toast-root').appendChild(item);
  setTimeout(() => item.remove(), 3600);
}

function getToken() {
  return localStorage.getItem('hd_token');
}

function getUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem('hd_user') || 'null') as User | null;
  } catch {
    return null;
  }
}

function setSession(data: SessionPayload) {
  localStorage.setItem('hd_token', data.token);
  localStorage.setItem('hd_user', JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem('hd_token');
  localStorage.removeItem('hd_user');
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearSession();
    navigate('/login');
    return null as T;
  }
  if (res.status === 204) return null as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorData = data as { error?: string; details?: Array<{ message?: string }> };
    const detail = errorData.details?.map((item) => item.message).filter(Boolean).join('. ');
    throw new Error(detail || errorData.error || 'Erro na requisicao');
  }
  return data as T;
}

const api = {
  login: (username: string, password: string) => request<SessionPayload>('POST', '/auth/login', { username, password }),
  users: () => request<User[]>('GET', '/users'),
  createUser: (data: UserPayload) => request<User>('POST', '/users', data),
  updateUser: (id: string, data: UserPayload) => request<User>('PUT', `/users/${id}`, data),
  deleteUser: (id: string) => request<null>('DELETE', `/users/${id}`),
  clientes: (search = '', limit = 20) => request<User[]>('GET', `/users/clientes?search=${encodeURIComponent(search)}&limit=${limit}`),
  chamados: () => request<Chamado[]>('GET', '/chamados'),
  chamado: (id: string) => request<Chamado>('GET', `/chamados/${id}`),
  createChamado: (data: ChamadoPayload) => request<Chamado>('POST', '/chamados', data),
  updateChamado: (id: string, data: ChamadoPayload) => request<Chamado>('PUT', `/chamados/${id}`, data),
  finalizarChamado: (id: string) => request<Chamado>('PATCH', `/chamados/${id}/finalizar`),
  deleteChamado: (id: string) => request<null>('DELETE', `/chamados/${id}`),
  dashboard: () => request<DashboardData>('GET', '/chamados/dashboard'),
  tarefas: (chamadoId: string) => request<Tarefa[]>('GET', `/chamados/${chamadoId}/tarefas`),
  createTarefa: (chamadoId: string, data: TarefaPayload) => request<Tarefa>('POST', `/chamados/${chamadoId}/tarefas`, data),
  fecharTarefa: (id: string) => request<Tarefa>('PATCH', `/chamados/tarefas/${id}/fechar`),
  meusChamados: () => request<Chamado[]>('GET', '/chamados/me'),
  meuChamado: (id: string) => request<Chamado>('GET', `/chamados/me/${id}`),
};

function openModal(id: string) {
  $(id).classList.add('open');
}

function closeModal(id: string) {
  $(id).classList.remove('open');
}

function bindCommon() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    const button = btn as HTMLElement;
    button.addEventListener('click', () => closeModal(button.dataset.closeModal || ''));
  });
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    navigate('/login');
  });

  if (!document.querySelector('.shell')) return;

  const user = getUser();
  if (user) {
    if ($('session-name')) $('session-name').textContent = user.username;
    if ($('session-role')) $('session-role').textContent = `${user.role}${user.email ? ` · ${user.email}` : ''}`;
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const navLink = link as HTMLElement;
      if (navLink.dataset.nav === document.body.dataset.page) navLink.classList.add('active');
    });
    if (user.role === 'cliente') {
      document.querySelector('[data-nav="dashboard"]')?.remove();
      document.querySelector('[data-nav="chamados"]')?.remove();
      document.querySelector('[data-nav="usuarios"]')?.remove();
    } else {
      document.querySelector('[data-nav="cliente"]')?.remove();
    }
  }
}

function requireSession() {
  const mode = document.body.dataset.auth;
  const user = getUser();
  if (mode === 'required' && !user) navigate('/login');
  if (mode === 'guest' && user) navigate(user.role === 'cliente' ? '/cliente/chamados' : '/');
}

function roleLabel(role: Role) {
  return role === 'admin' ? 'Admin' : role === 'dev' ? 'Dev' : 'Cliente';
}

function statusBadge(status: ChamadoStatus | TarefaStatus) {
  return `<span class="badge ${status === 'finalizado' || status === 'fechado' ? 'done' : 'open'}">${status}</span>`;
}

function userName(user?: Pick<User, 'username' | 'email'> | null) {
  return user?.username || user?.email || '-';
}

function clienteName(chamado: Chamado) {
  return userName(chamado.cliente);
}

function renderRich(html?: string | null, fallback = '') {
  return html
    ? `<div class="rich-content">${sanitize(html)}</div>`
    : fallback
      ? `<p class="muted">${fallback}</p>`
      : '';
}

function setupEditor(editorId: string) {
  const editor = $(editorId);
  const toolbar = document.querySelector<HTMLElement>(`[data-editor-toolbar="${editorId}"]`);
  if (!editor || !toolbar || toolbar.dataset.ready) return;
  toolbar.dataset.ready = '1';

  const actions = [
    ['bold', 'B'],
    ['italic', 'I'],
    ['underline', 'U'],
    ['insertUnorderedList', 'Lista'],
    ['createLink', 'Link'],
    ['foreColor', 'Cor'],
  ];
  toolbar.innerHTML = actions.map(([cmd, label]) => `<button type="button" data-cmd="${cmd}">${label}</button>`).join('');
  toolbar.addEventListener('click', (event: Event) => {
    const btn = closest<HTMLButtonElement>(event, 'button[data-cmd]');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (!cmd) return;
    let value = null;
    if (cmd === 'createLink') value = prompt('URL do link');
    if (cmd === 'foreColor') value = prompt('Cor em HEX ou nome CSS', '#60a5fa');
    editor.focus();
    document.execCommand(cmd, false, value || undefined);
  });
  editor.addEventListener('paste', (event: ClipboardEvent) => {
    event.preventDefault();
    const html = event.clipboardData?.getData('text/html');
    const plain = event.clipboardData?.getData('text/plain');
    document.execCommand('insertHTML', false, sanitize(html || plain || ''));
  });
}

async function initLogin() {
  const passwordInput = document.getElementById('login-password') as HTMLInputElement | null;
  const togglePassword = document.getElementById('toggle-login-password') as HTMLButtonElement | null;
  const loginForm = document.getElementById('login-form') as HTMLFormElement | null;
  const loginSubmit = document.getElementById('login-submit') as HTMLButtonElement | null;

  togglePassword?.addEventListener('click', () => {
    if (!passwordInput) return;
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    togglePassword.textContent = isHidden ? 'Ocultar' : 'Mostrar';
    togglePassword.setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
    togglePassword.setAttribute('aria-pressed', String(isHidden));
  });

  async function submitLogin(event?: Event) {
    event?.preventDefault();
    const username = ($('login-username') as HTMLInputElement).value.trim();
    const password = ($('login-password') as HTMLInputElement).value;
    if (!username || !password) {
      toast('Informe usuario e senha', 'error');
      return;
    }

    if (loginSubmit) loginSubmit.disabled = true;
    try {
      const data = await api.login(username, password);
      setSession(data);
      navigate(data.user.role === 'cliente' ? '/cliente/chamados' : '/');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      if (loginSubmit) loginSubmit.disabled = false;
    }
  }

  loginForm?.addEventListener('submit', submitLogin);
  loginSubmit?.addEventListener('click', submitLogin);
  passwordInput?.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') void submitLogin(event);
  });
}

async function initDashboard() {
  try {
    const data = await api.dashboard();
    $('dashboard-view').innerHTML = `
      <div class="grid cols-3">
        <div class="card"><span class="muted">Chamados</span><h2>${data.resumo.length}</h2></div>
        <div class="card"><span class="muted">Top usuarios</span><h2>${data.topUsuarios.length}</h2></div>
        <div class="card"><span class="muted">Valor total</span><h2>${money(data.resumo.reduce((acc, c) => acc + Number(c.valorTotal || 0), 0))}</h2></div>
      </div>
      <div class="panel" style="margin-top:16px">
        <table>
          <thead><tr><th>Chamado</th><th>Status</th><th>Tempo</th><th>Valor total</th></tr></thead>
          <tbody>${data.resumo.map((c) => `<tr><td>${c.nome}</td><td>${statusBadge(c.status)}</td><td>${c.tempoFormatado}</td><td>${money(c.valorTotal)}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  } catch (err) {
    toast(errorMessage(err), 'error');
  }
}

async function initUsers() {
  const current = getUser();
  if (!current) return;
  const currentUser = current;
  if (currentUser.role !== 'admin') $('new-user-btn')?.remove();

  async function load() {
    state.users = await api.users();
    $('users-view').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Usuario</th><th>Email</th><th>Telefone</th><th>Cargo</th><th>Ativo</th><th>Acoes</th></tr></thead>
          <tbody>${state.users.map((u) => `
            <tr>
              <td><strong>${u.username}</strong>${u.id === currentUser.id ? ' <span class="muted">(voce)</span>' : ''}</td>
              <td>${u.email}</td>
              <td>${u.telefone || '-'}</td>
              <td>${roleLabel(u.role)}</td>
              <td>${u.active ? 'Sim' : 'Nao'}</td>
              <td>${currentUser.role === 'admin' ? `<button class="ghost" data-edit-user="${u.id}">Editar</button> ${u.id !== currentUser.id ? `<button class="danger" data-delete-user="${u.id}">Excluir</button>` : ''}` : '-'}</td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  $('new-user-btn')?.addEventListener('click', () => {
    $('user-modal-title').textContent = 'Novo usuario';
    $('user-form').reset();
    $('user-id').value = '';
    $('user-role').value = 'cliente';
    $('user-active').value = 'true';
    openModal('user-modal');
  });

  $('users-view')?.addEventListener('click', async (event: Event) => {
    const edit = closest<HTMLButtonElement>(event, '[data-edit-user]');
    const del = closest<HTMLButtonElement>(event, '[data-delete-user]');
    if (edit) {
      const u = state.users.find((item) => item.id === edit.dataset.editUser);
      if (!u) return;
      $('user-modal-title').textContent = 'Editar usuario';
      $('user-id').value = u.id;
      $('user-username').value = u.username;
      $('user-email').value = u.email || '';
      $('user-telefone').value = u.telefone || '';
      $('user-role').value = u.role;
      $('user-active').value = String(u.active);
      $('user-password').value = '';
      openModal('user-modal');
    }
    if (del && confirm('Excluir usuario?')) {
      await api.deleteUser(del.dataset.deleteUser || '');
      toast('Usuario excluido');
      await load();
    }
  });

  $('user-form')?.addEventListener('submit', async (event: Event) => {
    event.preventDefault();
    const id = $('user-id').value;
    const data: UserPayload = {
      username: $('user-username').value.trim(),
      email: $('user-email').value.trim(),
      telefone: $('user-telefone').value.trim(),
      role: $('user-role').value as Role,
      active: $('user-active').value === 'true',
    };
    const password = $('user-password').value;
    if (password) data.password = password;
    if (!id && !password) return toast('Informe uma senha', 'error');
    try {
      id ? await api.updateUser(id, data) : await api.createUser(data);
      closeModal('user-modal');
      toast('Usuario salvo');
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  await load();
}

async function loadStaffUsers() {
  const users = await api.users();
  return users.filter((u) => u.active && (u.role === 'admin' || u.role === 'dev'));
}

function selectedClientFromTicket(ticket?: Chamado) {
  return ticket?.cliente ? { id: ticket.cliente.id, label: `${ticket.cliente.username} · ${ticket.cliente.email}` } : null;
}

async function initTickets() {
  setupEditor('ticket-message-editor');
  const staff = await loadStaffUsers();

  function fillStaffSelect() {
    $('ticket-user-id').innerHTML = '<option value="">Selecione</option>' + staff.map((u) => `<option value="${u.id}">${u.username}</option>`).join('');
  }

  function setValueKind(kind: ValorTipo) {
    ($('ticket-value-hourly') as HTMLInputElement).checked = kind === 'hora';
    ($('ticket-value-fixed') as HTMLInputElement).checked = kind === 'fixo';
  }

  async function load() {
    state.tickets = await api.chamados();
    renderTickets();
  }

  function renderTickets() {
    const query = $('ticket-search')?.value.toLowerCase() || '';
    const status = $('ticket-status')?.value || '';
    const rows = state.tickets.filter((c) => {
      const hay = `${c.nome} ${clienteName(c)} ${c.usuario?.username || ''}`.toLowerCase();
      return (!status || c.status === status) && (!query || hay.includes(query));
    });
    $('tickets-view').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Titulo</th><th>Usuario</th><th>Responsavel</th><th>Status</th><th>Inicio</th><th>Acoes</th></tr></thead>
          <tbody>${rows.map((c) => `
            <tr>
              <td><a href="${appUrl(`/chamado-detalhe?id=${c.id}`)}"><strong>${c.nome}</strong></a></td>
              <td>${clienteName(c)}</td>
              <td>${c.usuario?.username || '-'}</td>
              <td>${statusBadge(c.status)}</td>
              <td>${date(c.dtInicio)}</td>
              <td><button class="ghost" data-edit-ticket="${c.id}">Editar</button> <button class="danger" data-delete-ticket="${c.id}">Excluir</button></td>
            </tr>`).join('')}</tbody>
        </table>
      </div>`;
  }

  async function searchClientes(value: string) {
    const items = await api.clientes(value, 20);
    const usernamesById = new Map(items.map((item) => [item.id, item.username]));
    $('ticket-client-results').innerHTML = items.map((c) => `<option value="${c.id}">${c.username} · ${c.email}${c.telefone ? ` · ${c.telefone}` : ''}</option>`).join('');
    Array.from(($('ticket-client-results') as HTMLSelectElement).options).forEach((option) => {
      option.textContent = usernamesById.get(option.value) || option.textContent;
    });
  }

  $('ticket-client-search')?.addEventListener('input', (event: Event) => searchClientes((event.target as HTMLInputElement).value));
  $('ticket-client-results')?.addEventListener('change', () => {
    const opt = $('ticket-client-results').selectedOptions[0];
    if (!opt) return;
    $('ticket-client-id').value = opt.value;
    $('ticket-client-search').value = opt.textContent || '';
  });
  $('ticket-search')?.addEventListener('input', renderTickets);
  $('ticket-status')?.addEventListener('change', renderTickets);
  $('ticket-value-hourly')?.addEventListener('change', () => setValueKind('hora'));
  $('ticket-value-fixed')?.addEventListener('change', () => setValueKind('fixo'));

  $('new-ticket-btn')?.addEventListener('click', async () => {
    fillStaffSelect();
    $('ticket-modal-title').textContent = 'Novo chamado';
    $('ticket-form').reset();
    $('ticket-id').value = '';
    $('ticket-client-id').value = '';
    setValueKind('hora');
    $('ticket-message-editor').innerHTML = '';
    await searchClientes('');
    openModal('ticket-modal');
  });

  $('tickets-view')?.addEventListener('click', async (event: Event) => {
    const edit = closest<HTMLButtonElement>(event, '[data-edit-ticket]');
    const del = closest<HTMLButtonElement>(event, '[data-delete-ticket]');
    if (edit) {
      const c = state.tickets.find((item) => item.id === edit.dataset.editTicket);
      if (!c) return;
      fillStaffSelect();
      $('ticket-modal-title').textContent = 'Editar chamado';
      $('ticket-id').value = c.id;
      $('ticket-name').value = c.nome;
      $('ticket-client-id').value = c.clienteId;
      $('ticket-client-search').value = c.cliente?.username || '';
      $('ticket-user-id').value = c.usuarioId;
      $('ticket-value').value = c.valor || 0;
      setValueKind(c.valorTipo || 'hora');
      $('ticket-message-editor').innerHTML = sanitize(c.mensagemHtml || '');
      await searchClientes(c.cliente?.username || '');
      openModal('ticket-modal');
    }
    if (del && confirm('Excluir chamado?')) {
      await api.deleteChamado(del.dataset.deleteTicket || '');
      toast('Chamado excluido');
      await load();
    }
  });

  $('ticket-form')?.addEventListener('submit', async (event: Event) => {
    event.preventDefault();
    const html = sanitize($('ticket-message-editor').innerHTML);
    const data: ChamadoPayload = {
      nome: $('ticket-name').value.trim(),
      clienteId: $('ticket-client-id').value,
      usuarioId: $('ticket-user-id').value,
      valor: Number($('ticket-value').value || 0),
      valorTipo: ($('ticket-value-fixed') as HTMLInputElement).checked ? 'fixo' : 'hora',
      mensagem: stripHtml(html),
      mensagemHtml: html,
    };
    if (!data.nome || !data.clienteId || !data.usuarioId) return toast('Preencha titulo, usuario e responsavel', 'error');
    try {
      const id = $('ticket-id').value;
      id ? await api.updateChamado(id, data) : await api.createChamado(data);
      closeModal('ticket-modal');
      toast('Chamado salvo');
      await load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  await load();
}

function renderTicketHeader(c: Chamado, clientMode = false) {
  return `
    <div class="page-head">
      <div>
        <h2>${c.nome}</h2>
        <p class="muted">Usuario: ${clienteName(c)} · Responsavel: ${c.usuario?.username || '-'}</p>
      </div>
      <div>${statusBadge(c.status)}</div>
    </div>
    <div class="grid cols-3">
      <div class="card"><span class="muted">Inicio</span><strong>${date(c.dtInicio)}</strong></div>
      <div class="card"><span class="muted">Fim</span><strong>${date(c.dtFim)}</strong></div>
      <div class="card"><span class="muted">Valor total</span><strong>${money(c.valorTotal)}</strong></div>
    </div>
    <section class="card" style="margin-top:16px">
      <h3>Mensagem do chamado</h3>
      ${renderRich(c.mensagemHtml, c.mensagem || 'Sem mensagem registrada.')}
    </section>
    ${clientMode || c.status !== 'aberto' ? '' : `
      <div class="toolbar" style="margin-top:16px">
        <button id="toggle-task-form" type="button">Nova tarefa</button>
        <button class="success" data-finalize-ticket="${c.id}" type="button">Fechar chamado</button>
      </div>
    `}`;
}

function taskCard(t: Tarefa, clientMode = false) {
  return `
    <article class="card">
      <div class="page-head">
        <div>
          <strong>${stripHtml(t.descricao).slice(0, 120) || 'Tarefa'}</strong>
          <p class="muted">${date(t.dtInicio)}${t.dtFim ? ` -> ${date(t.dtFim)}` : ''}</p>
        </div>
        <div>${statusBadge(t.status)}</div>
      </div>
      ${renderRich(t.descricao)}
      ${!clientMode && t.status === 'aberto' ? `<button class="success" data-close-task="${t.id}" type="button">Fechar tarefa</button>` : ''}
    </article>`;
}

async function initTicketDetail() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return navigate('/chamados');
  const chamadoId = id;

  async function load() {
    state.ticket = await api.chamado(chamadoId);
    const c = state.ticket;
    $('ticket-detail-view').innerHTML = `
      ${renderTicketHeader(c)}
      <section class="card" id="task-form-card" style="display:none;margin-top:16px">
        <h3>Nova tarefa</h3>
        <form id="task-form" class="grid">
          <label>Descricao formatada<div class="rich-toolbar" data-editor-toolbar="task-message-editor"></div><div id="task-message-editor" class="rich-editor" contenteditable="true"></div></label>
          <div class="actions"><button class="ghost" id="cancel-task" type="button">Cancelar</button><button type="submit">Salvar tarefa</button></div>
        </form>
      </section>
      <div class="grid" style="margin-top:16px">${c.tarefas.map((t) => taskCard(t)).join('') || '<p class="muted">Nenhuma tarefa.</p>'}</div>`;
    setupEditor('task-message-editor');
    $('toggle-task-form')?.addEventListener('click', () => $('task-form-card').style.display = 'block');
    $('cancel-task')?.addEventListener('click', () => $('task-form-card').style.display = 'none');
    $('task-form')?.addEventListener('submit', submitTask);
  }

  async function submitTask(event: Event) {
    event.preventDefault();
    const html = sanitize($('task-message-editor').innerHTML);
    if (!stripHtml(html).trim()) return toast('Informe a descricao da tarefa', 'error');
    await api.createTarefa(chamadoId, {
      descricao: html,
    });
    toast('Tarefa criada');
    await load();
  }

  $('ticket-detail-view')?.addEventListener('click', async (event: Event) => {
    const finalize = closest<HTMLButtonElement>(event, '[data-finalize-ticket]');
    if (finalize) {
      if (!confirm('Fechar este chamado?')) return;
      await api.finalizarChamado(finalize.dataset.finalizeTicket || '');
      toast('Chamado fechado');
      await load();
      return;
    }

    const btn = closest<HTMLButtonElement>(event, '[data-close-task]');
    if (!btn) return;
    await api.fecharTarefa(btn.dataset.closeTask || '');
    toast('Tarefa fechada');
    await load();
  });

  await load();
}

async function initClientTickets() {
  const tickets = await api.meusChamados();
  $('client-tickets-view').innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Chamado</th><th>Status</th><th>Responsavel</th><th>Inicio</th></tr></thead>
      <tbody>${tickets.map((c) => `
        <tr>
          <td><a href="${appUrl(`/cliente/chamado?id=${c.id}`)}"><strong>${c.nome}</strong></a></td>
          <td>${statusBadge(c.status)}</td>
          <td>${c.usuario?.username || '-'}</td>
          <td>${date(c.dtInicio)}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
}

async function initClientTicketDetail() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return navigate('/cliente/chamados');
  const c = await api.meuChamado(id);
  $('client-ticket-detail-view').innerHTML = `
    ${renderTicketHeader(c, true)}
    <section style="margin-top:16px">
      <h3>Tarefas</h3>
      <div class="grid">${c.tarefas.map((t) => taskCard(t, true)).join('') || '<p class="muted">Nenhuma tarefa.</p>'}</div>
    </section>`;
}

async function init() {
  requireSession();
  bindCommon();
  const page = document.body.dataset.page;
  try {
    if (page === 'login') await initLogin();
    if (page === 'dashboard') await initDashboard();
    if (page === 'usuarios') await initUsers();
    if (page === 'chamados') await initTickets();
    if (page === 'chamado-detalhe') await initTicketDetail();
    if (page === 'cliente' && $('client-tickets-view')) await initClientTickets();
    if (page === 'cliente' && $('client-ticket-detail-view')) await initClientTicketDetail();
  } catch (err) {
    toast(errorMessage(err), 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);

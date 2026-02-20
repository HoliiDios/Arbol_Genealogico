const CREATOR_FULL_NAME = 'mateo braida navarro';
const CREATOR_EMAILS = ['mateobraidanavarro@gmail.com'];
const MAIN_TREE_NAME = 'Rijo-Regueira';

const DEFAULT_COOKIES_POLICY = `Política de Cookies – Hereditas

Hereditas es una aplicación familiar privada y sin fines de lucro destinada a la preservación del legado genealógico.

1. Uso de cookies

Hereditas utiliza cookies con los siguientes fines:

Garantizar el correcto funcionamiento de la plataforma.

Mantener sesiones activas de los usuarios.

Registrar accesos (fecha, hora y actividad básica dentro de la aplicación).

Mejorar la seguridad y prevenir usos indebidos.

Supervisar el uso general de la plataforma para su correcta administración.

Las cookies empleadas no tienen fines comerciales ni publicitarios.

2. Supervisión y control

Como creador y administrador de Hereditas, me reservo el derecho de:

Revisar registros de acceso.

Analizar patrones de uso para proteger la integridad de la aplicación.

Restringir o bloquear accesos que se consideren inapropiados o contrarios al propósito familiar de la plataforma.

3. Aceptación

Al utilizar Hereditas, el usuario acepta el uso de cookies conforme a esta política.`;

const DEFAULT_PHOTOS_POLICY = `Política de Contenido – Hereditas

Hereditas permite la carga de fotografías y documentos familiares con el objetivo de preservar el patrimonio histórico de la familia.

1. Revisión y aprobación

Todas las imágenes y documentos cargados en la plataforma pueden estar sujetos a revisión por parte del administrador.

El creador y administrador de Hereditas tiene la autoridad exclusiva para:

Aprobar o rechazar imágenes.

Eliminar fotografías o documentos considerados inapropiados.

Retirar contenido que no guarde relación con el propósito genealógico.

Modificar o reorganizar información para mantener coherencia histórica.

2. Contenido inapropiado

Se considerará inapropiado cualquier contenido que:

Sea ofensivo, violento o discriminatorio.

No tenga relación con la historia familiar.

Vulnere la privacidad de terceros.

Contenga material que dañe la integridad del proyecto.

3. Finalidad no lucrativa

Hereditas es una plataforma privada y no comercial.
El contenido se almacena exclusivamente con fines históricos y familiares.

4. Autoridad administrativa

El administrador se reserva el derecho de suspender cuentas o eliminar contenido sin previo aviso cuando se considere necesario para preservar la integridad, seguridad y propósito del proyecto.`;

const seedPeople = [
  { id: crypto.randomUUID(), name: 'Gregorio', lastName: 'Regueira Lopez', relation: 'Ancestro principal', treeName: MAIN_TREE_NAME, locked: true, parentIds: [], spouseIds: [], details: { birth: '1885-05-09', death: '1971-02-11', location: '', events: '' }, photo: '', approved: false },
  { id: crypto.randomUUID(), name: 'Julia Sandalia', lastName: 'Gutierrez Perez', relation: 'Ancestro principal', treeName: MAIN_TREE_NAME, locked: true, parentIds: [], spouseIds: [], details: { birth: '1887-09-01', death: '1977-04-04', location: '', events: '' }, photo: '', approved: false },
  { id: crypto.randomUUID(), name: 'Pedro', lastName: 'Rijo Barreto', relation: 'Ancestro principal', treeName: MAIN_TREE_NAME, locked: true, parentIds: [], spouseIds: [], details: { birth: '1861-01-01', death: '1921-01-01', location: '', events: '' }, photo: '', approved: false },
  { id: crypto.randomUUID(), name: 'Ortelia', lastName: 'Valenzuela', relation: 'Ancestro principal', treeName: MAIN_TREE_NAME, locked: true, parentIds: [], spouseIds: [], details: { birth: '1970-04-28', death: 'Fallecida', location: '', events: '' }, photo: '', approved: false }
];

// Vincular parejas semilla
seedPeople[0].spouseIds = [seedPeople[1].id];
seedPeople[1].spouseIds = [seedPeople[0].id];
seedPeople[2].spouseIds = [seedPeople[3].id];
seedPeople[3].spouseIds = [seedPeople[2].id];

const MAIN_TRUNK_IDS = seedPeople.map(p => p.id);

const state = {
  trees: JSON.parse(localStorage.getItem('trees') || 'null') || [{ name: MAIN_TREE_NAME, ownerEmail: 'sistema', public: true, trunkIds: MAIN_TRUNK_IDS }],
  people: JSON.parse(localStorage.getItem('people') || 'null') || seedPeople,
  documents: JSON.parse(localStorage.getItem('documents') || '[]'),
  users: JSON.parse(localStorage.getItem('users') || '[]'),
  codes: JSON.parse(localStorage.getItem('codes') || '{}'),
  creatorWarnings: JSON.parse(localStorage.getItem('creatorWarnings') || '[]'),
  photoRequests: JSON.parse(localStorage.getItem('photoRequests') || '[]'),
  pendingEdits: JSON.parse(localStorage.getItem('pendingEdits') || '[]'),
  treeRequests: JSON.parse(localStorage.getItem('treeRequests') || '[]'),
  mapPoints: JSON.parse(localStorage.getItem('mapPoints') || '[]'),
  activity: JSON.parse(localStorage.getItem('activity') || '[]'),
  pendingPeople: JSON.parse(localStorage.getItem('pendingPeople') || '[]'),
  reports: JSON.parse(localStorage.getItem('reports') || '[]'),
  userNotifications: JSON.parse(localStorage.getItem('userNotifications') || '{}'),
  cookieConsent: JSON.parse(localStorage.getItem('cookieConsent') || 'null'),
  cookieLog: JSON.parse(localStorage.getItem('cookieLog') || '[]'),
  policies: JSON.parse(localStorage.getItem('policies') || 'null') || {
    photos: DEFAULT_PHOTOS_POLICY,
    cookies: DEFAULT_COOKIES_POLICY
  },
  currentUser: JSON.parse(sessionStorage.getItem('currentUser') || 'null'),
  activeTreeName: MAIN_TREE_NAME
};

const panels = document.querySelectorAll('.panel');
const nav = document.getElementById('app-nav');
const authMessage = document.getElementById('auth-message');
const homeBtn = document.getElementById('home-btn');
const backBtn = document.getElementById('back-btn');
const bellBtn = document.getElementById('bell-btn');
const floatingLeft = document.getElementById('floating-left');
const logoutBtn = document.getElementById('logout-btn');
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies-btn');
const rejectCookiesBtn = document.getElementById('reject-cookies-btn');
const readCookiesPolicyBtn = document.getElementById('read-cookies-policy-btn');
const navState = { history: [], current: 'profile' };

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function hashPassword(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isStrongPassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function logActivity(text) {
  state.activity.unshift({ text: String(text || '').slice(0, 180), at: new Date().toISOString() });
  state.activity = state.activity.slice(0, 50);
}

function getUpcomingBirthdays(limit = 6) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return state.people
    .filter(p => /^\d{4}-\d{2}-\d{2}$/.test(p.details?.birth || ''))
    .map(p => {
      const [, m, d] = p.details.birth.split('-').map(Number);
      const next = new Date(now.getFullYear(), m - 1, d);
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      return { person: p, next, label: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` };
    })
    .sort((a, b) => a.next - b.next)
    .slice(0, limit);
}

function renderInsights() {
  const stats = document.getElementById('insight-stats');
  const upcoming = document.getElementById('upcoming-birthdays');
  const activity = document.getElementById('activity-feed');
  if (!stats || !upcoming || !activity) return;

  const visiblePeople = state.people.length;
  stats.innerHTML = `
    <li>Árboles creados: ${state.trees.length}</li>
    <li>Personas registradas: ${visiblePeople}</li>
    <li>Documentos cargados: ${state.documents.length}</li>
    <li>Puntos en mapas: ${state.mapPoints.length}</li>
  `;

  const birthdays = getUpcomingBirthdays();
  upcoming.innerHTML = birthdays.length
    ? birthdays.map(x => `<li>${escapeHtml(x.person.name)} ${escapeHtml(x.person.lastName)} — ${x.label}</li>`).join('')
    : '<li>No hay fechas de nacimiento cargadas.</li>';

  activity.innerHTML = state.activity.length
    ? state.activity.slice(0, 12).map(a => `<li>${escapeHtml(a.at.slice(0, 16).replace('T', ' '))} — ${escapeHtml(a.text)}</li>`).join('')
    : '<li>Sin actividad reciente.</li>';
}

function populateSearchTreeFilter() {
  const sel = document.getElementById('search-tree');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos</option>' + state.trees.map(t => `<option>${escapeHtml(t.name)}</option>`).join('');
  if (state.trees.some(t => t.name === current)) sel.value = current;
}

function saveAll() {
  Object.entries({ trees: state.trees, people: state.people, documents: state.documents, users: state.users, codes: state.codes, creatorWarnings: state.creatorWarnings, photoRequests: state.photoRequests, pendingEdits: state.pendingEdits, treeRequests: state.treeRequests, mapPoints: state.mapPoints, activity: state.activity, pendingPeople: state.pendingPeople, reports: state.reports, userNotifications: state.userNotifications, cookieConsent: state.cookieConsent, cookieLog: state.cookieLog, policies: state.policies }).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function isCreator(user) {
  const fullName = normalizeText(`${user.name} ${user.lastName1} ${user.lastName2}`);
  const email = normalizeText(user.email);
  return fullName === CREATOR_FULL_NAME || CREATOR_EMAILS.includes(email);
}

function updateFloatingControls() {
  const logged = !!state.currentUser;
  const onMain = navState.current === 'insights';
  floatingLeft.classList.toggle('hidden', !logged || onMain);
  bellBtn.classList.toggle('hidden', !logged);
}

function showPanel(id, pushHistory = true) {
  if (pushHistory && navState.current && navState.current !== id) navState.history.push(navState.current);
  navState.current = id;
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.body.classList.toggle('main-menu-background', id === 'insights' && !!state.currentUser);
  updateFloatingControls();
}

function updateNavVisibility() {
  nav.classList.toggle('hidden-nav', !state.currentUser);
  nav.querySelector('[data-target="creator-dashboard"]').style.display = state.currentUser?.isCreator ? 'inline-block' : 'none';
}

function showMainMenu() {
  navState.history = [];
  showPanel('insights', false);
  renderInsights();
}

function buildNotifications() {
  const notes = [];
  if (!state.currentUser) return notes;
  if (state.currentUser.isCreator) {
    notes.push(`Tienes ${state.photoRequests.length} foto(s) pendientes de revisión.`);
    notes.push(`Tienes ${state.pendingEdits.length} cambio(s) de información pendientes.`);
    notes.push(`Tienes ${state.pendingPeople.length} alta(s) familiares pendientes.`);
    notes.push(`Tienes ${state.reports.length} denuncia(s) pendientes.`);
  }
  state.creatorWarnings.slice(-8).forEach(w => notes.push(`Aviso del creador: ${w.text}`));
  const personal = state.currentUser?.email ? (state.userNotifications[state.currentUser.email] || []) : [];
  personal.forEach(n => notes.push(`Recordatorio: ${n.text}`));
  return notes;
}

function renderNotifications() {
  const ul = document.getElementById('notifications-list');
  if (!ul) return;
  const notes = buildNotifications();
  ul.innerHTML = notes.length ? notes.map(n => `<li>${escapeHtml(n)}</li>`).join('') : '<li>No hay notificaciones.</li>';
}

function updateCookieBanner() {
  if (!cookieBanner) return;
  cookieBanner.classList.toggle('hidden', state.cookieConsent !== null);
}

function registerCookieUsage(action) {
  if (state.cookieConsent !== 'accepted') return;
  state.cookieLog.push({ at: new Date().toISOString(), user: state.currentUser?.email || 'anonimo', action });
  state.cookieLog = state.cookieLog.slice(-200);
}

function pushUserNotification(email, text) {
  if (!email) return;
  if (!Array.isArray(state.userNotifications[email])) state.userNotifications[email] = [];
  state.userNotifications[email].unshift({ text, at: new Date().toISOString() });
  state.userNotifications[email] = state.userNotifications[email].slice(0, 30);
}

document.querySelectorAll('.main-nav button, .policy-link').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    if (!state.currentUser && !['profile', 'policy-photos', 'policy-cookies'].includes(btn.dataset.target)) return showPanel('profile');
    showPanel(btn.dataset.target);
    if (btn.dataset.target === 'creator-dashboard') renderCreatorDashboard();
    if (btn.dataset.target === 'maps') renderMapPoints();
    if (btn.dataset.target === 'tree') {
      document.getElementById('tree-search-view')?.classList.remove('hidden');
      document.getElementById('my-trees-view')?.classList.add('hidden');
      renderTree();
    }
    if (btn.dataset.target === 'insights') renderInsights();
    if (btn.dataset.target === 'notifications') renderNotifications();
  });
});

homeBtn.addEventListener('click', () => {
  showMainMenu();
});

backBtn.addEventListener('click', () => {
  const prev = navState.history.pop();
  if (prev) showPanel(prev, false);
});

readCookiesPolicyBtn?.addEventListener('click', () => {
  showPanel('policy-cookies');
});

acceptCookiesBtn?.addEventListener('click', () => {
  state.cookieConsent = 'accepted';
  registerCookieUsage('consent_accept');
  saveAll();
  updateCookieBanner();
});

rejectCookiesBtn?.addEventListener('click', () => {
  state.cookieConsent = 'rejected';
  saveAll();
  updateCookieBanner();
});

logoutBtn?.addEventListener('click', () => {
  if (!state.currentUser) return;
  logActivity(`Sesión cerrada por ${state.currentUser.email}`);
  state.currentUser = null;
  navState.history = [];
  showPanel('profile', false);
  updateNavVisibility();
  saveAll();
});

bellBtn.addEventListener('click', () => {
  if (!state.currentUser) return;
  showPanel('notifications');
  renderNotifications();
});

function getVisiblePeople() {
  return state.people.filter(p => p.treeName === state.activeTreeName);
}

function parseBirthYear(person) {
  const b = person.details?.birth || '';
  const m = /^(\d{4})/.exec(b);
  return m ? Number(m[1]) : 9999;
}

function determineTrunkIds(people) {
  if (!people.length) return new Set();

  const activeTree = state.trees.find(t => t.name === state.activeTreeName);
  const configuredTrunk = new Set((activeTree?.trunkIds || []).filter(id => people.some(p => p.id === id)));
  if (configuredTrunk.size) return configuredTrunk;

  if (state.activeTreeName === MAIN_TREE_NAME) {
    const founders = people.filter(p => p.relation === 'Ancestro principal');
    if (founders.length >= 4) return new Set(founders.map(p => p.id));
  }

  const sorted = [...people].sort((a, b) => parseBirthYear(a) - parseBirthYear(b));
  const trunk = new Set(sorted.slice(0, 2).map(p => p.id));

  sorted.slice(0, 2).forEach(person => {
    (person.spouseIds || []).forEach(id => {
      const spouse = people.find(p => p.id === id);
      if (spouse) trunk.add(spouse.id);
    });
  });

  return trunk;
}

function drawBranches(people) {
  const container = document.querySelector('.tree-container');
  const oldSvg = document.getElementById('branches-svg');
  if (oldSvg) oldSvg.remove();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'branches-svg');
  svg.setAttribute('class', 'branches-svg');
  container.appendChild(svg);

  const cRect = container.getBoundingClientRect();
  people.forEach(child => {
    const childEl = container.querySelector(`[data-person-id='${child.id}']`);
    if (!childEl) return;
    const childRect = childEl.getBoundingClientRect();
    const cx = childRect.left - cRect.left + childRect.width / 2;
    const cy = childRect.top - cRect.top;

    (child.parentIds || []).forEach(parentId => {
      const pEl = container.querySelector(`[data-person-id='${parentId}']`);
      if (!pEl) return;
      const pRect = pEl.getBoundingClientRect();
      const px = pRect.left - cRect.left + pRect.width / 2;
      const py = pRect.bottom - cRect.top;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', px);
      line.setAttribute('y1', py);
      line.setAttribute('x2', cx);
      line.setAttribute('y2', cy);
      line.setAttribute('class', 'branch-line');
      svg.appendChild(line);
    });
  });
}

function renderTree() {
  document.getElementById('current-tree-title').textContent = `Árbol seleccionado: ${state.activeTreeName}`;
  const trunk = document.getElementById('trunk');
  const leaves = document.getElementById('leaves');
  trunk.innerHTML = '';
  leaves.innerHTML = '';

  const people = getVisiblePeople();
  const trunkIds = determineTrunkIds(people);

  people.forEach(p => {
    const card = document.createElement('article');
    card.className = 'person-card';
    card.dataset.personId = p.id;
    const leafTag = trunkIds.has(p.id) ? '<span class="node-tag trunk-tag">Tronco</span>' : '<span class="node-tag leaf-tag">Hoja</span>';
    const safeName = escapeHtml(p.name);
    const safeLastName = escapeHtml(p.lastName);
    const safeRelation = escapeHtml(p.relation);
    const safeImage = p.photo && p.approved ? `<img src="${p.photo}" alt="${safeName}"/>` : '<span>＋</span>';
    card.innerHTML = `<button class="plus" data-photo="${p.id}">+</button><div class="photo">${safeImage}</div><h4>${safeName} ${safeLastName}</h4><small>${safeRelation}</small>${leafTag}${p.locked ? '<span class="locked-tag">🔒 protegida</span>' : ''}<button class="plus relatives" data-relative="${p.id}">+</button>`;
    card.addEventListener('click', e => { if (!e.target.matches('.plus')) showPerson(p.id); });
    (trunkIds.has(p.id) ? trunk : leaves).appendChild(card);
  });

  requestAnimationFrame(() => drawBranches(people));
}

function showPerson(id) {
  const p = state.people.find(x => x.id === id);
  if (!p) return;
  const d = p.details || {};
  const docs = state.documents.filter(x => x.person.toLowerCase().includes(p.name.toLowerCase()));
  document.getElementById('person-content').innerHTML = `<p><strong>Nombre:</strong> ${escapeHtml(p.name)} ${escapeHtml(p.lastName)}</p><p><strong>Árbol:</strong> ${escapeHtml(p.treeName)}</p><p><strong>Nacimiento:</strong> ${escapeHtml(d.birth || 'No definido')}</p><p><strong>Defunción:</strong> ${escapeHtml(d.death || 'No definido')}</p><p><strong>Vivió en:</strong> ${escapeHtml(d.location || 'No definido')}</p><p><strong>Eventos:</strong> ${escapeHtml(d.events || 'No definidos')}</p><p><strong>Documentos:</strong> ${escapeHtml(docs.map(x => x.type).join(', ') || 'Sin documentos')}</p>`;
  if (state.currentUser?.isCreator) {
    const content = document.getElementById('person-content');
    const btn = document.createElement('button');
    btn.className = 'secondary';
    btn.textContent = 'Borrar persona';
    btn.dataset.deletePerson = p.id;
    content.appendChild(btn);
  }
}

function renderTreeSearchResults(q = '') {
  const ul = document.getElementById('tree-search-results');
  ul.innerHTML = '';
  const trees = state.trees.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));
  trees.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(t.name)} <button data-open-tree="${escapeHtml(t.name)}">Abrir</button>`;
    ul.appendChild(li);
  });
  if (!trees.length) ul.innerHTML = '<li>No aparece ese árbol. Puedes crearlo aquí.</li>';
}

function renderMyTrees() {
  const ul = document.getElementById('my-trees-list');
  ul.innerHTML = '';
  const mine = state.trees.filter(t => t.ownerEmail === state.currentUser?.email);
  mine.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `${escapeHtml(t.name)} (público) <button data-open-tree="${escapeHtml(t.name)}">Abrir</button>`;
    ul.appendChild(li);
  });
  if (!mine.length) ul.innerHTML = '<li>No tienes árboles aún.</li>';
}

function renderDocuments() {
  document.getElementById('document-list').innerHTML = state.documents.map(d => `<li>${escapeHtml(d.person)} — ${escapeHtml(d.type)} (${escapeHtml(d.fileName || 'sin archivo')})</li>`).join('');
}

function renderMapPoints() {
  document.getElementById('map-list').innerHTML = state.mapPoints.map(m => `<li>${escapeHtml(m.place)} — ${escapeHtml(m.people.join(', '))}</li>`).join('');
}

function renderCreatorDashboard() {
  const log = JSON.parse(localStorage.getItem('accessLog') || '[]');
  const cookieSummary = `<li>Consentimiento de cookies actual: ${escapeHtml(state.cookieConsent || 'sin definir')}</li><li>Eventos de uso por cookies: ${state.cookieLog.length}</li>`;
  document.getElementById('access-list').innerHTML = cookieSummary + (log.map(a => `<li>${escapeHtml(a.at)} - ${escapeHtml(a.user || 'usuario')}</li>`).join('') || '<li>Sin accesos.</li>');
  document.getElementById('family-list').innerHTML = state.people.map(p => `<li>${escapeHtml(p.name)} ${escapeHtml(p.lastName)} (${escapeHtml(p.treeName)})</li>`).join('');
  document.getElementById('photo-review-list').innerHTML = state.photoRequests.length ? '' : '<li>No hay fotos pendientes.</li>';
  state.photoRequests.forEach(r => document.getElementById('photo-review-list').innerHTML += `<li>${escapeHtml(r.personName)} <button data-approve="${r.personId}">Aprobar</button> <button data-deny="${r.personId}" class="secondary">Denegar</button></li>`);
  document.getElementById('pending-edits-list').innerHTML = state.pendingEdits.length ? '' : '<li>No hay cambios pendientes.</li>';
  state.pendingEdits.forEach(r => document.getElementById('pending-edits-list').innerHTML += `<li>${escapeHtml(r.personName)} (${escapeHtml(r.by)}) <button data-edit-approve="${r.id}">Aprobar</button> <button data-edit-deny="${r.id}" class="secondary">Denegar</button></li>`);
  document.getElementById('tree-requests-list').innerHTML = state.treeRequests.length ? '' : '<li>Sin solicitudes.</li>';
  state.treeRequests.forEach(r => document.getElementById('tree-requests-list').innerHTML += `<li>${escapeHtml(r.email)}: ${escapeHtml(r.reason)} <button data-tree-approve="${r.id}">Aceptar</button> <button data-tree-deny="${r.id}" class="secondary">Denegar</button></li>`);
  document.getElementById('pending-people-list').innerHTML = state.pendingPeople.length ? '' : '<li>Sin altas pendientes.</li>';
  state.pendingPeople.forEach(r => document.getElementById('pending-people-list').innerHTML += `<li>${escapeHtml(r.name)} ${escapeHtml(r.lastName)} (${escapeHtml(r.relation)}) <button data-person-approve="${r.id}">Aprobar</button> <button data-person-deny="${r.id}" class="secondary">Denegar</button></li>`);
  document.getElementById('reports-list').innerHTML = state.reports.length ? '' : '<li>Sin denuncias.</li>';
  state.reports.forEach(r => document.getElementById('reports-list').innerHTML += `<li>${escapeHtml(r.personName)} — ${escapeHtml(r.reason)} <button data-report-delete="${r.id}">Borrar persona</button> <button data-report-resolve="${r.id}" class="secondary">Resolver</button></li>`);
}

function isFamilyMatch(name, l1, l2) {
  const n = `${name} ${l1} ${l2}`.toLowerCase();
  return state.people.some(p => n.includes(p.name.toLowerCase()) || n.includes(p.lastName.toLowerCase()));
}

function createRelative(base, relationLabel) {
  const name = prompt(`Nombre del ${relationLabel}`);
  if (!name) return null;
  const lastName = prompt('Apellido') || '';
  const birth = prompt('Fecha nacimiento (YYYY-MM-DD) opcional') || '';
  return {
    id: crypto.randomUUID(),
    name,
    lastName,
    relation: relationLabel,
    treeName: base?.treeName || state.activeTreeName,
    locked: false,
    parentIds: [],
    spouseIds: [],
    details: { birth, death: '', location: '', events: '' },
    photo: '',
    approved: false
  };
}

function ensureParent(base, roleLabel) {
  const parent = createRelative(base, roleLabel);
  if (!parent) return null;
  state.people.push(parent);
  return parent.id;
}

document.getElementById('open-tree-search').addEventListener('click', () => {
  document.getElementById('tree-search-view').classList.remove('hidden');
  document.getElementById('my-trees-view').classList.add('hidden');
});

document.getElementById('open-my-trees').addEventListener('click', () => {
  document.getElementById('my-trees-view').classList.remove('hidden');
  document.getElementById('tree-search-view').classList.add('hidden');
  renderMyTrees();
});

document.getElementById('tree-search-btn').addEventListener('click', () => renderTreeSearchResults(document.getElementById('tree-search-input').value.trim()));

document.getElementById('create-tree-btn').addEventListener('click', () => {
  if (!state.currentUser) return;
  const name = document.getElementById('new-tree-name').value.trim();
  const trunk1Name = document.getElementById('new-tree-trunk1-name').value.trim();
  const trunk1Last = document.getElementById('new-tree-trunk1-last').value.trim();
  const trunk2Name = document.getElementById('new-tree-trunk2-name').value.trim();
  const trunk2Last = document.getElementById('new-tree-trunk2-last').value.trim();
  if (!name || !trunk1Name || !trunk1Last || !trunk2Name || !trunk2Last) return alert('Completa el nombre del árbol y los 2 nombres del tronco.');
  if (state.trees.some(t => t.name.toLowerCase() === name.toLowerCase())) return alert('Ese árbol ya existe.');
  const mine = state.trees.filter(t => t.ownerEmail === state.currentUser.email).length;
  if (mine >= 3) return alert('Límite alcanzado (3 árboles). Envía solicitud para más.');

  const trunk1 = {
    id: crypto.randomUUID(), name: trunk1Name, lastName: trunk1Last, relation: 'Ancestro principal', treeName: name,
    locked: true, parentIds: [], spouseIds: [], details: { birth: '', death: '', location: '', events: '' }, photo: '', approved: false
  };
  const trunk2 = {
    id: crypto.randomUUID(), name: trunk2Name, lastName: trunk2Last, relation: 'Ancestro principal', treeName: name,
    locked: true, parentIds: [], spouseIds: [], details: { birth: '', death: '', location: '', events: '' }, photo: '', approved: false
  };
  trunk1.spouseIds = [trunk2.id];
  trunk2.spouseIds = [trunk1.id];

  state.trees.push({ name, ownerEmail: state.currentUser.email, public: true, trunkIds: [trunk1.id, trunk2.id] });
  state.people.push(trunk1, trunk2);
  state.activeTreeName = name;

  logActivity(`Se creó el árbol ${name} con tronco inicial.`);
  saveAll();
  renderTreeSearchResults();
  renderMyTrees();
  populateSearchTreeFilter();
  renderTree();
  document.getElementById('new-tree-name').value = '';
  document.getElementById('new-tree-trunk1-name').value = '';
  document.getElementById('new-tree-trunk1-last').value = '';
  document.getElementById('new-tree-trunk2-name').value = '';
  document.getElementById('new-tree-trunk2-last').value = '';
  alert('Árbol creado y guardado en la base local con su tronco principal.');
});

document.getElementById('request-extra-tree-btn').addEventListener('click', () => {
  if (!state.currentUser) return;
  const reason = document.getElementById('tree-request-reason').value.trim();
  if (!reason) return;
  state.treeRequests.push({ id: crypto.randomUUID(), email: state.currentUser.email, reason });
  logActivity(`${state.currentUser.email} solicitó árbol extra`);
  saveAll();
  document.getElementById('tree-request-reason').value = '';
  alert('Solicitud enviada al creador.');
});

document.getElementById('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  data.email = String(data.email || '').trim().toLowerCase();
  if (!isValidEmail(data.email)) return authMessage.textContent = 'Gmail inválido.';
  if (!isStrongPassword(data.password) && data.password !== 'arbol18871885') return authMessage.textContent = 'La contraseña debe tener al menos 8 caracteres.';
  if (state.users.some(u => u.email === data.email)) return authMessage.textContent = 'Ya existe una cuenta con ese Gmail.';
  data.isCreator = isCreator(data);
  if (!(data.isCreator || isFamilyMatch(data.name, data.lastName1, data.lastName2) || data.password === 'arbol18871885')) return authMessage.textContent = 'Acceso denegado.';
  data.passwordHash = await hashPassword(data.password);
  data.passwordReminder = data.password;
  delete data.password;
  state.users.push(data);
  state.currentUser = { email: data.email, name: data.name, isCreator: data.isCreator };
  logActivity(`Nueva cuenta registrada: ${data.email}`);
  pushUserNotification(data.email, 'Correo de confirmación enviado automáticamente. Cuenta verificada.');
  updateNavVisibility();
  showMainMenu();
  saveAll();
  authMessage.textContent = 'Cuenta creada y sesión iniciada.';
  e.target.reset();
});

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const email = String(data.email || '').trim().toLowerCase();
  const user = state.users.find(u => u.email === email);
  if (!user) return authMessage.textContent = 'No hay cuenta para ese Gmail.';

  const codeEntry = state.codes[email];
  if (codeEntry) {
    if (Date.now() > codeEntry.expiresAt) {
      delete state.codes[email];
      saveAll();
      return authMessage.textContent = 'El código expiró. Solicita uno nuevo.';
    }
    if (codeEntry.attempts >= 5) return authMessage.textContent = 'Demasiados intentos con código. Solicita uno nuevo.';
    if (codeEntry.code !== data.code) {
      codeEntry.attempts += 1;
      saveAll();
      return authMessage.textContent = 'Código incorrecto.';
    }
  }

  const passwordHash = await hashPassword(data.password);
  const storedHash = user.passwordHash || (user.password ? await hashPassword(user.password) : '');
  if (passwordHash !== storedHash) return authMessage.textContent = 'Upss! Parece que te has equivocado de contraseña.';
  if (user.password) {
    user.passwordHash = storedHash;
    delete user.password;
  }
  delete state.codes[email];
  state.currentUser = { email: user.email, name: user.name, isCreator: user.isCreator };
  logActivity(`Inicio de sesión: ${user.email}`);
  const log = JSON.parse(localStorage.getItem('accessLog') || '[]');
  log.push({ at: new Date().toISOString(), user: `${user.name} ${user.lastName1}` });
  localStorage.setItem('accessLog', JSON.stringify(log));
  registerCookieUsage('login');
  updateNavVisibility();
  navState.history = [];
  if (user.isCreator) { showPanel('creator-dashboard', false); renderCreatorDashboard(); } else showMainMenu();
  saveAll();
});

document.getElementById('forgot-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPanel('forgot-password');
});

document.getElementById('forgot-send-btn')?.addEventListener('click', () => {
  const email = String(document.getElementById('forgot-email').value || '').trim().toLowerCase();
  const msg = document.getElementById('forgot-message');
  const user = state.users.find(u => u.email === email);
  if (!user) {
    msg.textContent = 'No existe una cuenta con ese Gmail y esos datos.';
    return;
  }
  const code = String(Math.floor(10000 + Math.random() * 90000));
  state.codes[email] = { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 };
  state.currentUser = { email: user.email, name: user.name, isCreator: user.isCreator };
  const reminder = user.passwordReminder || 'Tu contraseña está protegida, pide restablecerla al creador.';
  pushUserNotification(email, `Código de acceso automático: ${code}. Recordatorio de contraseña: ${reminder}`);
  logActivity(`Recuperación automática de acceso para ${email}`);
  updateNavVisibility();
  showMainMenu();
  saveAll();
  msg.textContent = `Código enviado a ${email}. Acceso automático concedido.`;
});

document.getElementById('person-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const name = document.getElementById('person-name').value;
  const lastName = document.getElementById('person-lastname').value;
  const relation = document.getElementById('person-relation').value;
  if (!confirm(`¿Confirmas que ${name} ${lastName} es familiar? El creador revisará la alta.`)) return;

  const activeTree = state.trees.find(t => t.name === state.activeTreeName);
  const defaultParents = relation === 'Hijo/a' ? [...(activeTree?.trunkIds || [])] : [];
  const entry = { id: crypto.randomUUID(), name, lastName, relation, treeName: state.activeTreeName, locked: false, parentIds: defaultParents, spouseIds: [], details: {}, photo: '', approved: false };
  if (state.currentUser?.isCreator) {
    state.people.push(entry);
    logActivity(`Se agregó una persona al árbol ${state.activeTreeName}`);
  } else {
    state.pendingPeople.push({ ...entry, by: state.currentUser.email });
    logActivity(`Alta familiar solicitada por ${state.currentUser.email}`);
    alert('Solicitud enviada al creador para aprobación.');
  }
  saveAll();
  renderTree();
  e.target.reset();
});

document.getElementById('info-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const person = state.people.find(p => (`${p.name} ${p.lastName}`).toLowerCase().includes(document.getElementById('info-name').value.toLowerCase()));
  if (!person) return alert('Persona no encontrada');
  const newDetails = { birth: document.getElementById('info-birth').value, death: document.getElementById('info-death').value, location: document.getElementById('info-location').value, events: document.getElementById('info-events').value };
  if (person.locked && !state.currentUser?.isCreator) {
    state.pendingEdits.push({ id: crypto.randomUUID(), personId: person.id, personName: `${person.name} ${person.lastName}`, by: state.currentUser?.email || 'usuario', newDetails });
    saveAll();
    return alert('Cambio enviado a revisión del creador.');
  }
  person.details = newDetails;
  logActivity(`Ficha actualizada: ${person.name} ${person.lastName}`);
  saveAll();
  showPerson(person.id);
});

document.getElementById('document-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const file = document.getElementById('doc-file').files[0];
  state.documents.push({ person: document.getElementById('doc-person').value, type: document.getElementById('doc-type').value, fileName: file ? file.name : '' });
  logActivity(`Documento cargado: ${document.getElementById('doc-type').value}`);
  saveAll();
  renderDocuments();
  e.target.reset();
});

document.getElementById('map-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  state.mapPoints.push({ people: document.getElementById('map-people').value.split(',').map(x => x.trim()).filter(Boolean), place: document.getElementById('map-place').value });
  logActivity(`Punto de mapa agregado: ${document.getElementById('map-place').value}`);
  saveAll();
  renderMapPoints();
  e.target.reset();
});

const hiddenUploader = document.createElement('input');
hiddenUploader.type = 'file';
hiddenUploader.accept = 'image/*';
hiddenUploader.hidden = true;
document.body.appendChild(hiddenUploader);
let selectedPersonId = null;

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.deletePerson) {
    if (!state.currentUser?.isCreator) return;
    state.people = state.people.filter(x => x.id !== t.dataset.deletePerson);
    document.getElementById('person-content').textContent = 'Integrante eliminado por el creador.';
    saveAll();
    renderTree();
    return;
  }
  if (t.dataset.openTree) {
    const tree = state.trees.find(x => x.name === t.dataset.openTree);
    if (tree) {
      state.activeTreeName = tree.name;
      logActivity(`Árbol abierto: ${tree.name}`);
      showMainMenu();
    }
    return;
  }
  if (t.dataset.approve) {
    if (!state.currentUser?.isCreator) return;
    const p = state.people.find(x => x.id === t.dataset.approve); if (p) p.approved = true;
    state.photoRequests = state.photoRequests.filter(x => x.personId !== t.dataset.approve); saveAll(); renderTree(); renderCreatorDashboard(); return;
  }
  if (t.dataset.deny) {
    if (!state.currentUser?.isCreator) return;
    const p = state.people.find(x => x.id === t.dataset.deny); if (p) { p.photo = ''; p.approved = false; }
    state.photoRequests = state.photoRequests.filter(x => x.personId !== t.dataset.deny); saveAll(); renderTree(); renderCreatorDashboard(); return;
  }
  if (t.dataset.editApprove) {
    if (!state.currentUser?.isCreator) return;
    const r = state.pendingEdits.find(x => x.id === t.dataset.editApprove); if (r) { const p = state.people.find(x => x.id === r.personId); if (p) p.details = r.newDetails; }
    state.pendingEdits = state.pendingEdits.filter(x => x.id !== t.dataset.editApprove); saveAll(); renderCreatorDashboard(); return;
  }
  if (t.dataset.editDeny) { if (!state.currentUser?.isCreator) return; state.pendingEdits = state.pendingEdits.filter(x => x.id !== t.dataset.editDeny); saveAll(); renderCreatorDashboard(); return; }
  if (t.dataset.treeApprove) { if (!state.currentUser?.isCreator) return; state.treeRequests = state.treeRequests.filter(x => x.id !== t.dataset.treeApprove); saveAll(); renderCreatorDashboard(); return; }
  if (t.dataset.treeDeny) { if (!state.currentUser?.isCreator) return; state.treeRequests = state.treeRequests.filter(x => x.id !== t.dataset.treeDeny); saveAll(); renderCreatorDashboard(); return; }
  if (t.dataset.personApprove) { if (!state.currentUser?.isCreator) return; const r = state.pendingPeople.find(x => x.id === t.dataset.personApprove); if (r) state.people.push({ ...r }); state.pendingPeople = state.pendingPeople.filter(x => x.id !== t.dataset.personApprove); saveAll(); renderTree(); renderCreatorDashboard(); return; }
  if (t.dataset.personDeny) { if (!state.currentUser?.isCreator) return; state.pendingPeople = state.pendingPeople.filter(x => x.id !== t.dataset.personDeny); saveAll(); renderCreatorDashboard(); return; }
  if (t.dataset.reportDelete) { if (!state.currentUser?.isCreator) return; const r = state.reports.find(x => x.id === t.dataset.reportDelete); if (r) state.people = state.people.filter(x => x.id !== r.personId); state.reports = state.reports.filter(x => x.id !== t.dataset.reportDelete); saveAll(); renderTree(); renderCreatorDashboard(); return; }
  if (t.dataset.reportResolve) { if (!state.currentUser?.isCreator) return; state.reports = state.reports.filter(x => x.id !== t.dataset.reportResolve); saveAll(); renderCreatorDashboard(); return; }
  if (t.dataset.photo) { selectedPersonId = t.dataset.photo; hiddenUploader.click(); return; }

  if (t.dataset.relative) {
    const base = state.people.find(p => p.id === t.dataset.relative);
    const relation = (prompt('Agregar: hermano, hijo, padre, madre, cónyuge o pareja') || '').toLowerCase().trim();
    if (!base || !relation) return;

    if (relation === 'hijo') {
      const child = createRelative(base, 'Hijo/a');
      if (!child) return;
      child.parentIds = [base.id, ...(base.spouseIds || [])];
      state.people.push(child);
    } else if (relation === 'padre' || relation === 'madre') {
      const parent = createRelative(base, relation === 'padre' ? 'Padre' : 'Madre');
      if (!parent) return;
      state.people.push(parent);
      base.parentIds = [...new Set([...(base.parentIds || []), parent.id])];
    } else if (relation === 'hermano') {
      const sibling = createRelative(base, 'Hermano/a');
      if (!sibling) return;
      let parentIds = [...(base.parentIds || [])];
      if (!parentIds.length) {
        const p1 = ensureParent(base, 'Padre');
        const p2 = ensureParent(base, 'Madre');
        parentIds = [p1, p2].filter(Boolean);
        base.parentIds = [...new Set([...(base.parentIds || []), ...parentIds])];
      }
      sibling.parentIds = [...new Set(parentIds)];
      state.people.push(sibling);
    } else if (relation === 'cónyuge' || relation === 'conyuge' || relation === 'pareja') {
      const spouse = createRelative(base, relation === 'pareja' ? 'Pareja' : 'Cónyuge');
      if (!spouse) return;
      spouse.spouseIds = [base.id];
      base.spouseIds = [...new Set([...(base.spouseIds || []), spouse.id])];
      state.people.push(spouse);
    } else {
      alert('Relación no reconocida. Usa: hermano, hijo, padre, madre, cónyuge o pareja.');
      return;
    }

    logActivity(`Se agregó relación (${relation}) en ${state.activeTreeName}`);
    saveAll();
    renderTree();
  }
});

hiddenUploader.addEventListener('change', () => {
  if (!selectedPersonId || !hiddenUploader.files[0]) return;
  const file = hiddenUploader.files[0];
  if (!file.type.startsWith('image/')) return alert('Solo se permiten imágenes.');
  if (file.size > 5 * 1024 * 1024) return alert('La imagen supera 5MB.');
  const reader = new FileReader();
  reader.onload = () => {
    const p = state.people.find(x => x.id === selectedPersonId); if (!p) return;
    p.photo = reader.result;
    state.photoRequests = state.photoRequests.filter(r => r.personId !== selectedPersonId);
    if (state.currentUser?.isCreator) {
      p.approved = true;
    } else {
      p.approved = false;
      state.photoRequests.push({ personId: selectedPersonId, personName: `${p.name} ${p.lastName}` });
    }
    logActivity(`Foto enviada a revisión: ${p.name} ${p.lastName}`);
    saveAll(); renderTree(); if (state.currentUser?.isCreator) renderCreatorDashboard();
  };
  reader.readAsDataURL(hiddenUploader.files[0]);
});

document.getElementById('search-btn').addEventListener('click', () => {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  const relationFilter = document.getElementById('search-relation')?.value || '';
  const treeFilter = document.getElementById('search-tree')?.value || '';
  const ul = document.getElementById('search-results');
  ul.innerHTML = '';
  state.people.filter(p => {
    const matchName = `${p.name} ${p.lastName}`.toLowerCase().includes(q);
    const matchRelation = !relationFilter || p.relation === relationFilter;
    const matchTree = !treeFilter || p.treeName === treeFilter;
    return matchName && matchRelation && matchTree;
  }).forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.name} ${r.lastName} — ${r.relation} (${r.treeName})`;
    li.addEventListener('click', () => showPerson(r.id));
    ul.appendChild(li);
  });
});

document.getElementById('report-btn')?.addEventListener('click', () => {
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const personName = document.getElementById('report-person').value.trim();
  const reason = document.getElementById('report-reason').value;
  if (!personName) return alert('Indica la persona.');
  const person = state.people.find(p => `${p.name} ${p.lastName}`.toLowerCase().includes(personName.toLowerCase()));
  if (!person) return alert('Persona no encontrada.');

  if (state.currentUser.isCreator) {
    state.people = state.people.filter(p => p.id !== person.id);
    alert('Persona eliminada automáticamente por denuncia del creador.');
  } else {
    state.reports.push({ id: crypto.randomUUID(), personId: person.id, personName: `${person.name} ${person.lastName}`, reason, by: state.currentUser.email });
    alert('Denuncia enviada al creador.');
  }
  logActivity(`Denuncia registrada: ${reason}`);
  saveAll();
  renderTree();
});

document.getElementById('send-warning').addEventListener('click', () => {
  if (!state.currentUser?.isCreator) return;
  const text = document.getElementById('creator-warning').value.trim();
  if (!text) return;
  state.creatorWarnings.push({ text, at: new Date().toISOString() });
  logActivity('El creador envió un aviso general');
  saveAll();
  document.getElementById('creator-warning').value = '';
});

document.getElementById('save-photos-policy').addEventListener('click', () => {
  if (!state.currentUser?.isCreator) return;
  state.policies.photos = document.getElementById('photos-policy-text').value; saveAll();
});

document.getElementById('save-cookies-policy').addEventListener('click', () => {
  if (!state.currentUser?.isCreator) return;
  state.policies.cookies = document.getElementById('cookies-policy-text').value; saveAll();
});

document.getElementById('download-tree-btn')?.addEventListener('click', () => {
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const visible = getVisiblePeople();
  const payload = {
    tree: state.activeTreeName,
    exportedAt: new Date().toISOString(),
    people: visible.map(p => ({ name: p.name, lastName: p.lastName, relation: p.relation, details: p.details }))
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arbol-${state.activeTreeName.replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('export-data-btn')?.addEventListener('click', () => {
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  const backup = {
    exportedAt: new Date().toISOString(),
    data: {
      trees: state.trees,
      people: state.people,
      documents: state.documents,
      users: state.users,
      creatorWarnings: state.creatorWarnings,
      photoRequests: state.photoRequests,
      pendingEdits: state.pendingEdits,
      treeRequests: state.treeRequests,
      mapPoints: state.mapPoints,
      policies: state.policies,
      activity: state.activity,
      userNotifications: state.userNotifications
    }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hereditas-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logActivity('Respaldo exportado');
  saveAll();
});

document.getElementById('import-data-input')?.addEventListener('change', (e) => {
  if (!state.currentUser?.isCreator) return alert('Solo el creador puede importar respaldos.');
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || '{}'));
      const data = payload.data || payload;
      const required = ['trees', 'people', 'documents', 'users'];
      if (!required.every(k => Array.isArray(data[k]))) throw new Error('Formato inválido');
      state.trees = data.trees;
      const legacyMain = state.trees.find(t => t.name === MAIN_TREE_NAME);
      if (legacyMain && !Array.isArray(legacyMain.trunkIds)) legacyMain.trunkIds = MAIN_TRUNK_IDS;
      state.people = data.people;
      state.documents = data.documents;
      state.users = data.users;
      state.creatorWarnings = Array.isArray(data.creatorWarnings) ? data.creatorWarnings : [];
      state.photoRequests = Array.isArray(data.photoRequests) ? data.photoRequests : [];
      state.pendingEdits = Array.isArray(data.pendingEdits) ? data.pendingEdits : [];
      state.treeRequests = Array.isArray(data.treeRequests) ? data.treeRequests : [];
      state.mapPoints = Array.isArray(data.mapPoints) ? data.mapPoints : [];
      state.activity = Array.isArray(data.activity) ? data.activity : [];
      state.userNotifications = data.userNotifications && typeof data.userNotifications === 'object' ? data.userNotifications : {};
      state.policies = data.policies && typeof data.policies === 'object' ? data.policies : state.policies;
      populateSearchTreeFilter();
      renderTreeSearchResults();
      renderTree();
      renderDocuments();
      renderMapPoints();
      renderInsights();
      logActivity('Respaldo importado por el creador');
      saveAll();
      alert('Respaldo importado correctamente.');
    } catch {
      alert('No se pudo importar el archivo. Verifica el formato JSON.');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
});

if (state.currentUser && !state.currentUser.isCreator && state.creatorWarnings.length) authMessage.textContent = `🔔 Tienes ${state.creatorWarnings.length} aviso(s) del creador.`;

if (!state.policies.photos) state.policies.photos = DEFAULT_PHOTOS_POLICY;
if (!state.policies.cookies) state.policies.cookies = DEFAULT_COOKIES_POLICY;
document.getElementById('photos-policy-text').value = state.policies.photos;
document.getElementById('cookies-policy-text').value = state.policies.cookies;
renderTreeSearchResults();
renderTree();
renderDocuments();
renderMapPoints();
populateSearchTreeFilter();
renderInsights();
renderNotifications();
updateCookieBanner();
updateNavVisibility();
navState.current = document.querySelector('.panel.active')?.id || navState.current;
document.body.classList.toggle('main-menu-background', navState.current === 'insights' && !!state.currentUser);
updateFloatingControls();
saveAll();

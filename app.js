const CREATOR_FULL_NAME = 'mateo braida navarro';
const MAIN_TREE_NAME = 'Rijo-Regueira';

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

const state = {
  trees: JSON.parse(localStorage.getItem('trees') || 'null') || [{ name: MAIN_TREE_NAME, ownerEmail: 'sistema', public: true }],
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
  policies: JSON.parse(localStorage.getItem('policies') || 'null') || {
    photos: 'Todas las fotos subidas por usuarios quedan en estado de revisión y deben ser aprobadas por el creador antes de publicarse.',
    cookies: 'Esta web usa cookies para registrar quién entra y cuándo accede.'
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
  Object.entries({ trees: state.trees, people: state.people, documents: state.documents, users: state.users, codes: state.codes, creatorWarnings: state.creatorWarnings, photoRequests: state.photoRequests, pendingEdits: state.pendingEdits, treeRequests: state.treeRequests, mapPoints: state.mapPoints, activity: state.activity, policies: state.policies }).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
}

function isCreator(user) {
  return `${user.name} ${user.lastName1} ${user.lastName2}`.toLowerCase().trim() === CREATOR_FULL_NAME;
}

function updateFloatingControls() {
  const logged = !!state.currentUser;
  const onMain = navState.current === 'tree';
  floatingLeft.classList.toggle('hidden', !logged || onMain);
  bellBtn.classList.toggle('hidden', !logged);
}

function showPanel(id, pushHistory = true) {
  if (pushHistory && navState.current && navState.current !== id) navState.history.push(navState.current);
  navState.current = id;
  panels.forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  updateFloatingControls();
}

function updateNavVisibility() {
  nav.classList.toggle('hidden-nav', !state.currentUser);
  nav.querySelector('[data-target="creator-dashboard"]').style.display = state.currentUser?.isCreator ? 'inline-block' : 'none';
}

document.querySelectorAll('.main-nav button, .policy-link').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    if (!state.currentUser && btn.dataset.target !== 'profile') return showPanel('profile');
    showPanel(btn.dataset.target);
    if (btn.dataset.target === 'creator-dashboard') renderCreatorDashboard();
    if (btn.dataset.target === 'maps') renderMapPoints();
    if (btn.dataset.target === 'insights') renderInsights();
  });
});

homeBtn.addEventListener('click', () => {
  navState.history = [];
  showPanel('tree', false);
});

backBtn.addEventListener('click', () => {
  const prev = navState.history.pop();
  if (prev) showPanel(prev, false);
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
  const notes = [];
  if (state.currentUser.isCreator) {
    notes.push(`Fotos pendientes: ${state.photoRequests.length}`);
    notes.push(`Cambios pendientes: ${state.pendingEdits.length}`);
    notes.push(`Solicitudes de árboles: ${state.treeRequests.length}`);
  }
  if (state.creatorWarnings.length) notes.push(`Avisos del creador: ${state.creatorWarnings.length}`);
  alert(notes.length ? notes.join('\n') : 'No tienes notificaciones nuevas.');
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
  const sorted = [...people].sort((a, b) => parseBirthYear(a) - parseBirthYear(b));
  const oldest = sorted[0];
  const trunk = new Set([oldest.id]);
  const spouse = oldest.spouseIds?.map(id => people.find(p => p.id === id)).find(Boolean);
  if (spouse) trunk.add(spouse.id);
  else if (sorted[1]) trunk.add(sorted[1].id);
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
  document.getElementById('access-list').innerHTML = log.map(a => `<li>${escapeHtml(a.at)} - ${escapeHtml(a.user || 'usuario')}</li>`).join('') || '<li>Sin accesos.</li>';
  document.getElementById('family-list').innerHTML = state.people.map(p => `<li>${escapeHtml(p.name)} ${escapeHtml(p.lastName)} (${escapeHtml(p.treeName)})</li>`).join('');
  document.getElementById('photo-review-list').innerHTML = state.photoRequests.length ? '' : '<li>No hay fotos pendientes.</li>';
  state.photoRequests.forEach(r => document.getElementById('photo-review-list').innerHTML += `<li>${escapeHtml(r.personName)} <button data-approve="${r.personId}">Aprobar</button> <button data-deny="${r.personId}" class="secondary">Denegar</button></li>`);
  document.getElementById('pending-edits-list').innerHTML = state.pendingEdits.length ? '' : '<li>No hay cambios pendientes.</li>';
  state.pendingEdits.forEach(r => document.getElementById('pending-edits-list').innerHTML += `<li>${escapeHtml(r.personName)} (${escapeHtml(r.by)}) <button data-edit-approve="${r.id}">Aprobar</button> <button data-edit-deny="${r.id}" class="secondary">Denegar</button></li>`);
  document.getElementById('tree-requests-list').innerHTML = state.treeRequests.length ? '' : '<li>Sin solicitudes.</li>';
  state.treeRequests.forEach(r => document.getElementById('tree-requests-list').innerHTML += `<li>${escapeHtml(r.email)}: ${escapeHtml(r.reason)} <button data-tree-approve="${r.id}">Aceptar</button> <button data-tree-deny="${r.id}" class="secondary">Denegar</button></li>`);
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


function buildQuickTrunkMembers(treeName) {
  const trunkConfigs = [
    {
      name: document.getElementById('quick-trunk1-name').value.trim(),
      lastName: document.getElementById('quick-trunk1-lastname').value.trim(),
      relation: document.getElementById('quick-trunk1-relation').value.trim() || 'Ancestro principal',
      birth: document.getElementById('quick-trunk1-birth').value
    },
    {
      name: document.getElementById('quick-trunk2-name').value.trim(),
      lastName: document.getElementById('quick-trunk2-lastname').value.trim(),
      relation: document.getElementById('quick-trunk2-relation').value.trim() || 'Ancestro principal',
      birth: document.getElementById('quick-trunk2-birth').value
    }
  ];

  const members = trunkConfigs
    .filter(cfg => cfg.name)
    .map(cfg => ({
      id: crypto.randomUUID(),
      name: cfg.name,
      lastName: cfg.lastName,
      relation: cfg.relation,
      treeName,
      locked: false,
      parentIds: [],
      spouseIds: [],
      details: { birth: cfg.birth || '', death: '', location: '', events: '' },
      photo: '',
      approved: false
    }));

  if (!members.length) return null;
  if (members.length === 2) {
    members[0].spouseIds = [members[1].id];
    members[1].spouseIds = [members[0].id];
  }
  return members;
}

function createTreesInstantly() {
  if (!state.currentUser) return alert('Debes iniciar sesión.');

  const requestedCount = Number(document.getElementById('quick-tree-count').value || 1);
  const rawNames = document.getElementById('quick-tree-names').value
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean);

  if (!rawNames.length) return alert('Escribe al menos un nombre de árbol.');

  const uniqueNames = [...new Set(rawNames)];
  if (uniqueNames.length !== rawNames.length) return alert('No repitas nombres en la creación instantánea.');

  if (uniqueNames.length !== requestedCount) {
    return alert(`Debes ingresar exactamente ${requestedCount} nombre(s) para crear los árboles seleccionados.`);
  }

  const ownedCount = state.trees.filter(t => t.ownerEmail === state.currentUser.email).length;
  const availableSlots = Math.max(0, 3 - ownedCount);
  if (requestedCount > availableSlots) {
    return alert(`Solo puedes crear ${availableSlots} árbol(es) más de forma directa. Máximo total: 3.`);
  }

  const normalizedExisting = new Set(state.trees.map(t => t.name.toLowerCase()));
  if (uniqueNames.some(n => normalizedExisting.has(n.toLowerCase()))) {
    return alert('Uno o más nombres ya existen. Usa nombres diferentes.');
  }

  const createdTrees = [];
  uniqueNames.forEach(treeName => {
    const trunkMembers = buildQuickTrunkMembers(treeName);
    if (!trunkMembers) return;

    state.trees.push({ name: treeName, ownerEmail: state.currentUser.email, public: true });
    state.people.push(...trunkMembers);
    createdTrees.push(treeName);
  });

  if (!createdTrees.length) return alert('Debes completar al menos el nombre del Tronco 1 para crear árboles.');

  state.activeTreeName = createdTrees[0];
  logActivity(`Creación instantánea: ${createdTrees.length} árbol(es) nuevos`);
  saveAll();
  renderTreeSearchResults();
  renderMyTrees();
  populateSearchTreeFilter();
  renderTree();
  alert(`Listo: se crearon ${createdTrees.length} árbol(es). Ahora puedes agregar más familiares al grupo completo.`);
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

document.getElementById('quick-create-trees-btn')?.addEventListener('click', createTreesInstantly);

document.getElementById('create-tree-btn').addEventListener('click', () => {
  if (!state.currentUser) return;
  const name = document.getElementById('new-tree-name').value.trim();
  if (!name) return;
  if (state.trees.some(t => t.name.toLowerCase() === name.toLowerCase())) return alert('Ese árbol ya existe.');
  const mine = state.trees.filter(t => t.ownerEmail === state.currentUser.email).length;
  if (mine >= 3) return alert('Límite alcanzado (3 árboles). Envía solicitud para más.');

  state.trees.push({ name, ownerEmail: state.currentUser.email, public: true });
  state.activeTreeName = name;

  const elder1 = createRelative({ treeName: name }, 'Ancestro principal');
  if (elder1) elder1.locked = true;
  const elder2 = createRelative({ treeName: name }, 'Ancestro principal');
  if (elder2) elder2.locked = true;
  if (elder1 && elder2) {
    elder1.spouseIds = [elder2.id];
    elder2.spouseIds = [elder1.id];
    state.people.push(elder1, elder2);
  } else if (elder1) {
    state.people.push(elder1);
  }

  logActivity(`Se creó el árbol ${name}`);
  saveAll();
  renderTreeSearchResults();
  renderMyTrees();
  populateSearchTreeFilter();
  renderTree();
  alert('Árbol creado. Los ancestros más antiguos quedaron en el tronco.');
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
  if (!(isFamilyMatch(data.name, data.lastName1, data.lastName2) || data.password === 'arbol18871885')) return authMessage.textContent = 'Acceso denegado.';
  data.isCreator = isCreator(data);
  data.passwordHash = await hashPassword(data.password);
  delete data.password;
  state.users.push(data);
  logActivity(`Nueva cuenta registrada: ${data.email}`);
  saveAll();
  authMessage.textContent = 'Cuenta creada correctamente.';
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
  if (passwordHash !== storedHash) return authMessage.textContent = 'Contraseña incorrecta.';
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
  updateNavVisibility();
  navState.history = [];
  if (user.isCreator) { showPanel('creator-dashboard', false); renderCreatorDashboard(); } else showPanel('tree', false);
  saveAll();
});

document.getElementById('forgot-btn').addEventListener('click', () => {
  const email = String(document.querySelector('#login-form input[name="email"]').value || '').trim().toLowerCase();
  if (!state.users.some(u => u.email === email)) return authMessage.textContent = 'Usuario no encontrado.';
  const code = String(Math.floor(10000 + Math.random() * 90000));
  state.codes[email] = { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 };
  saveAll();
  authMessage.textContent = `Código enviado a ${email}: ${code} (simulación local, vence en 10 minutos).`;
});

document.getElementById('person-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.currentUser) return alert('Debes iniciar sesión.');
  state.people.push({ id: crypto.randomUUID(), name: document.getElementById('person-name').value, lastName: document.getElementById('person-lastname').value, relation: document.getElementById('person-relation').value, treeName: state.activeTreeName, locked: false, parentIds: [], spouseIds: [], details: {}, photo: '', approved: false });
  logActivity(`Se agregó una persona al árbol ${state.activeTreeName}`);
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
  if (t.dataset.openTree) {
    const tree = state.trees.find(x => x.name === t.dataset.openTree);
    if (tree) {
      state.activeTreeName = tree.name;
      logActivity(`Árbol abierto: ${tree.name}`);
      showPanel('tree');
      renderTree();
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
    p.photo = reader.result; p.approved = false;
    state.photoRequests = state.photoRequests.filter(r => r.personId !== selectedPersonId);
    state.photoRequests.push({ personId: selectedPersonId, personName: `${p.name} ${p.lastName}` });
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
      activity: state.activity
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
      state.people = data.people;
      state.documents = data.documents;
      state.users = data.users;
      state.creatorWarnings = Array.isArray(data.creatorWarnings) ? data.creatorWarnings : [];
      state.photoRequests = Array.isArray(data.photoRequests) ? data.photoRequests : [];
      state.pendingEdits = Array.isArray(data.pendingEdits) ? data.pendingEdits : [];
      state.treeRequests = Array.isArray(data.treeRequests) ? data.treeRequests : [];
      state.mapPoints = Array.isArray(data.mapPoints) ? data.mapPoints : [];
      state.activity = Array.isArray(data.activity) ? data.activity : [];
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

document.getElementById('photos-policy-text').value = state.policies.photos;
document.getElementById('cookies-policy-text').value = state.policies.cookies;
renderTreeSearchResults();
renderTree();
renderDocuments();
renderMapPoints();
populateSearchTreeFilter();
renderInsights();
updateNavVisibility();
navState.current = document.querySelector('.panel.active')?.id || navState.current;
updateFloatingControls();
saveAll();

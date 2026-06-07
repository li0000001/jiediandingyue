// 管理员控制台 HTML 模板
// 通过 API 与后端交互：/api/admin/*

export const ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>V2Ray 订阅管理</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; color: #1f2937; background: #f3f4f6; }
  header { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
  header h1 { font-size: 18px; margin: 0; flex: 1; }
  header input { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; width: 220px; }
  header button { padding: 6px 14px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  header button.gray { background: #6b7280; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px 24px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat { background: white; padding: 14px 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
  .stat .l { font-size: 12px; color: #6b7280; }
  .stat .v { font-size: 24px; font-weight: 600; margin-top: 4px; }
  nav.tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
  nav.tabs button { padding: 10px 18px; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 14px; color: #6b7280; margin-bottom: -1px; }
  nav.tabs button.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 500; }
  .toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .toolbar button { padding: 6px 14px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .toolbar button.gray { background: #6b7280; }
  .toolbar button.danger { background: #dc2626; }
  table { width: 100%; background: white; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; vertical-align: top; }
  th { background: #f9fafb; font-weight: 600; color: #4b5563; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 500; }
  .badge.on { background: #d1fae5; color: #065f46; }
  .badge.off { background: #fee2e2; color: #991b1b; }
  .badge.expired { background: #fef3c7; color: #92400e; }
  td.uri, td.token { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .act-btn { padding: 3px 8px; margin-right: 4px; background: #6b7280; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; }
  .act-btn.primary { background: #2563eb; }
  .act-btn.danger { background: #dc2626; }
  .empty { color: #9ca3af; text-align: center; padding: 30px; }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: none; align-items: center; justify-content: center; z-index: 50; }
  .modal-bg.show { display: flex; }
  .modal { background: white; border-radius: 8px; padding: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow: auto; }
  .modal h2 { margin: 0 0 16px 0; font-size: 18px; }
  .form-row { margin-bottom: 12px; }
  .form-row label { display: block; font-size: 13px; color: #4b5563; margin-bottom: 4px; }
  .form-row input, .form-row textarea, .form-row select { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 4px; font: inherit; font-size: 13px; }
  .form-row textarea { font-family: ui-monospace, SFMono-Regular, monospace; min-height: 80px; resize: vertical; }
  .form-row .hint { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .form-row.checkbox { display: flex; align-items: center; gap: 6px; }
  .form-row.checkbox label { margin: 0; }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .modal-actions button { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .modal-actions .cancel { background: #e5e7eb; color: #1f2937; }
  .modal-actions .save { background: #2563eb; color: white; }
  .node-pick { max-height: 200px; overflow: auto; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; background: #f9fafb; }
  .node-pick label { display: flex; align-items: center; gap: 6px; padding: 4px 0; font-size: 13px; cursor: pointer; }
  .node-pick label.disabled { color: #9ca3af; }
  details { margin-bottom: 8px; }
  details summary { cursor: pointer; color: #4b5563; font-size: 13px; padding: 4px 0; }
  textarea.batch { width: 100%; min-height: 100px; font-family: ui-monospace, SFMono-Regular, monospace; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; }
  .toast { position: fixed; top: 20px; right: 20px; padding: 10px 16px; background: #1f2937; color: white; border-radius: 6px; font-size: 13px; opacity: 0; transition: opacity 0.2s; z-index: 100; }
  .toast.show { opacity: 1; }
  .toast.error { background: #dc2626; }
  .toast.success { background: #059669; }
</style>
</head>
<body>

<header>
  <h1>V2Ray 订阅管理</h1>
  <input id="token" type="password" placeholder="ADMIN_TOKEN">
  <button onclick="login()">登录</button>
  <button class="gray" onclick="logout()">退出</button>
</header>

<div class="container" id="app" style="display:none">
  <div class="stats">
    <div class="stat"><div class="l">节点总数</div><div class="v" id="s-nodes">-</div></div>
    <div class="stat"><div class="l">用户总数</div><div class="v" id="s-users">-</div></div>
    <div class="stat"><div class="l">活跃用户</div><div class="v" id="s-active">-</div></div>
    <div class="stat"><div class="l">已到期</div><div class="v" id="s-expired">-</div></div>
  </div>

  <nav class="tabs">
    <button id="tab-users" class="active" onclick="showTab('users')">用户</button>
    <button id="tab-nodes" onclick="showTab('nodes')">节点</button>
  </nav>

  <!-- Users tab -->
  <section id="pane-users">
    <div class="toolbar">
      <button onclick="openUserModal()">+ 新建用户</button>
      <button class="gray" onclick="loadUsers()">刷新</button>
    </div>
    <table>
      <thead><tr>
        <th>用户名</th>
        <th>Token</th>
        <th>状态</th>
        <th>到期</th>
        <th>已分配节点</th>
        <th>拉取</th>
        <th>操作</th>
      </tr></thead>
      <tbody id="users-body"></tbody>
    </table>
    <p id="users-empty" class="empty" style="display:none">还没有用户</p>
  </section>

  <!-- Nodes tab -->
  <section id="pane-nodes" style="display:none">
    <div class="toolbar">
      <button onclick="openNodeModal()">+ 新建节点</button>
      <button class="gray" onclick="openBulkModal()">批量导入</button>
      <button class="gray" onclick="loadNodes()">刷新</button>
    </div>
    <table>
      <thead><tr>
        <th>名称</th>
        <th>地区</th>
        <th>类型</th>
        <th>URI</th>
        <th>状态</th>
        <th>操作</th>
      </tr></thead>
      <tbody id="nodes-body"></tbody>
    </table>
    <p id="nodes-empty" class="empty" style="display:none">还没有节点</p>
  </section>
</div>

<div class="modal-bg" id="modal-bg">
  <div class="modal" id="modal-content"></div>
</div>

<div class="toast" id="toast"></div>

<script>
const API = '/api/admin';
let NODES = [];
let USERS = [];

function auth() { return { 'Authorization': 'Bearer ' + document.getElementById('token').value, 'Content-Type': 'application/json' }; }
function getToken() { return localStorage.getItem('adminToken') || ''; }
function setToken(t) { localStorage.setItem('adminToken', t); }

function toast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || '');
  setTimeout(() => { t.className = 'toast'; }, 2500);
}

async function api(method, path, body) {
  const opt = { method, headers: auth() };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(API + path, opt);
  if (r.status === 401) { document.getElementById('app').style.display = 'none'; toast('鉴权失败', 'error'); throw new Error('Unauthorized'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { toast(data.error || ('HTTP ' + r.status), 'error'); throw new Error(data.error || 'fail'); }
  return data;
}

function login() {
  setToken(document.getElementById('token').value);
  loadAll();
}

function logout() {
  localStorage.removeItem('adminToken');
  document.getElementById('token').value = '';
  document.getElementById('app').style.display = 'none';
}

function showTab(name) {
  document.getElementById('tab-users').classList.toggle('active', name === 'users');
  document.getElementById('tab-nodes').classList.toggle('active', name === 'nodes');
  document.getElementById('pane-users').style.display = name === 'users' ? '' : 'none';
  document.getElementById('pane-nodes').style.display = name === 'nodes' ? '' : 'none';
}

async function loadAll() {
  if (!getToken()) return;
  document.getElementById('token').value = getToken();
  document.getElementById('app').style.display = '';
  try {
    const [stats, nodes, users] = await Promise.all([
      api('GET', '/stats'),
      api('GET', '/nodes'),
      api('GET', '/users'),
    ]);
    document.getElementById('s-nodes').textContent = stats.total_nodes;
    document.getElementById('s-users').textContent = stats.total_users;
    document.getElementById('s-active').textContent = stats.active_users;
    document.getElementById('s-expired').textContent = stats.expired_users;
    NODES = nodes;
    USERS = users;
    renderNodes();
    renderUsers();
  } catch (e) { /* api() 已 toast */ }
}

async function loadNodes() {
  try { NODES = await api('GET', '/nodes'); renderNodes(); }
  catch (e) {}
}

async function loadUsers() {
  try { USERS = await api('GET', '/users'); renderUsers(); }
  catch (e) {}
}

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function nodeType(uri) {
  if (!uri) return '-';
  if (uri.startsWith('vmess://')) return 'VMess';
  if (uri.startsWith('vless://')) return 'VLess';
  if (uri.startsWith('trojan://')) return 'Trojan';
  if (uri.startsWith('ss://')) return 'SS';
  if (uri.startsWith('hysteria://')) return 'Hysteria';
  if (uri.startsWith('hysteria2://')) return 'Hy2';
  if (uri.startsWith('hy2://')) return 'Hy2';
  return '?';
}

function renderNodes() {
  const tbody = document.getElementById('nodes-body');
  tbody.innerHTML = '';
  document.getElementById('nodes-empty').style.display = NODES.length ? 'none' : 'block';
  for (const n of NODES) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(n.name) + '</td>' +
      '<td>' + esc(n.region || '-') + '</td>' +
      '<td>' + nodeType(n.uri) + '</td>' +
      '<td class="uri" title="' + esc(n.uri) + '">' + esc(n.uri) + '</td>' +
      '<td>' + (n.enabled ? '<span class="badge on">启用</span>' : '<span class="badge off">停用</span>') + '</td>' +
      '<td><button class="act-btn primary" onclick="openNodeModal(\\'' + esc(n.id) + '\\')">编辑</button>' +
      '<button class="act-btn" onclick="toggleNode(\\'' + esc(n.id) + '\\',' + (n.enabled ? '0' : '1') + ')">' + (n.enabled ? '停用' : '启用') + '</button>' +
      '<button class="act-btn danger" onclick="deleteNode(\\'' + esc(n.id) + '\\')">删除</button></td>';
    tbody.appendChild(tr);
  }
}

function renderUsers() {
  const tbody = document.getElementById('users-body');
  tbody.innerHTML = '';
  document.getElementById('users-empty').style.display = USERS.length ? 'none' : 'block';
  const now = Math.floor(Date.now() / 1000);
  for (const u of USERS) {
    let statusBadge;
    const expired = u.expiry > 0 && now > u.expiry;
    if (!u.enabled) statusBadge = '<span class="badge off">停用</span>';
    else if (expired) statusBadge = '<span class="badge expired">已到期</span>';
    else statusBadge = '<span class="badge on">正常</span>';
    const expiryText = u.expiry > 0 ? new Date(u.expiry * 1000).toLocaleDateString('zh-CN') : '永久';
    const assigned = u.assigned_nodes || 0;
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(u.username) + '</td>' +
      '<td class="token" title="' + esc(u.token) + '">' + esc(u.token) + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + esc(expiryText) + '</td>' +
      '<td>' + assigned + ' 个</td>' +
      '<td>' + (u.fetch_count || 0) + '</td>' +
      '<td><button class="act-btn primary" onclick="openUserModal(\\'' + esc(u.id) + '\\')">编辑</button>' +
      '<button class="act-btn" onclick="copyToken(\\'' + esc(u.token) + '\\')">复制</button>' +
      '<button class="act-btn" onclick="resetToken(\\'' + esc(u.id) + '\\')">重置</button>' +
      '<button class="act-btn danger" onclick="deleteUser(\\'' + esc(u.id) + '\\')">删除</button></td>';
    tbody.appendChild(tr);
  }
}

// ===== Modal =====
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-bg').classList.add('show');
}
function closeModal() {
  document.getElementById('modal-bg').classList.remove('show');
}
document.getElementById('modal-bg').addEventListener('click', (e) => {
  if (e.target.id === 'modal-bg') closeModal();
});

// ===== Node modal =====
function openNodeModal(id) {
  const n = id ? NODES.find(x => x.id === id) : null;
  const isEdit = !!n;
  const html = \`
    <h2>\${isEdit ? '编辑节点' : '新建节点'}</h2>
    <div class="form-row">
      <label>URI *</label>
      <textarea id="f-uri" placeholder="vless://uuid@host:443?security=tls&type=ws#name">\${isEdit ? esc(n.uri) : ''}</textarea>
    </div>
    <div class="form-row">
      <label>名称</label>
      <input id="f-name" value="\${isEdit ? esc(n.name) : ''}" placeholder="如：日本-SoftBank">
    </div>
    <div class="form-row">
      <label>地区</label>
      <input id="f-region" value="\${isEdit ? esc(n.region) : ''}" placeholder="如：JP / US / HK">
    </div>
    <div class="form-row checkbox">
      <input type="checkbox" id="f-enabled" \${(!n || n.enabled) ? 'checked' : ''}>
      <label for="f-enabled">启用</label>
    </div>
    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">取消</button>
      <button class="save" onclick="saveNode(\${isEdit ? '\\'' + esc(n.id) + '\\'' : 'null'})">保存</button>
    </div>
  \`;
  openModal(html);
}

async function saveNode(id) {
  const body = {
    uri: document.getElementById('f-uri').value.trim(),
    name: document.getElementById('f-name').value.trim(),
    region: document.getElementById('f-region').value.trim(),
    enabled: document.getElementById('f-enabled').checked,
  };
  if (!body.uri) { toast('URI 不能为空', 'error'); return; }
  try {
    if (id) await api('PUT', '/nodes/' + encodeURIComponent(id), body);
    else await api('POST', '/nodes', body);
    toast('已保存', 'success');
    closeModal();
    loadNodes();
  } catch (e) {}
}

async function toggleNode(id, enabled) {
  const n = NODES.find(x => x.id === id);
  if (!n) return;
  try {
    await api('PUT', '/nodes/' + encodeURIComponent(id), { ...n, enabled: !!enabled });
    toast('已更新', 'success');
    loadNodes();
  } catch (e) {}
}

async function deleteNode(id) {
  if (!confirm('确认删除该节点？所有用户对该节点的分配也会被移除。')) return;
  try { await api('DELETE', '/nodes/' + encodeURIComponent(id)); toast('已删除', 'success'); loadNodes(); loadUsers(); }
  catch (e) {}
}

// ===== Bulk import =====
function openBulkModal() {
  const html = \`
    <h2>批量导入节点</h2>
    <div class="form-row">
      <label>URI 列表（每行一个）</label>
      <textarea class="batch" id="f-batch" placeholder="vless://...&#10;vmess://...&#10;trojan://..."></textarea>
      <div class="hint">每行一个 URI，支持 vmess / vless / trojan / ss / hysteria / hysteria2 / hy2</div>
    </div>
    <div class="form-row">
      <label>默认地区（可选）</label>
      <input id="f-region" placeholder="留空则不设置">
    </div>
    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">取消</button>
      <button class="save" onclick="bulkImport()">导入</button>
    </div>
  \`;
  openModal(html);
}

async function bulkImport() {
  const text = document.getElementById('f-batch').value;
  const region = document.getElementById('f-region').value.trim();
  const uris = text.split(/\\r?\\n/).map(s => s.trim()).filter(s => /^(vmess|vless|trojan|ss|hysteria|hysteria2|hy2):\\/\\//.test(s));
  if (!uris.length) { toast('没有识别到合法 URI', 'error'); return; }
  try {
    const res = await api('POST', '/nodes/bulk', { uris: uris.map(uri => ({ uri, region })) });
    toast('已导入 ' + res.created + ' 个节点', 'success');
    closeModal();
    loadNodes();
  } catch (e) {}
}

// ===== User modal =====
function openUserModal(id) {
  const u = id ? USERS.find(x => x.id === id) : null;
  const isEdit = !!u;
  const expiryValue = u && u.expiry > 0 ? new Date(u.expiry * 1000).toISOString().slice(0, 10) : '';

  // Build node picker
  const nodeChecks = NODES.map(n => {
    const isAssigned = u && u.assigned_node_ids && u.assigned_node_ids.includes(n.id);
    return \`<label class="\${n.enabled ? '' : 'disabled'}">
      <input type="checkbox" data-node-id="\${esc(n.id)}" \${isAssigned ? 'checked' : ''} \${!n.enabled ? 'disabled' : ''}>
      \${esc(n.name || n.region || n.id)} \${n.region ? '[' + esc(n.region) + ']' : ''} \${!n.enabled ? '(已停用)' : ''}
    </label>\`;
  }).join('');

  const html = \`
    <h2>\${isEdit ? '编辑用户' : '新建用户'}</h2>
    <div class="form-row">
      <label>用户名 *</label>
      <input id="f-username" value="\${isEdit ? esc(u.username) : ''}" placeholder="如：alice">
    </div>
    <div class="form-row">
      <label>到期日期（留空 = 永久）</label>
      <input id="f-expiry" type="date" value="\${expiryValue}">
    </div>
    <div class="form-row">
      <label>备注</label>
      <input id="f-notes" value="\${isEdit ? esc(u.notes) : ''}" placeholder="可选">
    </div>
    <div class="form-row checkbox">
      <input type="checkbox" id="f-enabled" \${(!u || u.enabled) ? 'checked' : ''}>
      <label for="f-enabled">启用</label>
    </div>
    <div class="form-row">
      <label>分配节点（不选 = 可见所有启用节点）</label>
      <div class="node-pick">\${nodeChecks || '<div class="empty">还没有节点</div>'}</div>
      <div class="hint">已停用的节点不可分配</div>
    </div>
    <div class="modal-actions">
      <button class="cancel" onclick="closeModal()">取消</button>
      <button class="save" onclick="saveUser(\${isEdit ? '\\'' + esc(u.id) + '\\'' : 'null'})">保存</button>
    </div>
  \`;
  openModal(html);
}

async function saveUser(id) {
  const username = document.getElementById('f-username').value.trim();
  if (!username) { toast('用户名不能为空', 'error'); return; }
  const expiryStr = document.getElementById('f-expiry').value;
  const expiry = expiryStr ? Math.floor(new Date(expiryStr + 'T23:59:59').getTime() / 1000) : 0;
  const body = {
    username,
    enabled: document.getElementById('f-enabled').checked,
    expiry,
    notes: document.getElementById('f-notes').value.trim(),
  };
  try {
    let userId = id;
    if (id) {
      await api('PUT', '/users/' + encodeURIComponent(id), body);
    } else {
      const r = await api('POST', '/users', body);
      userId = r.id;
      toast('已创建，Token: ' + r.token, 'success');
    }
    // Save node assignment
    const nodeIds = Array.from(document.querySelectorAll('.node-pick input[type=checkbox]:checked'))
      .map(el => el.getAttribute('data-node-id'));
    await api('PUT', '/users/' + encodeURIComponent(userId) + '/nodes', { node_ids: nodeIds });
    if (id) toast('已保存', 'success');
    closeModal();
    loadUsers();
  } catch (e) {}
}

async function resetToken(id) {
  if (!confirm('重置 Token 后旧的订阅地址会失效，确定继续？')) return;
  try {
    const r = await api('POST', '/users/' + encodeURIComponent(id) + '/reset-token');
    toast('新 Token: ' + r.token, 'success');
    loadUsers();
  } catch (e) {}
}

async function deleteUser(id) {
  if (!confirm('确认删除该用户？')) return;
  try { await api('DELETE', '/users/' + encodeURIComponent(id)); toast('已删除', 'success'); loadUsers(); }
  catch (e) {}
}

function copyToken(t) {
  navigator.clipboard.writeText(t).then(() => toast('Token 已复制', 'success'));
}

// ===== Init =====
if (getToken()) {
  document.getElementById('token').value = getToken();
  loadAll();
}
</script>
</body>
</html>`;

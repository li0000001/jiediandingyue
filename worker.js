// V2Ray 订阅管理服务 - Cloudflare Workers + D1
// 功能：节点管理、用户系统、独立订阅地址、到期时间、订阅拉取统计
// 兼容：V2RayN / V2RayNG / Shadowrocket (base64) / Clash / Sing-box / Surge / Quantumult X

import { toBase64, toClash, toSingbox, toQuantumult } from './converters.js';
import { ADMIN_HTML } from './admin.html.js';
import { USER_HTML } from './user.html.js';

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      console.error('Error:', err);
      return new Response('Internal Error: ' + (err && err.message || err), {
        status: 500,
        headers: corsHeaders(),
      });
    }
  },
};

// =============== Utilities ===============

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function htmlResp(html) {
  return new Response(html, {
    headers: { ...corsHeaders(), 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function textResp(text, contentType = 'text/plain; charset=utf-8') {
  return new Response(text, {
    headers: { ...corsHeaders(), 'Content-Type': contentType },
  });
}

function requireAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_TOKEN}`;
}

function generateToken(len = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// =============== Routing ===============

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // /sub/<token>
  const subMatch = path.match(/^\/sub\/(.+)$/);
  if (subMatch) return handleSub(subMatch[1], url, env, request);

  if (path === '/' || path === '/sub') {
    return textResp('Use /sub/<your-token> to fetch subscription. Visit /admin for management.');
  }

  // /user/<token>
  const userMatch = path.match(/^\/user\/([^\/]+)$/);
  if (userMatch) return handleUserPage(userMatch[1], env);

  const userInfoMatch = path.match(/^\/user\/([^\/]+)\/info\.json$/);
  if (userInfoMatch) return handleUserInfo(userInfoMatch[1], env);

  // /admin
  if (path === '/admin') return htmlResp(ADMIN_HTML);

  // /api/admin/*
  if (path.startsWith('/api/admin/')) return handleAdminApi(request, env, path);

  return new Response('Not Found', { status: 404, headers: corsHeaders() });
}

// =============== Public: Subscription ===============

async function handleSub(token, url, env, request) {
  const user = await getUserByToken(env, token);
  if (!user) return new Response('Invalid token', { status: 404, headers: corsHeaders() });
  if (!user.enabled) return new Response('User disabled', { status: 403, headers: corsHeaders() });

  const now = Math.floor(Date.now() / 1000);
  if (user.expiry > 0 && now > user.expiry) {
    return new Response('Subscription expired', { status: 403, headers: corsHeaders() });
  }

  const nodes = await getUserNodes(env, user);
  const enabledNodes = nodes.filter(n => n.enabled);

  // Fire-and-forget stats
  env.DB.prepare(
    'UPDATE users SET fetch_count = fetch_count + 1, last_fetch_at = ? WHERE id = ?'
  ).bind(now, user.id).run().catch(() => {});

  // Format
  const formatParam = (url.searchParams.get('format') || 'auto').toLowerCase();
  let format = formatParam;
  if (format === 'auto') {
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    if (/clash|mihomo|stash/.test(ua)) format = 'clash';
    else if (/sing-box|singbox/.test(ua)) format = 'singbox';
    else if (/quantumult/.test(ua)) format = 'quantumult';
    else if (/surge/.test(ua)) format = 'surge';
    else format = 'v2ray';
  }

  let body, contentType;
  switch (format) {
    case 'clash':
    case 'surge':
      body = toClash(enabledNodes);
      contentType = 'text/yaml; charset=utf-8';
      break;
    case 'singbox':
    case 'sing-box':
      body = toSingbox(enabledNodes);
      contentType = 'application/json; charset=utf-8';
      break;
    case 'quantumult':
      body = toQuantumult(enabledNodes);
      contentType = 'text/plain; charset=utf-8';
      break;
    case 'v2ray':
    case 'base64':
    default:
      body = toBase64(enabledNodes);
      contentType = 'text/plain; charset=utf-8';
  }

  return new Response(body, {
    headers: {
      ...corsHeaders(),
      'Content-Type': contentType,
      'Profile-Update-Interval': '6',
      'Subscription-Userinfo': `upload=0; download=0; total=0; expire=${user.expiry || 0}`,
    },
  });
}

// =============== Public: User Self-service ===============

async function handleUserPage(token, env) {
  const user = await getUserByToken(env, token);
  if (!user) return htmlResp('<!DOCTYPE html><meta charset=utf-8><h1>无效的 Token</h1>');

  const nodes = await getUserNodes(env, user);
  const enabledNodes = nodes.filter(n => n.enabled);

  const now = Math.floor(Date.now() / 1000);
  let status, statusText;
  if (!user.enabled) {
    status = 'disabled';
    statusText = '已停用';
  } else if (user.expiry > 0 && now > user.expiry) {
    status = 'expired';
    statusText = '已到期';
  } else if (user.expiry > 0) {
    const days = Math.max(0, Math.ceil((user.expiry - now) / 86400));
    status = 'active';
    statusText = `剩余 ${days} 天`;
  } else {
    status = 'active';
    statusText = '永久有效';
  }

  const expiryText = user.expiry > 0 ? new Date(user.expiry * 1000).toLocaleString('zh-CN') : '永久';
  const lastFetchText = user.last_fetch_at > 0 ? new Date(user.last_fetch_at * 1000).toLocaleString('zh-CN') : '从未';
  const nodesHtml = enabledNodes.length
    ? enabledNodes.map(n =>
        `<li><span class="region">${escHtml(n.region || '—')}</span><span>${escHtml(n.name || '未命名')}</span></li>`
      ).join('')
    : '<li class="empty">暂无可用节点</li>';

  const html = USER_HTML
    .replace(/__USERNAME__/g, escHtml(user.username))
    .replace(/__TOKEN__/g, escHtml(token))
    .replace(/__STATUS__/g, status)
    .replace(/__STATUS_TEXT__/g, escHtml(statusText))
    .replace(/__EXPIRY__/g, escHtml(expiryText))
    .replace(/__NODE_COUNT__/g, String(enabledNodes.length))
    .replace(/__FETCH_COUNT__/g, String(user.fetch_count))
    .replace(/__LAST_FETCH__/g, escHtml(lastFetchText))
    .replace(/__NOTES__/g, escHtml(user.notes || ''))
    .replace(/__NODES_HTML__/g, nodesHtml);

  return htmlResp(html);
}

async function handleUserInfo(token, env) {
  const user = await getUserByToken(env, token);
  if (!user) return jsonResp({ error: 'not found' }, 404);
  const nodes = await getUserNodes(env, user);
  const now = Math.floor(Date.now() / 1000);
  return jsonResp({
    username: user.username,
    enabled: !!user.enabled,
    expired: user.expiry > 0 ? now > user.expiry : false,
    expiry: user.expiry || null,
    days_remaining: user.expiry > 0 ? Math.max(0, Math.ceil((user.expiry - now) / 86400)) : null,
    node_count: nodes.filter(n => n.enabled).length,
    fetch_count: user.fetch_count,
    last_fetch_at: user.last_fetch_at || null,
  });
}

// =============== Admin API ===============

async function handleAdminApi(request, env, path) {
  if (!requireAdmin(request, env)) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders() });
  }

  // Stats
  if (path === '/api/admin/stats' && request.method === 'GET') {
    const [nodes, users, active, expired] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as c FROM nodes').first(),
      env.DB.prepare('SELECT COUNT(*) as c FROM users').first(),
      env.DB.prepare('SELECT COUNT(*) as c FROM users WHERE enabled = 1').first(),
      env.DB.prepare('SELECT COUNT(*) as c FROM users WHERE expiry > 0 AND expiry < ?').bind(Math.floor(Date.now() / 1000)).first(),
    ]);
    return jsonResp({
      total_nodes: nodes?.c || 0,
      total_users: users?.c || 0,
      active_users: active?.c || 0,
      expired_users: expired?.c || 0,
    });
  }

  // Nodes
  if (path === '/api/admin/nodes') {
    if (request.method === 'GET') return listNodes(env);
    if (request.method === 'POST') return createNode(request, env);
  }
  if (path === '/api/admin/nodes/bulk' && request.method === 'POST') {
    return bulkCreateNodes(request, env);
  }
  const nodeMatch = path.match(/^\/api\/admin\/nodes\/([^\/]+)$/);
  if (nodeMatch) {
    const id = decodeURIComponent(nodeMatch[1]);
    if (request.method === 'GET') return getNode(id, env);
    if (request.method === 'PUT') return updateNode(id, request, env);
    if (request.method === 'DELETE') return deleteNode(id, env);
  }

  // Users
  if (path === '/api/admin/users') {
    if (request.method === 'GET') return listUsers(env);
    if (request.method === 'POST') return createUser(request, env);
  }
  const userMatch = path.match(/^\/api\/admin\/users\/([^\/]+)$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1]);
    if (request.method === 'GET') return getUser(id, env);
    if (request.method === 'PUT') return updateUser(id, request, env);
    if (request.method === 'DELETE') return deleteUser(id, env);
  }
  const resetMatch = path.match(/^\/api\/admin\/users\/([^\/]+)\/reset-token$/);
  if (resetMatch && request.method === 'POST') {
    return resetUserToken(resetMatch[1], env);
  }
  const userNodesMatch = path.match(/^\/api\/admin\/users\/([^\/]+)\/nodes$/);
  if (userNodesMatch) {
    const id = decodeURIComponent(userNodesMatch[1]);
    if (request.method === 'GET') return getUserNodeIds(id, env);
    if (request.method === 'PUT') return setUserNodes(id, request, env);
  }

  return jsonResp({ error: 'not found' }, 404);
}

async function listNodes(env) {
  const r = await env.DB.prepare('SELECT * FROM nodes ORDER BY sort_order, created_at').all();
  return jsonResp(r.results || []);
}

async function getNode(id, env) {
  const n = await env.DB.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first();
  if (!n) return jsonResp({ error: 'not found' }, 404);
  return jsonResp(n);
}

async function createNode(request, env) {
  const body = await request.json();
  if (!body.uri) return jsonResp({ error: 'uri required' }, 400);
  const id = body.id || generateId();
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare(
    'INSERT INTO nodes (id, uri, name, region, enabled, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, body.uri, body.name || '', body.region || '',
    body.enabled === false ? 0 : 1,
    body.sort_order || 0, now
  ).run();
  const n = await env.DB.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first();
  return jsonResp(n, 201);
}

async function bulkCreateNodes(request, env) {
  const body = await request.json();
  const list = Array.isArray(body) ? body : (Array.isArray(body.uris) ? body.uris : null);
  if (!list) return jsonResp({ error: 'array or {uris:[]} required' }, 400);
  const now = Math.floor(Date.now() / 1000);
  const ids = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || !item.uri) continue;
    const id = item.id || generateId();
    try {
      await env.DB.prepare(
        'INSERT INTO nodes (id, uri, name, region, enabled, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, item.uri, item.name || '', item.region || '',
        item.enabled === false ? 0 : 1,
        item.sort_order ?? i, now
      ).run();
      ids.push(id);
    } catch (e) {
      // skip duplicates
    }
  }
  return jsonResp({ created: ids.length, ids });
}

async function updateNode(id, request, env) {
  const body = await request.json();
  const existing = await env.DB.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first();
  if (!existing) return jsonResp({ error: 'not found' }, 404);
  await env.DB.prepare(
    'UPDATE nodes SET uri = ?, name = ?, region = ?, enabled = ?, sort_order = ? WHERE id = ?'
  ).bind(
    body.uri ?? existing.uri,
    body.name ?? existing.name,
    body.region ?? existing.region,
    body.enabled === undefined ? existing.enabled : (body.enabled ? 1 : 0),
    body.sort_order ?? existing.sort_order,
    id
  ).run();
  const n = await env.DB.prepare('SELECT * FROM nodes WHERE id = ?').bind(id).first();
  return jsonResp(n);
}

async function deleteNode(id, env) {
  const r = await env.DB.prepare('DELETE FROM nodes WHERE id = ?').bind(id).run();
  if (!r.meta || !r.meta.changes) return jsonResp({ error: 'not found' }, 404);
  return jsonResp({ ok: true });
}

async function listUsers(env) {
  const r = await env.DB.prepare(`
    SELECT
      u.*,
      COUNT(un.node_id) AS assigned_nodes,
      COALESCE(GROUP_CONCAT(un.node_id), '') AS assigned_node_ids_csv
    FROM users u
    LEFT JOIN user_nodes un ON u.id = un.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  const users = (r.results || []).map(u => {
    const ids = u.assigned_node_ids_csv
      ? String(u.assigned_node_ids_csv).split(',').filter(Boolean)
      : [];
    delete u.assigned_node_ids_csv;
    u.assigned_node_ids = ids;
    u.assigned_nodes = ids.length;
    return u;
  });
  return jsonResp(users);
}

async function getUser(id, env) {
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!u) return jsonResp({ error: 'not found' }, 404);
  const r = await env.DB.prepare('SELECT node_id FROM user_nodes WHERE user_id = ?').bind(id).all();
  u.assigned_node_ids = (r.results || []).map(n => n.node_id);
  return jsonResp(u);
}

async function createUser(request, env) {
  const body = await request.json();
  if (!body.username) return jsonResp({ error: 'username required' }, 400);
  const id = body.id || generateId();
  const token = body.token || generateToken(20);
  const now = Math.floor(Date.now() / 1000);
  const expiry = body.expiry || 0;
  try {
    await env.DB.prepare(
      'INSERT INTO users (id, username, token, enabled, expiry, notes, fetch_count, last_fetch_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)'
    ).bind(
      id, body.username, token,
      body.enabled === false ? 0 : 1,
      expiry, body.notes || '', now
    ).run();
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return jsonResp({ error: 'username or token already exists' }, 400);
    }
    throw e;
  }
  if (Array.isArray(body.node_ids)) {
    for (const nid of body.node_ids) {
      await env.DB.prepare(
        'INSERT OR IGNORE INTO user_nodes (user_id, node_id) VALUES (?, ?)'
      ).bind(id, nid).run();
    }
  }
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  u.assigned_node_ids = body.node_ids || [];
  return jsonResp(u, 201);
}

async function updateUser(id, request, env) {
  const body = await request.json();
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!existing) return jsonResp({ error: 'not found' }, 404);
  await env.DB.prepare(
    'UPDATE users SET username = ?, enabled = ?, expiry = ?, notes = ? WHERE id = ?'
  ).bind(
    body.username ?? existing.username,
    body.enabled === undefined ? existing.enabled : (body.enabled ? 1 : 0),
    body.expiry ?? existing.expiry,
    body.notes ?? existing.notes,
    id
  ).run();
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return jsonResp(u);
}

async function deleteUser(id, env) {
  const r = await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  if (!r.meta || !r.meta.changes) return jsonResp({ error: 'not found' }, 404);
  return jsonResp({ ok: true });
}

async function resetUserToken(id, env) {
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!u) return jsonResp({ error: 'not found' }, 404);
  const newToken = generateToken(20);
  await env.DB.prepare('UPDATE users SET token = ? WHERE id = ?').bind(newToken, id).run();
  return jsonResp({ id, token: newToken });
}

async function getUserNodeIds(id, env) {
  const r = await env.DB.prepare('SELECT node_id FROM user_nodes WHERE user_id = ?').bind(id).all();
  return jsonResp((r.results || []).map(n => n.node_id));
}

async function setUserNodes(id, request, env) {
  const body = await request.json();
  if (!Array.isArray(body.node_ids)) return jsonResp({ error: 'node_ids array required' }, 400);
  const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  if (!u) return jsonResp({ error: 'user not found' }, 404);

  const nodeIds = [...new Set(body.node_ids.map(String).filter(Boolean))];
  if (nodeIds.length) {
    const placeholders = nodeIds.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT id FROM nodes WHERE id IN (${placeholders})`
    ).bind(...nodeIds).all();
    const existingIds = new Set((existing.results || []).map(n => n.id));
    const missing = nodeIds.filter(nid => !existingIds.has(nid));
    if (missing.length) return jsonResp({ error: 'node not found', node_ids: missing }, 400);
  }

  const statements = [
    env.DB.prepare('DELETE FROM user_nodes WHERE user_id = ?').bind(id),
    ...nodeIds.map(nid =>
      env.DB.prepare('INSERT INTO user_nodes (user_id, node_id) VALUES (?, ?)').bind(id, nid)
    ),
  ];
  await env.DB.batch(statements);
  return jsonResp({ ok: true, count: nodeIds.length });
}

// =============== DB Helpers ===============

async function getUserByToken(env, token) {
  return await env.DB.prepare('SELECT * FROM users WHERE token = ?').bind(token).first();
}

async function getUserNodes(env, user) {
  const r = await env.DB.prepare(`
    SELECT n.* FROM nodes n
    INNER JOIN user_nodes un ON n.id = un.node_id
    WHERE un.user_id = ?
    ORDER BY n.sort_order, n.created_at
  `).bind(user.id).all();
  if (r.results && r.results.length > 0) return r.results;
  const all = await env.DB.prepare(
    'SELECT * FROM nodes WHERE enabled = 1 ORDER BY sort_order, created_at'
  ).all();
  return all.results || [];
}

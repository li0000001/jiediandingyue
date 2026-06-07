// 用户自助页 HTML 模板
// 占位符：{{USERNAME}} {{TOKEN}} {{STATUS}} {{STATUS_TEXT}} {{EXPIRY}} {{NODE_COUNT}} {{FETCH_COUNT}} {{LAST_FETCH}} {{NOTES}} {{NODES_HTML}}

export const USER_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__USERNAME__ - 订阅</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 720px; margin: 30px auto; padding: 0 20px; color: #1f2937; background: #fff; }
  h1 { font-size: 24px; margin: 0 0 16px 0; }
  h3 { font-size: 14px; color: #4b5563; margin: 0 0 10px 0; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .status { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 500; }
  .status.active { background: #d1fae5; color: #065f46; }
  .status.disabled { background: #fee2e2; color: #991b1b; }
  .status.expired { background: #fef3c7; color: #92400e; }
  .notes { color: #6b7280; font-size: 13px; margin: 8px 0 0 0; white-space: pre-wrap; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; }
  .row .value { font-weight: 500; }
  .url { display: flex; align-items: center; gap: 8px; padding: 10px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 6px; }
  .url .tag { font-size: 11px; color: #6b7280; min-width: 56px; }
  .url code { flex: 1; font-size: 12px; word-break: break-all; font-family: ui-monospace, SFMono-Regular, monospace; }
  .url button { padding: 4px 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
  ul.nodes { list-style: none; padding: 0; margin: 0; }
  ul.nodes li { padding: 8px 10px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 4px; font-size: 13px; display: flex; align-items: center; gap: 10px; }
  ul.nodes li.empty { color: #9ca3af; justify-content: center; }
  .region { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-size: 11px; color: #374151; min-width: 30px; text-align: center; }
  .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
</style>
</head>
<body>
<h1>__USERNAME__</h1>

<div class="card">
  <span class="status __STATUS__">__STATUS_TEXT__</span>
  <p class="notes">__NOTES__</p>
</div>

<div class="card">
  <h3>订阅地址</h3>
  <div class="url"><span class="tag">Auto</span><code id="u-auto">__BASE__/sub/__TOKEN__</code><button onclick="cp('u-auto', this)">复制</button></div>
  <div class="url"><span class="tag">V2RayN</span><code id="u-v2">__BASE__/sub/__TOKEN__?format=v2ray</code><button onclick="cp('u-v2', this)">复制</button></div>
  <div class="url"><span class="tag">Clash</span><code id="u-cl">__BASE__/sub/__TOKEN__?format=clash</code><button onclick="cp('u-cl', this)">复制</button></div>
  <div class="url"><span class="tag">Sing-box</span><code id="u-sb">__BASE__/sub/__TOKEN__?format=singbox</code><button onclick="cp('u-sb', this)">复制</button></div>
  <div class="url"><span class="tag">Surge</span><code id="u-su">__BASE__/sub/__TOKEN__?format=surge</code><button onclick="cp('u-su', this)">复制</button></div>
  <div class="url"><span class="tag">Quantumult</span><code id="u-qx">__BASE__/sub/__TOKEN__?format=quantumult</code><button onclick="cp('u-qx', this)">复制</button></div>
</div>

<div class="card">
  <h3>账户信息</h3>
  <div class="row"><span class="label">到期时间</span><span class="value">__EXPIRY__</span></div>
  <div class="row"><span class="label">可用节点</span><span class="value">__NODE_COUNT__ 个</span></div>
  <div class="row"><span class="label">订阅拉取</span><span class="value">__FETCH_COUNT__ 次</span></div>
  <div class="row"><span class="label">最近使用</span><span class="value">__LAST_FETCH__</span></div>
</div>

<div class="card">
  <h3>可用节点</h3>
  <ul class="nodes">__NODES_HTML__</ul>
</div>

<div class="footer">由 v2ray-sub 提供服务</div>

<script>
  const ORIGIN = location.origin;
  document.querySelectorAll('code').forEach(el => { el.textContent = el.textContent.replace('__BASE__', ORIGIN); });
  function cp(id, btn) {
    const text = document.getElementById(id).textContent;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    }).catch(() => {
      prompt('复制失败，手动复制：', text);
    });
  }
</script>
</body>
</html>`;

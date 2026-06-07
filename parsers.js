// URI parsers - 把代理 URI 解析成结构化数据

export function parseNode(node) {
  if (!node || typeof node.uri !== 'string') return null;
  const u = node.uri;
  if (u.startsWith('vmess://')) return parseVmess(u);
  if (u.startsWith('vless://')) return parseVless(u);
  if (u.startsWith('trojan://')) return parseTrojan(u);
  if (u.startsWith('ss://')) return parseSs(u);
  if (u.startsWith('hysteria://') || u.startsWith('hysteria2://') || u.startsWith('hy2://')) return parseHy(u);
  return null;
}

function parseVmess(uri) {
  try {
    const b64 = uri.slice(8);
    const json = JSON.parse(atob(b64));
    return {
      type: 'vmess',
      name: json.ps || 'vmess',
      server: json.add,
      port: +json.port,
      uuid: json.id,
      alterId: +(json.aid || 0),
      cipher: json.scy || 'auto',
      tls: json.tls === 'tls' || json.tls === 'reality',
      sni: json.sni || json.host || json.add,
      network: json.net || 'tcp',
      wsPath: json.path || '/',
      wsHost: json.host || json.add,
    };
  } catch { return null; }
}

function parseVless(uri) {
  try {
    const u = new URL(uri);
    return {
      type: 'vless',
      name: decodeURIComponent(u.hash.slice(1)) || 'vless',
      server: u.hostname,
      port: +u.port,
      uuid: u.username,
      flow: u.searchParams.get('flow') || '',
      network: u.searchParams.get('type') || 'tcp',
      security: u.searchParams.get('security') || 'none',
      sni: u.searchParams.get('sni') || u.hostname,
      fp: u.searchParams.get('fp') || '',
      wsPath: u.searchParams.get('path') || '/',
      wsHost: u.searchParams.get('host') || u.hostname,
      realityPbk: u.searchParams.get('pbk') || '',
      realitySid: u.searchParams.get('sid') || '',
    };
  } catch { return null; }
}

function parseTrojan(uri) {
  try {
    const u = new URL(uri);
    return {
      type: 'trojan',
      name: decodeURIComponent(u.hash.slice(1)) || 'trojan',
      server: u.hostname,
      port: +u.port,
      password: decodeURIComponent(u.username),
      sni: u.searchParams.get('sni') || u.searchParams.get('peer') || u.hostname,
      allowInsecure: u.searchParams.get('allowInsecure') === '1' || u.searchParams.get('allowinsecure') === '1',
      network: u.searchParams.get('type') || 'tcp',
      wsPath: u.searchParams.get('path') || '/',
      wsHost: u.searchParams.get('host') || u.hostname,
    };
  } catch { return null; }
}

function parseSs(uri) {
  try {
    const noScheme = uri.slice(5);
    const hashIdx = noScheme.indexOf('#');
    const name = hashIdx >= 0 ? decodeURIComponent(noScheme.slice(hashIdx + 1)) : 'ss';
    const body = hashIdx >= 0 ? noScheme.slice(0, hashIdx) : noScheme;
    let method, password, server, port;
    if (body.includes('@')) {
      const atIdx = body.indexOf('@');
      const userInfo = body.slice(0, atIdx);
      const hostPart = body.slice(atIdx + 1);
      try {
        const decoded = atob(userInfo);
        const i = decoded.indexOf(':');
        method = decoded.slice(0, i);
        password = decoded.slice(i + 1);
      } catch {
        const i = userInfo.indexOf(':');
        method = decodeURIComponent(userInfo.slice(0, i));
        password = decodeURIComponent(userInfo.slice(i + 1));
      }
      const pi = hostPart.lastIndexOf(':');
      server = hostPart.slice(0, pi);
      port = hostPart.slice(pi + 1);
    } else {
      const decoded = atob(body);
      const atIdx = decoded.lastIndexOf('@');
      const userInfo = decoded.slice(0, atIdx);
      const hostPart = decoded.slice(atIdx + 1);
      const i = userInfo.indexOf(':');
      method = userInfo.slice(0, i);
      password = userInfo.slice(i + 1);
      const pi = hostPart.lastIndexOf(':');
      server = hostPart.slice(0, pi);
      port = hostPart.slice(pi + 1);
    }
    return { type: 'ss', name, server, port: +port, method, password };
  } catch { return null; }
}

function parseHy(uri) {
  try {
    const u = new URL(uri);
    return {
      type: (uri.startsWith('hy2://') || uri.startsWith('hysteria2://')) ? 'hy2' : 'hysteria',
      name: decodeURIComponent(u.hash.slice(1)) || 'hy',
      server: u.hostname,
      port: +u.port,
      password: u.username || u.searchParams.get('password') || '',
      sni: u.searchParams.get('sni') || u.searchParams.get('peer') || u.hostname,
      obfs: u.searchParams.get('obfs') || '',
      insecure: u.searchParams.get('insecure') === '1',
    };
  } catch { return null; }
}

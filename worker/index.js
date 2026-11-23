import { aggregateResponses, validAnswers } from './aggregate.js';

function corsOrigin(request, env) {
  const requestOrigin = request.headers.get('origin');
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!requestOrigin || allowed.includes(requestOrigin)) return requestOrigin || allowed[0] || '*';
  return allowed[0] || 'null';
}

function json(data, status, origin) {
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type, authorization, x-view-key',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'cache-control': 'no-store',
      'vary': 'origin',
    },
  });
}

async function hash(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomKey(bytes = 18) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function authorized(request, env) {
  return request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`;
}

async function getSession(env, id) {
  return env.DB.prepare('SELECT id, view_key_hash, status, published_at FROM sessions WHERE id = ?').bind(id).first();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = corsOrigin(request, env);
    const reply = (data, status = 200) => json(data, status, origin);
    if (request.method === 'OPTIONS') return reply({}, 204);

    try {
      const statusMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/status$/);
      if (request.method === 'GET' && statusMatch) {
        const found = await getSession(env, decodeURIComponent(statusMatch[1]));
        if (!found) return reply({ error: '설문을 찾을 수 없습니다.' }, 404);
        const row = await env.DB.prepare('SELECT COUNT(*) AS count FROM responses WHERE session_id = ?').bind(found.id).first();
        return reply({ status: found.status, count: row.count });
      }

      const responseMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/responses$/);
      if (request.method === 'POST' && responseMatch) {
        const id = decodeURIComponent(responseMatch[1]);
        const found = await getSession(env, id);
        if (!found) return reply({ error: '설문을 찾을 수 없습니다.' }, 404);
        if (found.status !== 'collecting') return reply({ error: '설문이 종료되었습니다.' }, 409);
        const body = await request.json();
        if (!validAnswers(body.answers) || typeof body.clientId !== 'string' || body.clientId.length < 16) {
          return reply({ error: '응답 형식이 올바르지 않습니다.' }, 400);
        }
        const participantHash = await hash(`${env.DUPLICATE_SALT}:${id}:${body.clientId}`);
        try {
          await env.DB.prepare('INSERT INTO responses (session_id, participant_hash, answers) VALUES (?, ?, ?)')
            .bind(id, participantHash, JSON.stringify(body.answers)).run();
        } catch (error) {
          if (String(error).includes('UNIQUE')) return reply({ error: '이미 응답을 제출했습니다.' }, 409);
          throw error;
        }
        return reply({ ok: true }, 201);
      }

      const resultsMatch = url.pathname.match(/^\/api\/sessions\/([^/]+)\/results$/);
      if (request.method === 'GET' && resultsMatch) {
        const id = decodeURIComponent(resultsMatch[1]);
        const found = await getSession(env, id);
        if (!found) return reply({ error: '결과를 찾을 수 없습니다.' }, 404);
        const suppliedHash = await hash(request.headers.get('x-view-key') || '');
        if (suppliedHash !== found.view_key_hash) return reply({ error: '결과 링크가 올바르지 않습니다.' }, 403);
        if (found.status !== 'published') return reply({ error: '진행자가 아직 결과를 공개하지 않았습니다.' }, 409);
        const rows = await env.DB.prepare('SELECT answers FROM responses WHERE session_id = ? ORDER BY id').bind(id).all();
        return reply({ ...aggregateResponses(rows.results), publishedAt: found.published_at });
      }

      if (url.pathname.startsWith('/api/admin/') && !authorized(request, env)) {
        return reply({ error: '관리 토큰이 올바르지 않습니다.' }, 401);
      }

      if (request.method === 'GET' && url.pathname === '/api/admin/sessions') {
        const rows = await env.DB.prepare(`SELECT s.id, s.label, s.view_key AS viewKey, s.status, s.created_at, s.published_at, COUNT(r.id) AS count
          FROM sessions s LEFT JOIN responses r ON r.session_id = s.id GROUP BY s.id ORDER BY s.created_at DESC`).all();
        return reply({ sessions: rows.results });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/sessions') {
        const body = await request.json();
        if (typeof body.label !== 'string' || !body.label.trim() || body.label.length > 20) return reply({ error: '팀 이름을 확인해 주세요.' }, 400);
        const id = randomKey(12);
        const viewKey = randomKey(24);
        await env.DB.prepare('INSERT INTO sessions (id, label, view_key, view_key_hash) VALUES (?, ?, ?, ?)')
          .bind(id, body.label.trim(), viewKey, await hash(viewKey)).run();
        return reply({ id, viewKey }, 201);
      }

      const adminAction = url.pathname.match(/^\/api\/admin\/sessions\/([^/]+)\/(close|publish)$/);
      if (request.method === 'POST' && adminAction) {
        const id = decodeURIComponent(adminAction[1]);
        const action = adminAction[2];
        if (action === 'publish') {
          await env.DB.prepare("UPDATE sessions SET status = 'published', published_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
        } else {
          await env.DB.prepare("UPDATE sessions SET status = 'closed' WHERE id = ?").bind(id).run();
        }
        return reply({ ok: true });
      }

      return reply({ error: '요청한 기능을 찾을 수 없습니다.' }, 404);
    } catch (error) {
      console.error(error);
      return reply({ error: '서버에서 요청을 처리하지 못했습니다.' }, 500);
    }
  },
};

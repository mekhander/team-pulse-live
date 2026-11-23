import './styles.css';
import QRCode from 'qrcode';
import { api } from './api.js';

const app = document.querySelector('#app');
let token = sessionStorage.getItem('team-pulse-admin-token') || '';
let sessions = [];
const siteRoot = () => new URL('.', window.location.href).href;
const authHeaders = () => ({ authorization: `Bearer ${token}` });
const safe = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function renderLogin(error = '') {
  app.innerHTML = `<div class="shell"><section class="center-card">
    <p class="eyebrow">FACILITATOR</p><h1>진행자 화면</h1><p class="lead">관리 토큰은 이 브라우저 탭에만 보관됩니다.</p>
    <form id="login-form" style="margin-top:24px"><div class="field"><label for="token">관리 토큰</label>
      <input id="token" type="password" autocomplete="off" required></div><p class="error">${safe(error)}</p>
      <button class="primary-button" type="submit">계속하기</button></form></section></div>`;
  document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    token = document.querySelector('#token').value.trim();
    sessionStorage.setItem('team-pulse-admin-token', token);
    await refresh();
  });
}

async function renderDashboard() {
  const cards = await Promise.all(sessions.map(async (session) => {
    const surveyUrl = `${siteRoot()}?s=${encodeURIComponent(session.id)}`;
    const resultUrl = `${siteRoot()}results.html?s=${encodeURIComponent(session.id)}#key=${encodeURIComponent(session.viewKey)}`;
    const qr = await QRCode.toDataURL(surveyUrl, { width: 360, margin: 1, errorCorrectionLevel: 'M' });
    const statusText = session.status === 'collecting' ? '응답 받는 중' : session.status === 'published' ? '결과 공개됨' : '설문 종료됨';
    return `<article class="session-card" data-session="${safe(session.id)}">
      <div class="session-top"><h3 class="session-title">${safe(session.label)}</h3><div class="count">${session.count}명 제출</div></div>
      <div class="status-pill">${statusText}</div><img class="qr" src="${qr}" alt="설문 참여 QR코드">
      <div class="link-box">설문 링크<br>${safe(surveyUrl)}</div><div class="link-box">Miro 결과 보기 링크<br>${safe(resultUrl)}</div>
      <div class="admin-actions"><button class="secondary-button" data-action="copy-survey">설문 링크 복사</button>
        <button class="secondary-button" data-action="copy-results">결과 링크 복사</button>
        <button class="danger-button" data-action="close">설문 종료</button><button class="primary-button" data-action="publish">결과 공개</button>
        <button class="secondary-button reopen-button" data-action="reopen">응답 다시 받기</button></div>
    </article>`;
  }));

  app.innerHTML = `<div class="shell"><header><p class="eyebrow">FACILITATOR</p><h1>진행자 화면</h1>
    <p class="lead">참여 화면과 결과 화면에는 아래 팀 구분이 표시되지 않습니다.</p></header>
    <div class="admin-grid"><section class="panel"><h2>새 팀 세션</h2><form id="create-form">
      <div class="field"><label for="label">진행자용 팀 이름</label><input id="label" maxlength="20" placeholder="예: A" required></div>
      <button class="primary-button" type="submit">세션 만들기</button></form>
      <button class="secondary-button" id="create-defaults" type="button" style="margin-top:10px">A·B·C·D 세션 한 번에 만들기</button></section>
      <section class="panel"><h2>진행 중인 세션</h2><div class="session-list">${cards.join('') || '<p class="lead">아직 만든 세션이 없습니다.</p>'}</div></section>
    </div></div>`;
  document.querySelector('#create-form').addEventListener('submit', createSession);
  document.querySelector('#create-defaults').addEventListener('click', createDefaultSessions);
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', handleAction));
}

async function createDefaultSessions(event) {
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = '만드는 중…';
  for (const label of ['A', 'B', 'C', 'D']) {
    if (!sessions.some((session) => session.label === label)) {
      await api('/api/admin/sessions', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ label }) });
    }
  }
  await refresh();
}

async function createSession(event) {
  event.preventDefault();
  const label = document.querySelector('#label').value.trim();
  await api('/api/admin/sessions', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ label }) });
  await refresh();
}

async function handleAction(event) {
  const card = event.currentTarget.closest('[data-session]');
  const session = sessions.find((item) => item.id === card.dataset.session);
  const action = event.currentTarget.dataset.action;
  const surveyUrl = `${siteRoot()}?s=${encodeURIComponent(session.id)}`;
  const resultUrl = `${siteRoot()}results.html?s=${encodeURIComponent(session.id)}#key=${encodeURIComponent(session.viewKey)}`;
  if (action === 'copy-survey' || action === 'copy-results') {
    await navigator.clipboard.writeText(action === 'copy-survey' ? surveyUrl : resultUrl);
    event.currentTarget.textContent = '복사됨';
    return;
  }
  await api(`/api/admin/sessions/${encodeURIComponent(session.id)}/${action}`, { method: 'POST', headers: authHeaders(), body: '{}' });
  await refresh();
}

async function refresh() {
  try {
    const payload = await api('/api/admin/sessions', { headers: authHeaders() });
    sessions = payload.sessions;
    await renderDashboard();
  } catch (error) {
    sessionStorage.removeItem('team-pulse-admin-token');
    token = '';
    renderLogin(error.message);
  }
}

if (token) refresh(); else renderLogin();

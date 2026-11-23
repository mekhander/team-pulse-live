import './styles.css';
import QRCode from 'qrcode';
import { api } from './api.js';

const app = document.querySelector('#app');
let token = sessionStorage.getItem('team-pulse-admin-token') || '';
let sessions = [];
const siteRoot = () => new URL('.', window.location.href).href;
const authHeaders = () => ({ authorization: `Bearer ${token}` });
const safe = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const sessionDate = (value) => new Date(`${String(value).replace(' ', 'T')}Z`);
const displayDate = (value) => sessionDate(value).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

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
  const years = [...new Set(sessions.map((session) => sessionDate(session.created_at).getFullYear()))].sort((a, b) => b - a);
  const teamLabels = [...new Set(sessions.map((session) => session.label))].sort((a, b) => a.localeCompare(b, 'ko'));
  const cards = await Promise.all(sessions.map(async (session) => {
    const surveyUrl = `${siteRoot()}?s=${encodeURIComponent(session.id)}`;
    const resultUrl = `${siteRoot()}results.html?s=${encodeURIComponent(session.id)}`;
    const [surveyQr, resultQr] = await Promise.all([
      QRCode.toDataURL(surveyUrl, { width: 360, margin: 1, errorCorrectionLevel: 'M' }),
      QRCode.toDataURL(resultUrl, { width: 360, margin: 1, errorCorrectionLevel: 'M' }),
    ]);
    const statusText = session.status === 'collecting' ? '응답 받는 중' : '설문 종료됨';
    return `<article class="session-card" data-session="${safe(session.id)}">
      <div class="session-top"><div><label class="session-select"><input type="checkbox" data-session-select value="${safe(session.id)}"> 통합 선택</label><h3 class="session-title">${safe(session.label)}</h3><time>${safe(displayDate(session.created_at))}</time></div><div class="count">${session.count}명 제출</div></div>
      <div class="status-pill">${statusText}</div>
      <div class="qr-grid">
        <section class="qr-card"><h4>설문 참여 QR</h4><img class="qr" src="${surveyQr}" alt="설문 참여 QR코드"><div class="link-box">${safe(surveyUrl)}</div></section>
        <section class="qr-card"><h4>결과 보기 QR</h4><img class="qr" src="${resultQr}" alt="결과 보기 QR코드"><div class="link-box">${safe(resultUrl)}</div></section>
      </div>
      <div class="admin-actions"><button class="secondary-button" data-action="copy-survey">설문 링크 복사</button>
        <button class="secondary-button" data-action="copy-results">결과 링크 복사</button>
        <button class="danger-button" data-action="close">설문 종료</button>
        <button class="secondary-button reopen-button" data-action="reopen">응답 다시 받기</button>
        <button class="danger-button delete-button" data-action="delete">세션 삭제</button></div>
    </article>`;
  }));

  app.innerHTML = `<div class="shell"><header><p class="eyebrow">FACILITATOR</p><h1>진행자 화면</h1>
    <p class="lead">참여 화면과 결과 화면에는 아래 팀 구분이 표시되지 않습니다.</p></header>
    <div class="admin-grid"><section class="panel"><h2>새 팀 세션</h2><form id="create-form">
      <div class="field"><label for="label">진행자용 팀 이름</label><input id="label" maxlength="20" placeholder="예: A" required></div>
      <button class="primary-button" type="submit">세션 만들기</button></form>
      <button class="secondary-button" id="create-defaults" type="button" style="margin-top:10px">A·B·C·D 세션 한 번에 만들기</button></section>
      <section class="panel summary-panel"><h2>통합 통계</h2>
        <div class="summary-filters">
          <div class="field"><label for="summary-year">연도</label><select id="summary-year"><option value="">전체 연도</option>${years.map((year) => `<option value="${year}">${year}년</option>`).join('')}</select></div>
          <div class="field"><label for="summary-month">월</label><select id="summary-month"><option value="">전체 월</option>${Array.from({ length: 12 }, (_, index) => `<option value="${index + 1}">${index + 1}월</option>`).join('')}</select></div>
        </div>
        <div class="team-filter"><strong>팀 선택</strong><div>${teamLabels.map((label) => `<label><input type="checkbox" data-team-filter value="${safe(label)}"> ${safe(label)}</label>`).join('') || '<span>세션이 없습니다.</span>'}</div></div>
        <p class="filter-count" id="filter-count"></p>
        <div class="summary-actions"><button class="primary-button" id="summary-filtered" type="button">필터 조건 통합 결과</button><button class="secondary-button" id="summary-selected" type="button">체크 세션 통합 결과</button><button class="secondary-button" id="summary-all" type="button">전체 세션 통합 결과</button></div>
      </section>
      <section class="panel"><h2>진행 중인 세션</h2><div class="session-list">${cards.join('') || '<p class="lead">아직 만든 세션이 없습니다.</p>'}</div></section>
    </div></div>`;
  document.querySelector('#create-form').addEventListener('submit', createSession);
  document.querySelector('#create-defaults').addEventListener('click', createDefaultSessions);
  document.querySelector('#summary-year').addEventListener('change', updateFilterCount);
  document.querySelector('#summary-month').addEventListener('change', updateFilterCount);
  document.querySelectorAll('[data-team-filter]').forEach((input) => input.addEventListener('change', updateFilterCount));
  document.querySelector('#summary-filtered').addEventListener('click', () => openSummary(filteredSessions().map((session) => session.id)));
  document.querySelector('#summary-selected').addEventListener('click', () => openSummary([...document.querySelectorAll('[data-session-select]:checked')].map((input) => input.value)));
  document.querySelector('#summary-all').addEventListener('click', () => openSummary(sessions.map((session) => session.id)));
  document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', handleAction));
  updateFilterCount();
}

function filteredSessions() {
  const year = Number(document.querySelector('#summary-year')?.value || 0);
  const month = Number(document.querySelector('#summary-month')?.value || 0);
  const teams = new Set([...document.querySelectorAll('[data-team-filter]:checked')].map((input) => input.value));
  return sessions.filter((session) => {
    const date = sessionDate(session.created_at);
    return (!year || date.getFullYear() === year) && (!month || date.getMonth() + 1 === month) && (!teams.size || teams.has(session.label));
  });
}

function updateFilterCount() {
  const count = filteredSessions().length;
  const element = document.querySelector('#filter-count');
  if (element) element.textContent = `조건에 맞는 세션 ${count}개`;
}

function openSummary(ids) {
  if (!ids.length) {
    window.alert('통합할 세션이 없습니다. 필터 또는 체크 항목을 확인해 주세요.');
    return;
  }
  const url = `${siteRoot()}summary.html?ids=${ids.map(encodeURIComponent).join(',')}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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
  const resultUrl = `${siteRoot()}results.html?s=${encodeURIComponent(session.id)}`;
  if (action === 'copy-survey' || action === 'copy-results') {
    await navigator.clipboard.writeText(action === 'copy-survey' ? surveyUrl : resultUrl);
    event.currentTarget.textContent = '복사됨';
    return;
  }
  if (action === 'delete') {
    const confirmed = window.confirm(`진행자용 세션 “${session.label}”과 모든 응답을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    await api(`/api/admin/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE', headers: authHeaders() });
    await refresh();
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

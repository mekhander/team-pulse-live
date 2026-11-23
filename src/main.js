import './styles.css';
import { questions } from './questions.js';
import { api, getSessionId } from './api.js';

const app = document.querySelector('#app');
const sessionId = getSessionId();
const storageKey = `team-pulse-v2:${sessionId}`;

function clientId() {
  const key = `${storageKey}:client`;
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

function renderMessage(title, message, done = false) {
  app.innerHTML = `<div class="shell"><section class="center-card">
    <div class="checkmark">${done ? '✓' : '·'}</div><h1>${title}</h1><p class="lead">${message}</p>
  </section></div>`;
}

async function init() {
  if (!sessionId) return renderMessage('유효하지 않은 주소입니다', '진행자가 안내한 QR코드로 다시 접속해 주세요.');
  if (localStorage.getItem(`${storageKey}:submitted`)) return renderMessage('응답이 제출되었습니다', '이제 진행자의 안내를 기다려 주세요.', true);

  try {
    const status = await api(`/api/sessions/${encodeURIComponent(sessionId)}/status`);
    if (status.status !== 'collecting') return renderMessage('설문이 종료되었습니다', '현재는 응답을 제출할 수 없습니다.');
  } catch (error) {
    return renderMessage('설문을 불러오지 못했습니다', error.message);
  }

  app.innerHTML = `<div class="shell">
    <header><p class="eyebrow">TEAM CHECK-IN</p><h1>팀 설문</h1>
      <p class="lead">각 문항을 읽고 지금 느끼는 것과 가장 가까운 답을 선택해 주세요.</p>
      <div class="privacy-note"><strong>익명으로 진행됩니다.</strong><br>이름, 이메일, GitHub 계정을 수집하지 않으며 결과에는 개인 응답이 표시되지 않습니다.</div>
    </header>
    <form id="survey-form"><div class="question-list">
      ${questions.map((q) => `<section class="question-card" id="question-${q.id}">
        <p class="question-number">${q.id} / ${questions.length}</p><h2 class="question-text">${q.text}</h2>
        <div class="options">${q.options.map((option, index) => `<label class="option">
          <input type="radio" name="q${q.id}" value="${index + 1}" required><span>${option}</span>
        </label>`).join('')}</div>
      </section>`).join('')}
    </div><p class="error" id="form-error" role="alert"></p>
    <button class="primary-button" type="submit">익명으로 제출하기</button></form>
  </div>`;

  const form = document.querySelector('#survey-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const errorBox = document.querySelector('#form-error');
    const data = new FormData(form);
    const answers = questions.map((q) => Number(data.get(`q${q.id}`)));
    const missing = answers.findIndex((answer) => !answer);
    if (missing >= 0) {
      errorBox.textContent = `${missing + 1}번 문항에 응답해 주세요.`;
      document.querySelector(`#question-${missing + 1}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    button.disabled = true;
    button.textContent = '제출하고 있습니다…';
    errorBox.textContent = '';
    try {
      await api(`/api/sessions/${encodeURIComponent(sessionId)}/responses`, {
        method: 'POST', body: JSON.stringify({ answers, clientId: clientId() }),
      });
      localStorage.setItem(`${storageKey}:submitted`, 'yes');
      renderMessage('응답이 제출되었습니다', '이제 진행자의 안내를 기다려 주세요.', true);
    } catch (error) {
      errorBox.textContent = error.message;
      button.disabled = false;
      button.textContent = '익명으로 제출하기';
    }
  });
}

init();

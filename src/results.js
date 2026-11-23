import './styles.css';
import { questions, comparisonGroups, singleQuestion } from './questions.js';
import { api, getSessionId } from './api.js';

const app = document.querySelector('#app');
const sessionId = getSessionId();
const question = (id) => questions.find((item) => item.id === id);
const formatScore = (value) => `${Number(value.toFixed(1))}/4`;

function bar(summary) {
  return `<div class="stacked-bar" aria-label="응답 분포">${summary.percentages.map((value) =>
    `<div class="segment" style="width:${value}%">${value >= 12 ? `${value}%` : ''}</div>`).join('')}</div>`;
}

function legend(options) {
  return `<div class="legend">${options.map((option) => `<span><i></i>${option}</span>`).join('')}</div>`;
}

function comparisonCard(group, results) {
  const self = results.questions[group.self - 1];
  const team = results.questions[group.team - 1];
  return `<section class="comparison-card"><h2>${group.title}</h2>
    <div class="question-context">
      <p><strong>나 자신</strong><span>${question(group.self).text}</span></p>
      <p><strong>팀 구성원</strong><span>${question(group.team).text}</span></p>
    </div>
    <div class="comparison-row"><div class="row-label">나 자신</div>${bar(self)}<div class="average">${formatScore(self.average)}</div></div>
    <div class="comparison-row"><div class="row-label">팀 구성원</div>${bar(team)}<div class="average">${formatScore(team.average)}</div></div>
    ${legend(question(group.self).options)}
  </section>`;
}

function waiting(message) {
  app.innerHTML = `<div class="shell results-shell"><section class="center-card"><div class="checkmark">·</div><h1>결과 준비 중</h1><p class="lead">${message}</p></section></div>`;
}

async function load() {
  if (!sessionId) return waiting('유효한 결과 링크가 필요합니다.');
  try {
    const results = await api(`/api/sessions/${encodeURIComponent(sessionId)}/results`);
    const single = results.questions[singleQuestion.question - 1];
    app.innerHTML = `<div class="shell results-shell">
      <header class="results-header"><div><p class="eyebrow">TEAM CHECK-IN</p><h1>설문 결과</h1></div>
        <div class="results-meta"><strong>현재까지 ${results.count}명 제출</strong><br>${new Date(results.generatedAt).toLocaleString('ko-KR')} 기준</div></header>
      <div class="comparison-list">${comparisonGroups.map((group) => comparisonCard(group, results)).join('')}
        <section class="comparison-card"><h2>${singleQuestion.title}</h2>
          <div class="question-context"><p><strong>팀에 대한 인식</strong><span>${question(singleQuestion.question).text}</span></p></div>
          <div class="comparison-row"><div class="row-label">팀에 대한 인식</div>${bar(single)}<div class="average">${formatScore(single.average)}</div></div>
          ${legend(question(singleQuestion.question).options)}
        </section>
      </div></div>`;
  } catch (error) { waiting(error.message); }
}

load();
setInterval(load, 10000);

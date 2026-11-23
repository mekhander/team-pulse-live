import './styles.css';
import { questions, comparisonGroups, singleQuestion } from './questions.js';
import { api, getSessionId } from './api.js';

const app = document.querySelector('#app');
const sessionId = getSessionId();
const question = (id) => questions.find((item) => item.id === id);
const formatScore = (value) => `${Number(value.toFixed(1))}/4`;

function bar(summary) {
  return `<div class="bar-wrap">
    <div class="stacked-bar" aria-hidden="true">${summary.percentages.map((value) =>
      `<div class="segment" style="width:${value}%"></div>`).join('')}</div>
    <div class="bar-values" aria-label="선택지별 응답 비율">${summary.percentages.map((value, index) =>
      `<span><i></i><b>${index + 1}</b><strong>${value}%</strong></span>`).join('')}</div>
  </div>`;
}

function legend(options) {
  return `<div class="legend">${options.map((option, index) => `<span><i></i><b>${index + 1}</b>${option}</span>`).join('')}</div>`;
}

function resultSeries(label, questionText, summary) {
  return `<section class="result-series">
    <div class="series-heading">
      <div><strong>${label}</strong><p>${questionText}</p></div>
      <div class="average">${formatScore(summary.average)}</div>
    </div>
    ${bar(summary)}
  </section>`;
}

function comparisonCard(group, results) {
  const self = results.questions[group.self - 1];
  const team = results.questions[group.team - 1];
  return `<section class="comparison-card"><h2>${group.title}</h2>
    ${resultSeries('나 자신', question(group.self).text, self)}
    ${resultSeries('팀 구성원', question(group.team).text, team)}
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
          ${resultSeries('팀에 대한 인식', question(singleQuestion.question).text, single)}
          ${legend(question(singleQuestion.question).options)}
        </section>
      </div></div>`;
  } catch (error) { waiting(error.message); }
}

load();
setInterval(load, 10000);

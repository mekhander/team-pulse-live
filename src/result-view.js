import { questions, comparisonGroups, singleQuestion } from './questions.js';

const question = (id) => questions.find((item) => item.id === id);
const formatScore = (value) => `${Number(value.toFixed(1))}/4`;

function bar(summary) {
  return `<div class="bar-wrap">
    <div class="stacked-bar" aria-hidden="true">${summary.percentages.map((value) =>
      `<div class="segment" style="width:${value}%"></div>`).join('')}</div>
    <div class="bar-values" aria-label="선택지별 응답 비율">${summary.percentages.map((value) =>
      `<span><i></i><strong>${value}%</strong></span>`).join('')}</div>
  </div>`;
}

function legend(options) {
  return `<div class="legend">${options.map((option) => `<span><i></i>${option}</span>`).join('')}</div>`;
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

export function renderWaiting(app, message) {
  app.innerHTML = `<div class="shell results-shell"><section class="center-card"><div class="checkmark">·</div><h1>결과 준비 중</h1><p class="lead">${message}</p></section></div>`;
}

export function renderResults(app, results, { title = '설문 결과', countLabel, detailLabel } = {}) {
  const single = results.questions[singleQuestion.question - 1];
  const countText = countLabel || `현재까지 ${results.count}명 제출`;
  const detailText = detailLabel || `${new Date(results.generatedAt).toLocaleString('ko-KR')} 기준`;
  app.innerHTML = `<div class="shell results-shell">
    <header class="results-header"><div><p class="eyebrow">TEAM CHECK-IN</p><h1>${title}</h1></div>
      <div class="results-meta"><strong>${countText}</strong><br>${detailText}</div></header>
    <div class="comparison-list">${comparisonGroups.map((group) => comparisonCard(group, results)).join('')}
      <section class="comparison-card"><h2>${singleQuestion.title}</h2>
        ${resultSeries('팀에 대한 인식', question(singleQuestion.question).text, single)}
        ${legend(question(singleQuestion.question).options)}
      </section>
    </div></div>`;
}

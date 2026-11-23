import { questions, comparisonGroups, singleQuestion } from './questions.js';

const question = (id) => questions.find((item) => item.id === id);
const formatScore = (value) => Number(value.toFixed(1));

function bar(summary, options) {
  const distributionLabel = options.map((option, index) => `${option} ${summary.percentages[index]}%`).join(', ');
  return `<div class="distribution">
    <div class="stacked-bar" role="img" aria-label="${distributionLabel}">${summary.percentages.map((value) =>
      `<div class="segment" style="width:${value}%"></div>`).join('')}</div>
    <div class="bar-values" aria-hidden="true">${summary.percentages.map((value, index) =>
      `<span><i></i><strong>${value}%</strong><b>${options[index]}</b></span>`).join('')}</div>
  </div>`;
}

function resultSeries(label, questionText, summary, options) {
  return `<section class="result-series result-series--${label === '나 자신' ? 'self' : 'team'}">
    <div class="series-heading">
      <span class="series-label">${label}</span>
      <div class="average" aria-label="평균 ${formatScore(summary.average)}점, 4점 만점"><strong>${formatScore(summary.average)}</strong><span>/4</span></div>
    </div>
    <p class="question-copy">${questionText}</p>
    <p class="distribution-title">응답 분포</p>
    ${bar(summary, options)}
  </section>`;
}

function comparisonCard(group, results) {
  const self = results.questions[group.self - 1];
  const team = results.questions[group.team - 1];
  const options = question(group.self).options;
  return `<article class="comparison-card">
    <header class="comparison-card__header"><h2>${group.title}</h2><span>나와 팀 구성원 비교</span></header>
    <div class="series-grid">
      ${resultSeries('나 자신', question(group.self).text, self, options)}
      ${resultSeries('팀 구성원', question(group.team).text, team, options)}
    </div>
  </article>`;
}

export function renderWaiting(app, message) {
  app.innerHTML = `<div class="results-page"><div class="shell results-shell"><section class="center-card"><div class="checkmark">·</div><h1>결과 준비 중</h1><p class="lead">${message}</p></section></div></div>`;
}

export function renderResults(app, results, { title = '설문 결과', countLabel, detailLabel } = {}) {
  const single = results.questions[singleQuestion.question - 1];
  const singleOptions = question(singleQuestion.question).options;
  const countText = countLabel || `현재까지 ${results.count}명 제출`;
  const detailText = detailLabel || `${new Date(results.generatedAt).toLocaleString('ko-KR')} 기준`;
  app.innerHTML = `<div class="results-page"><div class="shell results-shell">
    <header class="results-hero">
      <div class="results-hero__copy"><p class="eyebrow">LIVE TEAM CHECK-IN</p><h1>${title}</h1>
        <p>평균 점수와 응답 분포를 함께 확인하세요.</p></div>
      <div class="results-meta"><span class="live-label"><i></i>LIVE</span><strong>${countText}</strong><time>${detailText}</time></div>
    </header>
    <div class="results-guide"><strong>화면 읽는 법</strong><span>각 색상의 비율은 해당 선택지를 고른 응답자의 비율입니다.</span></div>
    <div class="comparison-list">${comparisonGroups.map((group) => comparisonCard(group, results)).join('')}
      <article class="comparison-card comparison-card--single">
        <header class="comparison-card__header"><h2>${singleQuestion.title}</h2><span>팀에 대한 인식</span></header>
        <div class="series-grid">
          ${resultSeries('팀에 대한 인식', question(singleQuestion.question).text, single, singleOptions)}
        </div>
      </article>
    </div>
  </div></div>`;
}

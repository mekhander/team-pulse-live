import { questions } from './questions.js';

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

function questionCard(item, summary) {
  return `<article class="comparison-card team-result-card">
    <header class="comparison-card__header"><h2>${item.title}</h2><span>팀에 대한 인식</span></header>
    <section class="result-series result-series--team">
      <div class="series-heading">
        <span class="series-label">팀 구성원</span>
        <div class="average" aria-label="평균 ${formatScore(summary.average)}점, 4점 만점"><strong>${formatScore(summary.average)}</strong><span>/4</span></div>
      </div>
      <p class="question-copy">${item.text}</p>
      <p class="distribution-title">응답 분포</p>
      ${bar(summary, item.options)}
    </section>
  </article>`;
}

export function renderWaiting(app, message) {
  app.innerHTML = `<div class="results-page"><div class="shell results-shell"><section class="center-card"><div class="checkmark">·</div><h1>결과 준비 중</h1><p class="lead">${message}</p></section></div></div>`;
}

export function renderResults(app, results, { title = '설문 결과', countLabel, detailLabel } = {}) {
  const countText = countLabel || `현재까지 ${results.count}명 제출`;
  const detailText = detailLabel || `${new Date(results.generatedAt).toLocaleString('ko-KR')} 기준`;
  app.innerHTML = `<div class="results-page"><div class="shell results-shell">
    <header class="results-hero">
      <div class="results-hero__copy"><p class="eyebrow">LIVE TEAM CHECK-IN</p><h1>${title}</h1>
        <p>팀에 대한 평균 점수와 응답 분포를 확인하세요.</p></div>
      <div class="results-meta"><span class="live-label"><i></i>LIVE</span><strong>${countText}</strong><time>${detailText}</time></div>
    </header>
    <div class="results-guide"><strong>화면 읽는 법</strong><span>각 색상 탭은 선택지와 해당 응답 비율을 함께 보여줍니다.</span></div>
    <div class="comparison-list team-only-list">${questions.map((item, index) => questionCard(item, results.questions[index])).join('')}</div>
  </div></div>`;
}

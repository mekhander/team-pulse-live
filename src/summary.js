import './styles.css';
import { api } from './api.js';
import { renderResults, renderWaiting } from './result-view.js';
import { combineResults } from './combine-results.js';

const app = document.querySelector('#app');
const ids = [...new Set((new URLSearchParams(window.location.search).get('ids') || '').split(',').filter(Boolean))];

async function load() {
  if (!ids.length) return renderWaiting(app, '통합할 세션이 선택되지 않았습니다.');
  const settled = await Promise.allSettled(ids.map((id) => api(`/api/sessions/${encodeURIComponent(id)}/results`)));
  const available = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
  if (!available.length) return renderWaiting(app, '조회할 수 있는 세션 결과가 없습니다.');
  const results = combineResults(available);
  renderResults(app, results, {
    title: '통합 설문 결과',
    countLabel: `${available.length}개 세션 · 현재까지 ${results.count}명 제출`,
  });
}

load();
setInterval(load, 10000);

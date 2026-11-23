import './styles.css';
import { api, getSessionId } from './api.js';
import { renderResults, renderWaiting } from './result-view.js';

const app = document.querySelector('#app');
const sessionId = getSessionId();

async function load() {
  if (!sessionId) return renderWaiting(app, '유효한 결과 링크가 필요합니다.');
  try {
    const results = await api(`/api/sessions/${encodeURIComponent(sessionId)}/results`);
    renderResults(app, results);
  } catch (error) {
    renderWaiting(app, error.message);
  }
}

load();
setInterval(load, 10000);

import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateResponses, validAnswers } from '../worker/aggregate.js';
import { combineResults } from '../src/combine-results.js';

test('validates a complete 7-question response', () => {
  assert.equal(validAnswers(Array(7).fill(1)), true);
  assert.equal(validAnswers(Array(6).fill(1)), false);
  assert.equal(validAnswers([...Array(6).fill(1), 5]), false);
});

test('aggregates counts, percentages and averages', () => {
  const rows = [
    { answers: JSON.stringify(Array(7).fill(1)) },
    { answers: JSON.stringify(Array(7).fill(4)) },
  ];
  const result = aggregateResponses(rows);
  assert.equal(result.count, 2);
  assert.deepEqual(result.questions[0].counts, [1, 0, 0, 1]);
  assert.deepEqual(result.questions[0].percentages, [50, 0, 0, 50]);
  assert.equal(result.questions[0].average, 2.5);
});

test('combines multiple session result sets using response counts', () => {
  const makeQuestion = (counts) => ({ counts, percentages: [0, 0, 0, 0], average: 0 });
  const first = { count: 2, questions: Array.from({ length: 7 }, () => makeQuestion([1, 1, 0, 0])) };
  const second = { count: 3, questions: Array.from({ length: 7 }, () => makeQuestion([0, 0, 1, 2])) };
  const combined = combineResults([first, second]);
  assert.equal(combined.count, 5);
  assert.deepEqual(combined.questions[0].counts, [1, 1, 1, 2]);
  assert.deepEqual(combined.questions[0].percentages, [20, 20, 20, 40]);
  assert.equal(combined.questions[0].average, 2.8);
});

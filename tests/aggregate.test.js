import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateResponses, validAnswers } from '../worker/aggregate.js';

test('validates a complete 13-question response', () => {
  assert.equal(validAnswers(Array(13).fill(1)), true);
  assert.equal(validAnswers(Array(12).fill(1)), false);
  assert.equal(validAnswers([...Array(12).fill(1), 5]), false);
});

test('aggregates counts, percentages and averages', () => {
  const rows = [
    { answers: JSON.stringify(Array(13).fill(1)) },
    { answers: JSON.stringify(Array(13).fill(4)) },
  ];
  const result = aggregateResponses(rows);
  assert.equal(result.count, 2);
  assert.deepEqual(result.questions[0].counts, [1, 0, 0, 1]);
  assert.deepEqual(result.questions[0].percentages, [50, 0, 0, 50]);
  assert.equal(result.questions[0].average, 2.5);
});

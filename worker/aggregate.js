export function aggregateResponses(rows) {
  const answers = rows.map((row) => JSON.parse(row.answers));
  const count = answers.length;
  const questions = Array.from({ length: 7 }, (_, index) => {
    const counts = [0, 0, 0, 0];
    for (const response of answers) counts[response[index] - 1] += 1;
    const total = counts.reduce((sum, value, option) => sum + value * (option + 1), 0);
    return { counts, percentages: counts.map((value) => count ? Math.round((value / count) * 100) : 0), average: count ? total / count : 0 };
  });
  return { count, questions };
}

export function validAnswers(answers) {
  return Array.isArray(answers) && answers.length === 7 && answers.every((answer) => Number.isInteger(answer) && answer >= 1 && answer <= 4);
}

export function combineResults(resultSets) {
  const count = resultSets.reduce((sum, result) => sum + result.count, 0);
  const questionCount = resultSets[0]?.questions.length || 0;
  const questions = Array.from({ length: questionCount }, (_, index) => {
    const counts = [0, 0, 0, 0];
    for (const result of resultSets) {
      result.questions[index].counts.forEach((value, option) => { counts[option] += value; });
    }
    const weighted = counts.reduce((sum, value, option) => sum + value * (option + 1), 0);
    return {
      counts,
      percentages: counts.map((value) => count ? Math.round((value / count) * 100) : 0),
      average: count ? weighted / count : 0,
    };
  });
  return { count, questions, generatedAt: new Date().toISOString() };
}

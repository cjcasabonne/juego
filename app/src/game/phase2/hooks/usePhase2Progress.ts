export function usePhase2Progress(totalQuestions: number, predictedQuestions: number) {
  const safeTotal = Math.max(totalQuestions, 1);
  const currentIndex = Math.min(predictedQuestions, totalQuestions);
  const percent = Math.round((predictedQuestions / safeTotal) * 100);

  return {
    totalQuestions,
    predictedQuestions,
    currentIndex,
    remaining: Math.max(totalQuestions - predictedQuestions, 0),
    percent,
    isComplete: totalQuestions > 0 && predictedQuestions >= totalQuestions,
  };
}

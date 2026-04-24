export function usePhase1Progress(totalQuestions: number, answeredQuestions: number) {
  const safeTotal = Math.max(totalQuestions, 1);
  const currentIndex = Math.min(answeredQuestions, totalQuestions);
  const percent = Math.round((answeredQuestions / safeTotal) * 100);

  return {
    totalQuestions,
    answeredQuestions,
    currentIndex,
    remaining: Math.max(totalQuestions - answeredQuestions, 0),
    percent,
    isComplete: totalQuestions > 0 && answeredQuestions >= totalQuestions,
  };
}

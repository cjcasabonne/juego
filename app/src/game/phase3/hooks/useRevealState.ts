export function useRevealState(totalItems: number, revealPosition: number) {
  const completed = Math.min(revealPosition, totalItems);
  const currentIndex = revealPosition >= totalItems ? null : revealPosition;
  const percent = totalItems === 0 ? 0 : Math.round((completed / totalItems) * 100);

  return {
    completed,
    totalItems,
    currentIndex,
    percent,
    isComplete: totalItems > 0 && revealPosition >= totalItems,
  };
}

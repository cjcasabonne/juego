export const questionTaxonomy = [
  {
    slug: 'icebreakers',
    label: 'Icebreakers',
    subcategories: [
      { slug: 'quick-picks', label: 'Quick Picks' },
      { slug: 'first-impressions', label: 'First Impressions' },
      { slug: 'daily-habits', label: 'Daily Habits' },
      { slug: 'would-you-rather', label: 'Would You Rather' },
    ],
  },
  {
    slug: 'romantic',
    label: 'Romantic',
    subcategories: [
      { slug: 'sweet-moments', label: 'Sweet Moments' },
      { slug: 'memories', label: 'Memories' },
      { slug: 'future-together', label: 'Future Together' },
      { slug: 'love-language', label: 'Love Language' },
    ],
  },
  {
    slug: 'sexy-questions',
    label: 'Sexy Questions',
    subcategories: [
      { slug: 'light', label: 'Light' },
      { slug: 'flirty', label: 'Flirty' },
      { slug: 'spicy', label: 'Spicy' },
      { slug: 'savage', label: 'Savage' },
    ],
  },
  {
    slug: 'deep-talk',
    label: 'Deep Talk',
    subcategories: [
      { slug: 'values', label: 'Values' },
      { slug: 'fears', label: 'Fears' },
      { slug: 'dreams', label: 'Dreams' },
      { slug: 'identity', label: 'Identity' },
    ],
  },
  {
    slug: 'relationship',
    label: 'Relationship',
    subcategories: [
      { slug: 'communication', label: 'Communication' },
      { slug: 'trust', label: 'Trust' },
      { slug: 'boundaries', label: 'Boundaries' },
      { slug: 'conflict', label: 'Conflict' },
    ],
  },
  {
    slug: 'fun-challenges',
    label: 'Fun Challenges',
    subcategories: [
      { slug: 'dares', label: 'Dares' },
      { slug: 'missions', label: 'Missions' },
      { slug: 'roleplay', label: 'Roleplay' },
      { slug: 'chaos', label: 'Chaos' },
    ],
  },
  {
    slug: 'preferences',
    label: 'Preferences',
    subcategories: [
      { slug: 'dates', label: 'Dates' },
      { slug: 'food', label: 'Food' },
      { slug: 'lifestyle', label: 'Lifestyle' },
      { slug: 'gifts', label: 'Gifts' },
    ],
  },
  {
    slug: 'scenarios',
    label: 'Scenarios',
    subcategories: [
      { slug: 'dream-date', label: 'Dream Date' },
      { slug: 'weekend-plan', label: 'Weekend Plan' },
      { slug: 'vacation-mode', label: 'Vacation Mode' },
      { slug: 'home-vs-out', label: 'Home vs Out' },
    ],
  },
  {
    slug: 'hot-takes',
    label: 'Hot Takes',
    subcategories: [
      { slug: 'opinions', label: 'Opinions' },
      { slug: 'debates', label: 'Debates' },
      { slug: 'controversial', label: 'Controversial' },
      { slug: 'red-flags', label: 'Red Flags' },
    ],
  },
  {
    slug: 'fantasy',
    label: 'Fantasy',
    subcategories: [
      { slug: 'secret-wishes', label: 'Secret Wishes' },
      { slug: 'alternate-universe', label: 'Alternate Universe' },
      { slug: 'power-dynamics', label: 'Power Dynamics' },
      { slug: 'what-if', label: 'What If' },
    ],
  },
] as const;

export type QuestionCategory = (typeof questionTaxonomy)[number]['slug'];
export type QuestionSubcategory = (typeof questionTaxonomy)[number]['subcategories'][number]['slug'];

export function getSubcategoriesForCategory(category: QuestionCategory) {
  return questionTaxonomy.find((item) => item.slug === category)?.subcategories ?? [];
}

export function isValidQuestionCategory(category: string): category is QuestionCategory {
  return questionTaxonomy.some((item) => item.slug === category);
}

export function isValidQuestionSubcategoryPair(
  category: string,
  subcategory: string,
): category is QuestionCategory {
  return questionTaxonomy.some(
    (item) => item.slug === category && item.subcategories.some((child) => child.slug === subcategory),
  );
}

import { categories } from "../data/campusItems";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "can",
  "for",
  "i",
  "im",
  "in",
  "is",
  "me",
  "my",
  "near",
  "need",
  "of",
  "on",
  "the",
  "to",
  "want",
  "where",
  "with",
]);

const INTENT_EXPANSIONS = {
  eat: ["food", "dining", "meal", "hungry"],
  eating: ["food", "dining", "meal", "hungry"],
  food: ["dining", "meal", "hungry"],
  hungry: ["food", "dining", "meal"],
  coffee: ["cafe", "starbucks", "tea", "drink"],
  pizza: ["garlic", "nott", "italian", "slice"],
  vegan: ["plant", "vegetarian", "organic"],
  vegetarian: ["vegan", "organic"],
  sick: ["health", "wicker", "doctor", "nurse"],
  stressed: ["stress", "mental", "counseling", "therapy"],
  stress: ["mental", "counseling", "therapy"],
  anxiety: ["mental", "counseling", "therapy"],
  gym: ["fitness", "workout", "physical"],
  workout: ["gym", "fitness", "physical"],
  safe: ["safety", "security", "campus safety"],
  lost: ["safety", "id", "keys"],
  id: ["campus safety", "lost", "keys"],
  club: ["clubs", "student activities", "organization"],
  clubs: ["club", "student activities", "organization"],
  tonight: ["event", "events", "happening"],
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !STOP_WORDS.has(token));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getCategory(item) {
  return categories.find((category) => category.id === item.category);
}

function flattenValues(value) {
  if (value === null || value === undefined) return [];

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenValues);
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([key]) => !["lat", "lng"].includes(key))
      .flatMap(([, entry]) => flattenValues(entry));
  }

  return [];
}

function expandQuery(searchTerm) {
  const phrase = normalize(searchTerm);
  const baseTokens = tokenize(searchTerm);
  const expanded = [...baseTokens];

  baseTokens.forEach((token) => {
    if (INTENT_EXPANSIONS[token]) {
      expanded.push(...INTENT_EXPANSIONS[token]);
    }
  });

  return {
    phrase,
    tokens: unique(expanded.map(normalize)).filter(Boolean),
  };
}

function fieldScore(fieldValue, phrase, tokens, phraseWeight, tokenWeight) {
  const text = normalize(fieldValue);
  if (!text) return 0;

  let score = 0;

  if (phrase && text.includes(phrase)) {
    score += phraseWeight;
  }

  tokens.forEach((token) => {
    if (token.length >= 2 && text.includes(token)) {
      score += tokenWeight;
    }
  });

  return score;
}

function addReason(reasons, label, fieldValue, phrase, tokens) {
  const text = normalize(fieldValue);
  if (!text) return;

  const matched =
    (phrase && text.includes(phrase)) ||
    tokens.some((token) => token.length >= 2 && text.includes(token));

  if (matched) {
    reasons.add(label);
  }
}

function scoreItem(item, searchTerm) {
  const cleanSearch = normalize(searchTerm);
  const category = getCategory(item);
  const { phrase, tokens } = expandQuery(cleanSearch);
  const reasons = new Set();

  if (!cleanSearch) {
    return {
      ...item,
      matchScore: 0,
      matchReasons: [],
    };
  }

  const searchable = {
    name: item.name,
    category: category?.label,
    type: item.type,
    location: item.location,
    tags: Array.isArray(item.tags) ? item.tags.join(" ") : "",
    hours: item.hours,
    details: flattenValues(item).join(" "),
  };

  let score = 0;

  score += fieldScore(searchable.name, phrase, tokens, 120, 30);
  score += fieldScore(searchable.category, phrase, tokens, 80, 22);
  score += fieldScore(searchable.type, phrase, tokens, 60, 18);
  score += fieldScore(searchable.tags, phrase, tokens, 70, 20);
  score += fieldScore(searchable.location, phrase, tokens, 50, 14);
  score += fieldScore(searchable.hours, phrase, tokens, 40, 10);
  score += fieldScore(searchable.details, phrase, tokens, 20, 4);

  addReason(reasons, "name", searchable.name, phrase, tokens);
  addReason(reasons, "category", searchable.category, phrase, tokens);
  addReason(reasons, "type", searchable.type, phrase, tokens);
  addReason(reasons, "tags", searchable.tags, phrase, tokens);
  addReason(reasons, "location", searchable.location, phrase, tokens);
  addReason(reasons, "details", searchable.details, phrase, tokens);

  return {
    ...item,
    matchScore: score,
    matchReasons: [...reasons],
  };
}

export function searchItems(items, searchTerm, activeCategories) {
  const activeSet = new Set(activeCategories);
  const visibleItems = items.filter((item) => activeSet.has(item.category));
  const cleanSearch = normalize(searchTerm);

  if (!cleanSearch) {
    return visibleItems.map((item) => ({
      ...item,
      matchScore: 0,
      matchReasons: [],
    }));
  }

  return visibleItems
    .map((item) => scoreItem(item, cleanSearch))
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.name.localeCompare(b.name);
    });
}

export function getSearchSuggestions(items, activeCategories, limit = 10) {
  const activeSet = new Set(activeCategories);
  const terms = new Map();

  function addTerm(term, weight = 1) {
    const clean = normalize(term);
    if (!clean || clean.length < 3 || STOP_WORDS.has(clean)) return;
    terms.set(clean, (terms.get(clean) || 0) + weight);
  }

  items
    .filter((item) => activeSet.has(item.category))
    .forEach((item) => {
      const category = getCategory(item);
      addTerm(category?.label, 8);
      addTerm(item.type, 6);
      addTerm(item.name, 3);

      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => addTerm(tag, 4));
      }
    });

  return [...terms.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, limit);
}
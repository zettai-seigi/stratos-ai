/**
 * Fuzzy Matcher Utilities
 * String matching functions for AI-powered column mapping
 */

// =============================================================================
// STRING NORMALIZATION
// =============================================================================

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove special characters
 * - Collapse whitespace
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_\-\s]+/g, '') // Remove separators
    .replace(/[^a-z0-9]/g, ''); // Remove special chars
}

/**
 * Normalize while preserving word boundaries
 */
export function normalizeWithSpaces(text: string): string {
  return text
    .toLowerCase()
    .replace(/[_\-]+/g, ' ') // Convert separators to spaces
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  return normalizeWithSpaces(text)
    .split(' ')
    .filter(word => word.length > 0);
}

// =============================================================================
// LEVENSHTEIN DISTANCE
// =============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Handle empty strings
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Create distance matrix
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= aLen; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[aLen][bLen];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

// =============================================================================
// FUZZY MATCHING
// =============================================================================

/**
 * Calculate fuzzy match score between two strings (0-100)
 */
export function fuzzyMatch(source: string, target: string): number {
  const normalizedSource = normalize(source);
  const normalizedTarget = normalize(target);

  // Exact match after normalization
  if (normalizedSource === normalizedTarget) {
    return 100;
  }

  // One contains the other
  if (normalizedSource.includes(normalizedTarget)) {
    return 85 + (normalizedTarget.length / normalizedSource.length) * 10;
  }
  if (normalizedTarget.includes(normalizedSource)) {
    return 85 + (normalizedSource.length / normalizedTarget.length) * 10;
  }

  // Levenshtein similarity
  const similarity = levenshteinSimilarity(normalizedSource, normalizedTarget);
  return Math.round(similarity * 80); // Max 80 for non-exact matches
}

/**
 * Find best match from a list of targets
 */
export function findBestMatch(
  source: string,
  targets: string[]
): { target: string; score: number; index: number } | null {
  let bestMatch: { target: string; score: number; index: number } | null = null;

  for (let i = 0; i < targets.length; i++) {
    const score = fuzzyMatch(source, targets[i]);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { target: targets[i], score, index: i };
    }
  }

  // Only return if score is above threshold
  return bestMatch && bestMatch.score >= 50 ? bestMatch : null;
}

/**
 * Find all matches above a threshold
 */
export function findAllMatches(
  source: string,
  targets: string[],
  threshold: number = 50
): Array<{ target: string; score: number; index: number }> {
  const matches: Array<{ target: string; score: number; index: number }> = [];

  for (let i = 0; i < targets.length; i++) {
    const score = fuzzyMatch(source, targets[i]);
    if (score >= threshold) {
      matches.push({ target: targets[i], score, index: i });
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

// =============================================================================
// WORD-BASED MATCHING
// =============================================================================

/**
 * Calculate word overlap score (0-100)
 * Good for multi-word headers like "Project Name" vs "name"
 */
export function wordOverlapScore(source: string, target: string): number {
  const sourceWords = new Set(extractWords(source));
  const targetWords = new Set(extractWords(target));

  if (sourceWords.size === 0 || targetWords.size === 0) {
    return 0;
  }

  // Count overlapping words
  let overlap = 0;
  for (const word of sourceWords) {
    if (targetWords.has(word)) {
      overlap++;
    }
  }

  // Calculate Jaccard similarity
  const union = new Set([...sourceWords, ...targetWords]).size;
  const jaccard = overlap / union;

  return Math.round(jaccard * 100);
}

/**
 * Check if source contains all words from target
 */
export function containsAllWords(source: string, targetWords: string[]): boolean {
  const sourceNormalized = normalizeWithSpaces(source);
  return targetWords.every(word =>
    sourceNormalized.includes(normalize(word))
  );
}

// =============================================================================
// SEMANTIC MATCHING
// =============================================================================

/** Common abbreviations and their expansions */
const ABBREVIATIONS: Record<string, string[]> = {
  id: ['identifier', 'identification'],
  desc: ['description'],
  mgr: ['manager'],
  pm: ['project manager'],
  dept: ['department'],
  org: ['organization', 'organisation'],
  est: ['estimated', 'estimate'],
  act: ['actual'],
  hrs: ['hours'],
  pct: ['percent', 'percentage'],
  amt: ['amount'],
  qty: ['quantity'],
  num: ['number'],
  dt: ['date'],
  yr: ['year'],
  mo: ['month'],
  wk: ['week'],
  fy: ['fiscal year'],
  seq: ['sequence'],
  cat: ['category'],
  stat: ['status'],
  rag: ['red amber green'],
  wbs: ['work breakdown structure'],
  kpi: ['key performance indicator'],
  bsc: ['balanced scorecard'],
};

/**
 * Expand abbreviations in text
 */
export function expandAbbreviations(text: string): string[] {
  const normalized = normalize(text);
  const results = [text];

  for (const [abbrev, expansions] of Object.entries(ABBREVIATIONS)) {
    if (normalized === abbrev || normalized.includes(abbrev)) {
      for (const expansion of expansions) {
        results.push(text.replace(new RegExp(abbrev, 'gi'), expansion));
      }
    }
  }

  return results;
}

/**
 * Match with abbreviation expansion
 */
export function fuzzyMatchWithAbbreviations(
  source: string,
  target: string
): number {
  // Try direct match first
  const directScore = fuzzyMatch(source, target);

  // Try with abbreviation expansions
  const sourceExpansions = expandAbbreviations(source);
  const targetExpansions = expandAbbreviations(target);

  let bestScore = directScore;

  for (const s of sourceExpansions) {
    for (const t of targetExpansions) {
      const score = fuzzyMatch(s, t);
      if (score > bestScore) {
        bestScore = score;
      }
    }
  }

  return bestScore;
}

// =============================================================================
// COMPOSITE MATCHING
// =============================================================================

/**
 * Calculate comprehensive match score using multiple strategies
 */
export function compositeMatch(
  source: string,
  target: string,
  aliases: string[] = []
): { score: number; reason: string } {
  // Check exact match with target
  if (normalize(source) === normalize(target)) {
    return { score: 100, reason: 'Exact match' };
  }

  // Check aliases
  for (const alias of aliases) {
    if (normalize(source) === normalize(alias)) {
      return { score: 98, reason: `Alias match: "${alias}"` };
    }
  }

  // Calculate various scores
  const fuzzyScore = fuzzyMatchWithAbbreviations(source, target);
  const wordScore = wordOverlapScore(source, target);

  // Check aliases with fuzzy matching
  let bestAliasScore = 0;
  let bestAlias = '';
  for (const alias of aliases) {
    const aliasScore = fuzzyMatchWithAbbreviations(source, alias);
    if (aliasScore > bestAliasScore) {
      bestAliasScore = aliasScore;
      bestAlias = alias;
    }
  }

  // Return best score with reason
  if (bestAliasScore >= fuzzyScore && bestAliasScore >= wordScore && bestAliasScore >= 60) {
    return { score: bestAliasScore, reason: `Similar to alias: "${bestAlias}"` };
  }

  if (wordScore >= fuzzyScore && wordScore >= 60) {
    return { score: wordScore, reason: 'Word overlap match' };
  }

  if (fuzzyScore >= 60) {
    return { score: fuzzyScore, reason: 'Fuzzy string match' };
  }

  return { score: Math.max(fuzzyScore, wordScore, bestAliasScore), reason: 'Low confidence' };
}

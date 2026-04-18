/**
 * GUJARATI TRANSLITERATION-AWARE NAME NORMALIZER
 */

// Gujarati surname normalization map
const SURNAME_MAP: Record<string, string> = {
  'ptl': 'patel', 'patil': 'patel', 'patell': 'patel', 'patel': 'patel',
  'paatel': 'patel', 'pateel': 'patel',
  'kmr': 'kumar', 'cumar': 'kumar', 'kumaar': 'kumar', 'kumar': 'kumar',
  'kumarr': 'kumar',
  'sing': 'singh', 'sigh': 'singh', 'singhh': 'singh', 'singh': 'singh',
  'singg': 'singh',
  'sha': 'shah', 'shha': 'shah', 'shaah': 'shah', 'shah': 'shah',
  'dsai': 'desai', 'desaai': 'desai', 'dezai': 'desai', 'desai': 'desai',
  'meta': 'mehta', 'mehata': 'mehta', 'metha': 'mehta', 'mehta': 'mehta',
  'josi': 'joshi', 'jooshi': 'joshi', 'joshi': 'joshi',
  'trivadi': 'trivedi', 'trivedi': 'trivedi', 'triwedi': 'trivedi',
  'solanky': 'solanki', 'solnki': 'solanki', 'solanki': 'solanki',
  'davi': 'devi', 'devi': 'devi', 'dbi': 'devi',
  'bhai': '', 'bha': '', 'ben': '', 'bhen': '',
  'roa': 'rao', 'rao': 'rao',
  'jain': 'jain', 'jane': 'jain',
  'chaudhari': 'chaudhary', 'chaudhry': 'chaudhary', 'choudhary': 'chaudhary',
  'thakkar': 'thakur', 'takur': 'thakur', 'thakur': 'thakur',
  'bhat': 'bhatt', 'bhatt': 'bhatt', 'bhatta': 'bhatt',
  'parikh': 'parikh', 'parih': 'parikh',
  'pandya': 'pandya', 'pandiya': 'pandya',
  'modi': 'modi', 'mode': 'modi',
  'amin': 'amin', 'ameen': 'amin',
};

const PHONETIC_SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/aa/g, 'a'],
  [/ee/g, 'i'],
  [/oo/g, 'u'],
  [/bh/g, 'b'],
  [/kh/g, 'k'],
  [/gh/g, 'g'],
  [/ch/g, 'c'],
  [/jh/g, 'j'],
  [/th/g, 't'],
  [/dh/g, 'd'],
  [/ph/g, 'p'],
  [/sh/g, 's'],
  [/vy/g, 'v'],
  [/[aeiou]+/g, 'a'],
  [/(.)(\1)+/g, '$1'],
];

export function normalizeGujarati(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();
  normalized = normalized.replace(/[^a-z\s-]/g, '');

  const tokens = normalized.split(/\s+/).filter(Boolean);

  const normalizedTokens = tokens.map(token => {
    if (SURNAME_MAP[token] !== undefined) {
      return SURNAME_MAP[token];
    }
    let phonetic = token;
    for (const [pattern, replacement] of PHONETIC_SUBSTITUTIONS) {
      phonetic = phonetic.replace(pattern, replacement);
    }
    return phonetic;
  }).filter(Boolean);

  return normalizedTokens.join(' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;
  if (a === b) return 0;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

export function nameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;

  const rawA = name1.toLowerCase().trim();
  const rawB = name2.toLowerCase().trim();
  const maxLen = Math.max(rawA.length, rawB.length);
  const rawDist = levenshteinDistance(rawA, rawB);
  const rawSimilarity = maxLen > 0 ? (1 - rawDist / maxLen) * 100 : 0;

  const normA = normalizeGujarati(name1);
  const normB = normalizeGujarati(name2);
  const normMaxLen = Math.max(normA.length, normB.length);
  const normDist = normA && normB ? levenshteinDistance(normA, normB) : maxLen;
  const normSimilarity = normMaxLen > 0 ? (1 - normDist / normMaxLen) * 100 : 0;

  const tokensA = new Set(rawA.split(/\s+/));
  const tokensB = new Set(rawB.split(/\s+/));
  const intersection = [...tokensA].filter(t => tokensB.has(t));
  const tokenSimilarity = (intersection.length / Math.max(tokensA.size, tokensB.size)) * 100;

  return Math.max(rawSimilarity, normSimilarity, tokenSimilarity);
}

import {
  TfIdf,
  WordTokenizer,
  AggressiveTokenizer,
} from "natural";
import { distance as levenshteinDistance } from "fastest-levenshtein";

export type MatchCandidate = {
  id: number;
  description: string;
  longDescription?: string | null;
  technicalSpecifications?: Record<string, unknown>;
  unitOfMeasurement: string;
  category?: string | null;
  manufacturerPartNumber?: string | null;
};

export type AttributeScores = {
  description: number;
  specification: number;
  unit: number;
  manufacturer: number;
  category: number;
};

export type MatchResult = {
  sourceId: number;
  targetId: number;
  matchType:
    | "identical"
    | "duplicate"
    | "near_duplicate"
    | "functional_equivalent"
    | "specification_match";
  confidence: "exact" | "high" | "medium" | "low";
  similarityScore: number;
  attributeScores: AttributeScores;
  recommendationReason: string;
};

const stopwords = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","as","is","was","are","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","must","shall","can","need","dare","ought","used","this","that","these","those","i","me","my","myself","we","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","whose","where","when","why","how","all","each","every","both","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","just","also","new","old","long","last","first","good","well","pkg","set","pcs","piece","pieces","unit","units","nos","number","lot","assembly","sub","complete","required","make","makes","brand","brands","equivalent","eqvt","or","similar","approved","vendor","manufacturer","supplied","supply","material","materials","item","items","code","description","specification","specifications","standard","as","per","iso","din","bs","astm","jis","is","iee","iec",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\r\n]+/g, " ")
    .replace(/[^a-z0-9\s%.\/×*\-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const tokenizer = new WordTokenizer();
  return tokenizer
    .tokenize(normalize(text)) ?? [];
}

export function meaningfulTokens(text: string): string[] {
  return tokenize(text).filter((t) => t.length > 1 && !stopwords.has(t));
}

function specVector(spec: Record<string, unknown>): string {
  return Object.entries(spec || {})
    .map(([k, v]) => `${k} ${v}`)
    .join(" ");
}

function normalizeUom(uom: string): string {
  const map: Record<string, string> = {
    kg: "kilogram",
    kgs: "kilogram",
    gm: "gram",
    gms: "gram",
    g: "gram",
    mt: "metric_ton",
    ton: "metric_ton",
    tons: "metric_ton",
    l: "litre",
    lt: "litre",
    ltr: "litre",
    ltrs: "litre",
    ml: "millilitre",
    m: "meter",
    mtr: "meter",
    mtrs: "meter",
    nos: "number",
    no: "number",
    "no.s": "number",
    pc: "piece",
    pcs: "piece",
    set: "set",
    sets: "set",
    ea: "each",
    "ea.": "each",
    pair: "pair",
    pairs: "pair",
    pack: "pack",
    packs: "pack",
    box: "box",
    boxes: "box",
    roll: "roll",
    rolls: "roll",
    drum: "drum",
    drums: "drum",
    bag: "bag",
    bags: "bag",
    bundle: "bundle",
    bundles: "bundle",
  };
  return map[normalize(uom)] || normalize(uom);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function cosineSimilarity(a: string, b: string): number {
  const tfidf = new TfIdf();
  tfidf.addDocument(a);
  tfidf.addDocument(b);
  const termsA: Record<string, number> = {};
  const termsB: Record<string, number> = {};
  tfidf.listTerms(0).forEach((t) => (termsA[t.term] = t.tfidf));
  tfidf.listTerms(1).forEach((t) => (termsB[t.term] = t.tfidf));
  const allTerms = new Set([...Object.keys(termsA), ...Object.keys(termsB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  allTerms.forEach((term) => {
    const va = termsA[term] || 0;
    const vb = termsB[term] || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function compareSpecifications(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): number {
  const keysA = Object.keys(a || {});
  const keysB = Object.keys(b || {});
  if (keysA.length === 0 && keysB.length === 0) return 0.5;
  if (keysA.length === 0 || keysB.length === 0) return 0.1;

  const common = keysA.filter((k) => keysB.includes(k));
  if (common.length === 0) return 0.2;

  let matched = 0;
  common.forEach((k) => {
    const va = normalize(String(a[k]));
    const vb = normalize(String(b[k]));
    if (va === vb) {
      matched += 1;
    } else {
      const tokensA = meaningfulTokens(va);
      const tokensB = meaningfulTokens(vb);
      const sim = jaccard(tokensA, tokensB);
      if (sim > 0.8) matched += 1;
      else if (sim > 0.5) matched += 0.5;
    }
  });

  return matched / Math.max(keysA.length, keysB.length);
}

function compareManufacturer(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0.5;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  const dist = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - dist / maxLen);
}

function compareUom(a: string, b: string): number {
  const ua = normalizeUom(a);
  const ub = normalizeUom(b);
  if (ua === ub) return 1;
  const dist = levenshteinDistance(ua, ub);
  const maxLen = Math.max(ua.length, ub.length);
  return Math.max(0, 1 - dist / maxLen);
}

function inferMatchType(
  overall: number,
  desc: number,
  spec: number,
  uom: number,
  mpn: number
): MatchResult["matchType"] {
  if (overall >= 0.96 && desc >= 0.95 && uom >= 0.95) return "identical";
  if (overall >= 0.9 && desc >= 0.9) return "duplicate";
  if (overall >= 0.8 && (desc >= 0.85 || spec >= 0.85)) return "near_duplicate";
  if (overall >= 0.65 && spec >= 0.7 && uom >= 0.8) return "specification_match";
  if (overall >= 0.55 && (spec >= 0.6 || desc >= 0.65)) return "functional_equivalent";
  return "functional_equivalent";
}

function confidenceFromScore(score: number): MatchResult["confidence"] {
  if (score >= 0.92) return "exact";
  if (score >= 0.8) return "high";
  if (score >= 0.65) return "medium";
  return "low";
}

function reasonForMatch(r: Omit<MatchResult, "recommendationReason">): string {
  const parts: string[] = [];
  if (r.attributeScores.description >= 0.9)
    parts.push("description tokens highly aligned");
  else if (r.attributeScores.description >= 0.7)
    parts.push("description semantically similar");

  if (r.attributeScores.specification >= 0.8)
    parts.push("technical specifications match closely");
  else if (r.attributeScores.specification >= 0.6)
    parts.push("technical specifications partially overlap");

  if (r.attributeScores.unit >= 0.95) parts.push("same unit of measurement");
  if (r.attributeScores.manufacturer >= 0.95) parts.push("same manufacturer/part number");

  if (parts.length === 0) parts.push("general functional overlap detected by AI matcher");
  return `${r.matchType.replace(/_/g, " ")}: ${parts.join("; ")}.`;
}

export function compareMaterials(
  source: MatchCandidate,
  target: MatchCandidate
): MatchResult {
  const textA = [source.description, source.longDescription || ""].join(" ");
  const textB = [target.description, target.longDescription || ""].join(" ");

  const descScore = cosineSimilarity(normalize(textA), normalize(textB));
  const specScore = compareSpecifications(
    source.technicalSpecifications || {},
    target.technicalSpecifications || {}
  );
  const uomScore = compareUom(source.unitOfMeasurement, target.unitOfMeasurement);
  const mpnScore = compareManufacturer(
    source.manufacturerPartNumber,
    target.manufacturerPartNumber
  );
  const catScore = jaccard(
    meaningfulTokens(source.category || ""),
    meaningfulTokens(target.category || "")
  );

  const weights = {
    description: 0.45,
    specification: 0.25,
    unit: 0.1,
    manufacturer: 0.1,
    category: 0.1,
  };

  const overall =
    descScore * weights.description +
    specScore * weights.specification +
    uomScore * weights.unit +
    mpnScore * weights.manufacturer +
    catScore * weights.category;

  const matchType = inferMatchType(overall, descScore, specScore, uomScore, mpnScore);
  const confidence = confidenceFromScore(overall);

  const result: MatchResult = {
    sourceId: source.id,
    targetId: target.id,
    matchType,
    confidence,
    similarityScore: Number(overall.toFixed(4)),
    attributeScores: {
      description: Number(descScore.toFixed(4)),
      specification: Number(specScore.toFixed(4)),
      unit: Number(uomScore.toFixed(4)),
      manufacturer: Number(mpnScore.toFixed(4)),
      category: Number(catScore.toFixed(4)),
    },
    recommendationReason: "",
  };
  result.recommendationReason = reasonForMatch(result);
  return result;
}

export function batchCompare(
  sources: MatchCandidate[],
  targets: MatchCandidate[],
  options: { minScore?: number; sameCpse?: boolean } = {}
): MatchResult[] {
  const { minScore = 0.5 } = options;
  const results: MatchResult[] = [];
  for (const source of sources) {
    for (const target of targets) {
      if (source.id === target.id) continue;
      const r = compareMaterials(source, target);
      if (r.similarityScore >= minScore) {
        results.push(r);
      }
    }
  }
  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}

export function clusterDuplicates(
  materials: MatchCandidate[],
  threshold = 0.85
): number[][] {
  const parent = new Map<number, number>();
  const find = (x: number) => {
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  };
  const union = (x: number, y: number) => {
    parent.set(find(x), find(y));
  };

  materials.forEach((m) => parent.set(m.id, m.id));

  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      const r = compareMaterials(materials[i], materials[j]);
      if (r.similarityScore >= threshold) {
        union(materials[i].id, materials[j].id);
      }
    }
  }

  const clusters = new Map<number, number[]>();
  materials.forEach((m) => {
    const root = find(m.id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(m.id);
  });

  return Array.from(clusters.values()).filter((c) => c.length > 1);
}

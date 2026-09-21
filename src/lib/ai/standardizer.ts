import { meaningfulTokens, normalize } from "./matcher";

export type StandardizationInput = {
  description: string;
  longDescription?: string | null;
  technicalSpecifications?: Record<string, unknown>;
  unitOfMeasurement: string;
  category?: string | null;
  manufacturerPartNumber?: string | null;
};

export type StandardizationOutput = {
  unifiedDescription: string;
  category: string;
  subCategory: string;
  taxonomySegment: string;
  taxonomyFamily: string;
  taxonomyClass: string;
  taxonomyCommodity: string;
  normalizedSpecs: Record<string, unknown>;
  industryStandards: string[];
};

const categoryRules: { keywords: string[]; category: string; subCategory: string }[] = [
  { keywords: ["valve", "gate valve", "globe valve", "ball valve", "butterfly valve", "check valve"], category: "Mechanical", subCategory: "Valves" },
  { keywords: ["pump", "centrifugal pump", "submersible pump", "boiler feed pump"], category: "Mechanical", subCategory: "Pumps" },
  { keywords: ["bearing", "ball bearing", "roller bearing", "thrust bearing"], category: "Mechanical", subCategory: "Bearings" },
  { keywords: ["motor", "induction motor", "electric motor", "dc motor"], category: "Electrical", subCategory: "Motors" },
  { keywords: ["cable", "power cable", "control cable", "lt cable", "ht cable"], category: "Electrical", subCategory: "Cables" },
  { keywords: ["transformer", "power transformer", "distribution transformer"], category: "Electrical", subCategory: "Transformers" },
  { keywords: ["switchgear", "circuit breaker", "mccb", "acb", "contactor", "relay"], category: "Electrical", subCategory: "Switchgear" },
  { keywords: ["pipe", "tube", "pipeline", "seamless pipe", "erw pipe"], category: "Piping", subCategory: "Pipes & Tubes" },
  { keywords: ["fitting", "elbow", "tee", "reducer", "flange", "union"], category: "Piping", subCategory: "Fittings" },
  { keywords: ["steel", "ms plate", "ss plate", "angle", "channel", "beam"], category: "Metals", subCategory: "Steel Products" },
  { keywords: ["lubricant", "grease", "oil", "hydraulic oil", "engine oil"], category: "Consumables", subCategory: "Lubricants" },
  { keywords: ["safety", "helmet", "gloves", "shoes", "harness", "goggle"], category: "Safety", subCategory: "PPE" },
  { keywords: ["instrument", "transmitter", "sensor", "gauge", "flow meter"], category: "Instrumentation", subCategory: "Instruments" },
  { keywords: ["chemical", "acid", "solvent", "resin", "catalyst"], category: "Chemicals", subCategory: "Process Chemicals" },
  { keywords: ["tool", "hand tool", "power tool", "wrench", "drill"], category: "Tools", subCategory: "Industrial Tools" },
];

const taxonomyMap: Record<string, { segment: string; family: string; class: string; commodity: string }> = {
  Valves: { segment: "MRO", family: "Fluid Control", class: "Valves", commodity: "Industrial Valves" },
  Pumps: { segment: "MRO", family: "Fluid Systems", class: "Pumps", commodity: "Rotodynamic Pumps" },
  Bearings: { segment: "MRO", family: "Rotating Equipment", class: "Bearings", commodity: "Anti-Friction Bearings" },
  Motors: { segment: "CAPEX", family: "Electrical Machines", class: "Motors", commodity: "Induction Motors" },
  Cables: { segment: "CAPEX", family: "Electrical Distribution", class: "Cables", commodity: "Power Cables" },
  Transformers: { segment: "CAPEX", family: "Electrical Distribution", class: "Transformers", commodity: "Power Transformers" },
  Switchgear: { segment: "CAPEX", family: "Electrical Protection", class: "Switchgear", commodity: "Circuit Breakers" },
  "Pipes & Tubes": { segment: "CAPEX", family: "Piping Systems", class: "Pipes", commodity: "Carbon Steel Pipes" },
  Fittings: { segment: "CAPEX", family: "Piping Systems", class: "Fittings", commodity: "Buttweld Fittings" },
  "Steel Products": { segment: "Raw Material", family: "Metals", class: "Steel", commodity: "Structural Steel" },
  Lubricants: { segment: "Consumables", family: "Maintenance", class: "Lubricants", commodity: "Industrial Oils" },
  PPE: { segment: "Consumables", family: "Safety", class: "PPE", commodity: "Safety Helmets" },
  Instruments: { segment: "CAPEX", family: "Automation", class: "Instrumentation", commodity: "Process Transmitters" },
  "Process Chemicals": { segment: "Consumables", family: "Chemicals", class: "Process Chemicals", commodity: "Industrial Solvents" },
  "Industrial Tools": { segment: "Consumables", family: "Tools", class: "Hand Tools", commodity: "Wrenches" },
};

const standardKeywords: Record<string, string> = {
  "ms": "Mild Steel",
  "ss": "Stainless Steel",
  "cs": "Carbon Steel",
  "gi": "Galvanized Iron",
  "crca": "Cold Rolled Close Annealed",
  "hr": "Hot Rolled",
  "erw": "Electric Resistance Welded",
  "swg": "Standard Wire Gauge",
  "bsp": "British Standard Pipe",
  "npt": "National Pipe Thread",
  " ansi ": " ANSI ",
  "din": "DIN",
  "iso": "ISO",
  "api": "API",
  "iee": "IEC",
};

function expandAbbreviations(text: string): string {
  let result = ` ${text.toLowerCase()} `;
  Object.entries(standardKeywords).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    result = result.replace(regex, full);
  });
  return result.trim();
}

function classify(description: string): { category: string; subCategory: string } {
  const norm = normalize(description);
  let bestScore = 0;
  let best = { category: "General", subCategory: "General" };

  for (const rule of categoryRules) {
    const score = rule.keywords.reduce((acc, kw) => {
      if (norm.includes(normalize(kw))) acc += 1;
      return acc;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      best = { category: rule.category, subCategory: rule.subCategory };
    }
  }
  return best;
}

function extractDimensions(specs: Record<string, unknown>, description: string): string {
  const candidates: string[] = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") {
      candidates.push(`${label}: ${value}`);
    }
  };
  add("Size", specs.size ?? specs.diameter ?? specs.nominal_size);
  add("Pressure Rating", specs.pressure_rating ?? specs.class ?? specs.rating);
  add("Material Grade", specs.grade ?? specs.material_grade);
  add("Length", specs.length);
  add("Voltage", specs.voltage ?? specs.volt);
  add("Power", specs.power ?? specs.kw);
  add("Current", specs.current ?? specs.ampere);
  add("Capacity", specs.capacity ?? specs.flow_rate);

  if (candidates.length > 0) return candidates.join(", ");

  // Fallback: pull numeric patterns from description
  const matches = description.match(/\b\d+(\.\d+)?\s*(mm|cm|m|inch|in|kg|kva|kw|hp|a|v|bar|psi)\b/gi);
  if (matches && matches.length > 0) return matches.slice(0, 4).join(", ");
  return "";
}

function extractStandards(text: string): string[] {
  const standards: string[] = [];
  const patterns = [
    /\bISO\s?\d+[\/:\-\d]*/gi,
    /\bASTM\s?[A-Z]?\d+[\/\-\w]*/gi,
    /\bDIN\s?\d+[\/\-\w]*/gi,
    /\bBS\s?\d+[\/\-\w]*/gi,
    /\bAPI\s?\d+[\/\-\w]*/gi,
    /\bIEC\s?\d+[\/\-\w]*/gi,
    /\bIS\s?\d+[\/:\-\d]*/gi,
    /\bJIS\s?[A-Z]?\d+[\/\-\w]*/gi,
  ];
  patterns.forEach((p) => {
    const m = text.match(p);
    if (m) standards.push(...m);
  });
  return Array.from(new Set(standards)).slice(0, 5);
}

function normalizeSpecs(specs: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(specs || {}).forEach(([k, v]) => {
    const key = k
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+$/, "");
    out[key] = v;
  });
  return out;
}

export function standardizeMaterial(input: StandardizationInput): StandardizationOutput {
  const fullText = [input.description, input.longDescription || ""].join(" ");
  const classification = classify(fullText);
  const taxonomy = taxonomyMap[classification.subCategory] || {
    segment: "General",
    family: "General",
    class: "General",
    commodity: "General",
  };

  const expanded = expandAbbreviations(input.description);
  const dims = extractDimensions(input.technicalSpecifications || {}, fullText);
  const unified = dims
    ? `${expanded} (${dims}; UOM: ${input.unitOfMeasurement})`
    : `${expanded} (UOM: ${input.unitOfMeasurement})`;

  return {
    unifiedDescription: unified.replace(/\s+/g, " ").trim(),
    category: classification.category,
    subCategory: classification.subCategory,
    taxonomySegment: taxonomy.segment,
    taxonomyFamily: taxonomy.family,
    taxonomyClass: taxonomy.class,
    taxonomyCommodity: taxonomy.commodity,
    normalizedSpecs: normalizeSpecs(input.technicalSpecifications || {}),
    industryStandards: extractStandards(fullText),
  };
}

export function normalizeUomForStandard(uom: string): string {
  const map: Record<string, string> = {
    kgs: "KG",
    kg: "KG",
    gm: "GM",
    gms: "GM",
    l: "L",
    lt: "L",
    ltr: "L",
    ltrs: "L",
    m: "M",
    mtr: "M",
    mtrs: "M",
    nos: "NOS",
    no: "NOS",
    pc: "PC",
    pcs: "PC",
    set: "SET",
    sets: "SET",
    pair: "PAIR",
    pack: "PACK",
    box: "BOX",
    roll: "ROLL",
  };
  return map[uom.toLowerCase()] || uom.toUpperCase();
}

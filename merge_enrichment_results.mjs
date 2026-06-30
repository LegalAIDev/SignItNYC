import fs from "node:fs";
import path from "node:path";

const requestPath = "vestibule-enrichment-request.json";
const resultPath = "vestibule-enrichment-result.json";
const batchDir = "subagent_enrichment_results";

const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));
const leads = request.leads || [];
const byCamis = new Map(leads.map((lead) => [lead.camis, lead]));
const expectedKeys = Object.keys(leads[0] || {});
const mutableFields = new Set([
  "website",
  "email",
  "additional_emails",
  "instagram_or_social",
  "contact_name",
  "source_url",
  "confidence",
  "notes",
]);

function assertSameContext(original, candidate, file) {
  const keys = Object.keys(candidate);
  if (keys.join("\u0000") !== expectedKeys.join("\u0000")) {
    throw new Error(`${file}: key shape/order mismatch for camis ${candidate.camis}`);
  }

  for (const key of expectedKeys) {
    if (!mutableFields.has(key) && candidate[key] !== original[key]) {
      throw new Error(`${file}: context field ${key} changed for camis ${candidate.camis}`);
    }
  }

  if (candidate.confidence && !["high", "medium", "low"].includes(candidate.confidence)) {
    throw new Error(`${file}: invalid confidence '${candidate.confidence}' for camis ${candidate.camis}`);
  }
}

function hasEnrichment(candidate) {
  return [...mutableFields].some((field) => String(candidate[field] || "").trim());
}

const merged = request.leads.map((lead) => ({ ...lead }));
const mergedByCamis = new Map(merged.map((lead) => [lead.camis, lead]));
const files = fs.existsSync(batchDir)
  ? fs
      .readdirSync(batchDir)
      .filter((file) => file.endsWith(".json"))
      .sort((a, b) => {
        const aIsBatch = a.startsWith("batch-");
        const bIsBatch = b.startsWith("batch-");
        if (aIsBatch !== bIsBatch) return aIsBatch ? 1 : -1;
        return a.localeCompare(b);
      })
  : [];

const applied = [];
for (const file of files) {
  const fullPath = path.join(batchDir, file);
  const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${file}: expected a JSON array`);
  }

  for (const candidate of parsed) {
    const original = byCamis.get(candidate.camis);
    if (!original) {
      throw new Error(`${file}: unknown camis ${candidate.camis}`);
    }
    assertSameContext(original, candidate, file);

    if (hasEnrichment(candidate)) {
      const target = mergedByCamis.get(candidate.camis);
      for (const field of mutableFields) {
        const incoming = candidate[field] || "";
        if (!incoming && target[field]) continue;
        target[field] = incoming;
      }
      applied.push({ file, camis: candidate.camis, name: candidate.name });
    }
  }
}

fs.writeFileSync(resultPath, `${JSON.stringify({ ...request, leads: merged }, null, 2)}\n`);

const filled = merged.reduce(
  (acc, lead) => {
    if (lead.website) acc.website += 1;
    if (lead.email) acc.email += 1;
    if (lead.instagram_or_social) acc.social += 1;
    if (lead.source_url) acc.source += 1;
    if (lead.confidence) acc.confidence += 1;
    return acc;
  },
  { website: 0, email: 0, social: 0, source: 0, confidence: 0 },
);

console.log(
  JSON.stringify(
    {
      batchFiles: files.length,
      applied: applied.length,
      resultPath,
      leads: merged.length,
      filled,
    },
    null,
    2,
  ),
);

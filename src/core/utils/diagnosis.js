/* ===========================
   FixBot response helpers
   The backend answers in one of three shapes, always tagged with
   `source`:
     knowledge_base -> { results: [...] }
     ai             -> { likelyProblem, confidence, severity, causes, steps, ... }
     no_match       -> { message, reason, suggestions: [...] }
   These helpers let every FixBot UI branch on the same rules.
=========================== */

export function diagnosisKind(data) {
  if (!data || typeof data !== "object") return "no_match";
  if (data.source === "knowledge_base" && Array.isArray(data.results) && data.results.length > 0) {
    return "knowledge_base";
  }
  if (data.source === "ai" && typeof data.likelyProblem === "string" && data.likelyProblem) {
    return "ai";
  }
  return "no_match";
}

export const DEFAULT_NO_MATCH_MESSAGE =
  "We couldn't find a confident answer for this one. A technician can take a look — book a call or send your device in.";

export function noMatchMessage(data) {
  return (data && typeof data.message === "string" && data.message) || DEFAULT_NO_MATCH_MESSAGE;
}

/**
 * The AI's estimate is free text. Show naira amounts as-is, convert
 * explicit USD amounts, and otherwise show the text rather than
 * guessing (the old code multiplied every number by 1600, so "₦8,000"
 * displayed as ₦12,800,000).
 */
export const USD_TO_NAIRA = 1600;

export function formatEstimatedRepair(value) {
  if (value === null || value === undefined || value === "") return "Assessment required";
  const text = String(value).trim();
  const numbers = text.match(/\d[\d,]*(\.\d+)?/g);
  if (!numbers) return text;

  const isUsd = /\$|usd|dollar/i.test(text);
  const isNaira = /₦|ngn|naira|\bn\d/i.test(text);

  if (isUsd && !isNaira) {
    const amounts = numbers.map((n) => Math.round(Number(n.replace(/,/g, "")) * USD_TO_NAIRA));
    return amounts.map((a) => `₦${a.toLocaleString()}`).join(" – ");
  }

  return text;
}

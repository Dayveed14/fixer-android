import api, { TIMEOUTS } from "./client";

/**
 * Runs FixBot. Resolves to one of three shapes, always with `source`:
 *  - { source: "knowledge_base", results: [...] }
 *  - { source: "ai", likelyProblem, confidence, severity, causes, steps, ... }
 *  - { source: "no_match", message, reason, suggestions: [...] }
 * Works for guests; a logged-in user's session cookie is sent
 * automatically so the backend can attribute the request.
 */
export const runDiagnosis = ({
  deviceType,
  brand = "",
  primaryFault,
  selectedSymptoms = [],
  description = "",
}) =>
  api
    .post(
      "/api/diagnosis/run",
      { deviceType, brand, primaryFault, selectedSymptoms, description },
      { timeout: TIMEOUTS.diagnosis },
    )
    .then((r) => r.data);

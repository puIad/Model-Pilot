import { Model, Recommendation } from "@/types";

export interface AnonymizedCatalogResult {
  anonymizedModels: Model[];
  idMap: Record<string, string>; // originalId -> anonymousId
  reverseIdMap: Record<string, string>; // anonymousId -> originalId
}

/**
 * Anonymizes model catalog by replacing names and providers with neutral letters
 * and shuffling order to guarantee zero provider-name dependency.
 */
export function anonymizeCatalog(
  models: Model[],
  seed = 1337
): AnonymizedCatalogResult {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const idMap: Record<string, string> = {};
  const reverseIdMap: Record<string, string> = {};

  // Deterministic shuffle
  const shuffled = [...models];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const anonymizedModels: Model[] = shuffled.map((m, idx) => {
    const anonLetter = letters[idx % letters.length];
    const anonId = `model-${anonLetter.toLowerCase()}`;
    const anonName = `Model ${anonLetter}`;
    const anonProvider = `Provider ${idx + 1}`;

    idMap[m.id] = anonId;
    reverseIdMap[anonId] = m.id;

    return {
      ...m,
      id: anonId,
      displayName: anonName,
      provider: anonProvider,
      description: "Anonymized candidate model evaluated purely on capability and economics.",
    };
  });

  return {
    anonymizedModels,
    idMap,
    reverseIdMap,
  };
}

/**
 * Restores original identity to a recommendation produced under blind evaluation.
 */
export function restoreRecommendation(
  rec: Recommendation,
  reverseIdMap: Record<string, string>,
  originalModels: Model[]
): Recommendation {
  const originalId = reverseIdMap[rec.modelId] || rec.modelId;
  const originalModel = originalModels.find((m) => m.id === originalId);

  return {
    ...rec,
    modelId: originalId,
    modelName: originalModel ? originalModel.displayName : rec.modelName,
    provider: originalModel ? originalModel.provider : rec.provider,
    cheaperAlternative: rec.cheaperAlternative
      ? {
          ...rec.cheaperAlternative,
          modelId: reverseIdMap[rec.cheaperAlternative.modelId] || rec.cheaperAlternative.modelId,
          modelName:
            originalModels.find(
              (m) => m.id === (reverseIdMap[rec.cheaperAlternative!.modelId] || rec.cheaperAlternative!.modelId)
            )?.displayName || rec.cheaperAlternative.modelName,
          provider:
            originalModels.find(
              (m) => m.id === (reverseIdMap[rec.cheaperAlternative!.modelId] || rec.cheaperAlternative!.modelId)
            )?.provider || rec.cheaperAlternative.provider,
        }
      : undefined,
    reliabilityAlternative: rec.reliabilityAlternative
      ? {
          ...rec.reliabilityAlternative,
          modelId:
            reverseIdMap[rec.reliabilityAlternative.modelId] || rec.reliabilityAlternative.modelId,
          modelName:
            originalModels.find(
              (m) =>
                m.id ===
                (reverseIdMap[rec.reliabilityAlternative!.modelId] ||
                  rec.reliabilityAlternative!.modelId)
            )?.displayName || rec.reliabilityAlternative.modelName,
          provider:
            originalModels.find(
              (m) =>
                m.id ===
                (reverseIdMap[rec.reliabilityAlternative!.modelId] ||
                  rec.reliabilityAlternative!.modelId)
            )?.provider || rec.reliabilityAlternative.provider,
        }
      : undefined,
  };
}

/**
 * Swaps provider names and model IDs in a catalog to test anti-bias resilience (Section 16).
 */
export function swapModelIdentities(
  modelA: Model,
  modelB: Model
): [Model, Model] {
  // Model A gets Model B's identity (id, name, provider), keeps Model A's capabilities and pricing
  const swappedA: Model = {
    ...modelA,
    id: modelB.id,
    displayName: modelB.displayName,
    provider: modelB.provider,
  };

  // Model B gets Model A's identity, keeps Model B's capabilities and pricing
  const swappedB: Model = {
    ...modelB,
    id: modelA.id,
    displayName: modelA.displayName,
    provider: modelA.provider,
  };

  return [swappedA, swappedB];
}

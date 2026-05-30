import { prisma } from "../../lib/prisma";
import { REFERENCE_AMENITIES, REFERENCE_FEATURES } from "../data/reference-data";

export async function ensureReferenceData(): Promise<void> {
  try {
    const [featureResult, amenityResult] = await Promise.all([
      prisma.features.createMany({
        data: REFERENCE_FEATURES,
        skipDuplicates: true,
      }),
      prisma.amenity.createMany({
        data: REFERENCE_AMENITIES,
        skipDuplicates: true,
      }),
    ]);

    const created = featureResult.count + amenityResult.count;
    if (created > 0) {
      console.log(`Bootstrap reference data: ${featureResult.count} features, ${amenityResult.count} amenities`);
    }
  } catch (error) {
    console.warn("Skipped bootstrap reference data:", error);
  }
}

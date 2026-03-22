/*
  Warnings:

  - You are about to drop the column `propertyId` on the `Amenity` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Feature` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `Feature` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Amenity" DROP CONSTRAINT "Amenity_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Feature" DROP CONSTRAINT "Feature_propertyId_fkey";

-- AlterTable
ALTER TABLE "Amenity" DROP COLUMN "propertyId";

-- AlterTable
ALTER TABLE "Feature" DROP COLUMN "propertyId";

-- CreateTable
CREATE TABLE "_FeatureToProperty" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FeatureToProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AmenityToProperty" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AmenityToProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FeatureToProperty_B_index" ON "_FeatureToProperty"("B");

-- CreateIndex
CREATE INDEX "_AmenityToProperty_B_index" ON "_AmenityToProperty"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_key_key" ON "Feature"("key");

-- AddForeignKey
ALTER TABLE "_FeatureToProperty" ADD CONSTRAINT "_FeatureToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToProperty" ADD CONSTRAINT "_FeatureToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToProperty" ADD CONSTRAINT "_AmenityToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AmenityToProperty" ADD CONSTRAINT "_AmenityToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

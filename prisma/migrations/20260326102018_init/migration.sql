/*
  Warnings:

  - You are about to drop the `Feature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FeatureToProperty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_FeatureToProperty" DROP CONSTRAINT "_FeatureToProperty_A_fkey";

-- DropForeignKey
ALTER TABLE "_FeatureToProperty" DROP CONSTRAINT "_FeatureToProperty_B_fkey";

-- DropTable
DROP TABLE "Feature";

-- DropTable
DROP TABLE "_FeatureToProperty";

-- CreateTable
CREATE TABLE "Features" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "Features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FeaturesToProperty" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FeaturesToProperty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Features_key_key" ON "Features"("key");

-- CreateIndex
CREATE INDEX "_FeaturesToProperty_B_index" ON "_FeaturesToProperty"("B");

-- AddForeignKey
ALTER TABLE "_FeaturesToProperty" ADD CONSTRAINT "_FeaturesToProperty_A_fkey" FOREIGN KEY ("A") REFERENCES "Features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeaturesToProperty" ADD CONSTRAINT "_FeaturesToProperty_B_fkey" FOREIGN KEY ("B") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

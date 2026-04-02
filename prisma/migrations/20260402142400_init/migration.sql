/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `Amenity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Amenity_key_key" ON "Amenity"("key");

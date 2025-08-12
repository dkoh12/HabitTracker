/*
  Warnings:

  - A unique constraint covering the columns `[groupId,name]` on the table `SharedGroupHabit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SharedGroupHabit_groupId_name_key" ON "SharedGroupHabit"("groupId", "name");

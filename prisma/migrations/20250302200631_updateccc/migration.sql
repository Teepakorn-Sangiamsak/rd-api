/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `category` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `category_name_key` ON `category`(`name`);
